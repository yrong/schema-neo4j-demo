const _ = require('lodash')
const uuid_validator = require('uuid-validate')
const scirichon_cache = require('scirichon-cache')
const schema = require('redis-json-schema')

const removeAndRenameInternalProperties =  (val) => {
    if(_.isArray(val)) {
        val = _.map(val, function (val) {
            return removeAndRenameInternalProperties(val)
        });
    }else if(_.isObject(val)){
        for (let prop in val) {
            if(_.includes(['doc_count_error_upper_bound','sum_other_doc_count'],prop)){
                delete val[prop]
            }
            if(typeof val[prop] === 'object')
                removeAndRenameInternalProperties(val[prop])
        }
    }
    return val
}

const findRefCategory = (category,key)=>{
    let refs = schema.getSchemaRefProperties(category)
    for(let ref of refs){
        if(ref.attr===key){
            return ref.schema
        }
    }
}

const aggsMetaFields = ['key','key_as_string','buckets','doc_count','doc_count_error_upper_bound','sum_other_doc_count','ref_obj']

const aggsReferencedMapper =  async (val,category) => {
    let keys = _.keys(val)
    for(let key of keys){
        if(!_.includes(aggsMetaFields,key)){
            let ref_category = findRefCategory(category,key),cached_obj
            if(_.isArray(val[key]['buckets'])){
                for(let internal_val of val[key]['buckets']){
                    if(ref_category){
                        cached_obj = await scirichon_cache.getItemByCategoryAndID(key,internal_val.key)
                        internal_val.ref_obj = cached_obj
                    }
                    await aggsReferencedMapper(internal_val,category)
                }
            }
        }
    }
    return val
}

const propertiesCombine = (results)=>{
    if(_.isArray(results)&&results.length){
        return _.map(results,(result)=>{
            if(result.self&&result.members){
                result = _.merge(result.self,{members:result.members})
                return result
            }
            return result
        })
    }
    return results
}

const referencedObjectMapper = async (val,props)=>{
    if(props.properties){
        for(let key in props.properties){
            if(val[key]&&props.properties[key].schema){
                if(uuid_validator(val[key])){
                    val[key]= await scirichon_cache.getItemByCategoryAndID(props.properties[key].schema,val[key])||val[key]
                }
            }
        }
    }
    return val
}

const referencedMapper = async (val,origional) => {
    let properties,results = []
    if (_.isArray(val)) {
        for(let single of val){
            results.push(await referencedMapper(single,origional))
        }
        val = results
    } else if(val.category){
        properties = schema.getSchemaProperties(val.category)
        if(properties){
            for (let key in val) {
                if(val[key]&&properties[key]){
                    if(properties[key].type==='object'||(properties[key].type==='array'&&properties[key].items.type==='object')){
                        if(_.isString(val[key])){
                            val[key] = JSON.parse(val[key])
                        }
                    }
                    if(!origional){
                        if(properties[key].schema){
                            val[key] = await scirichon_cache.getItemByCategoryAndID(properties[key].schema,val[key]) || val[key]
                        }
                        else if(val[key].length&&properties[key].type==='array'&&properties[key].items.schema){

                            let objs = [],obj,id
                            for(id of val[key]){
                                obj = await scirichon_cache.getItemByCategoryAndID(properties[key].items.schema,id)||id
                                objs.push(obj)
                            }
                            val[key] = objs
                        }else if(properties[key].type==='object') {
                            val[key] = await referencedObjectMapper(val[key], properties[key])
                        }else if (properties[key].type === 'array' && properties[key].items.type === 'object') {
                            for (let entry of val[key]) {
                                entry = await referencedObjectMapper(entry, properties[key].items)
                            }
                        }
                    }
                }
            }
        }
    }
    return val;
}

const resultMapper = async (result, params,ctx) => {
    if(schema.getMemberType(params.category)&&!params.origional)
        result = propertiesCombine(result)
    result = await referencedMapper(result,params.origional?true:false)
    return result
}

const esResultMapper = async function(result,params,ctx){
    if(params.aggs){
        result = result.aggregations
        result = await aggsReferencedMapper(result,params.category)
        result = removeAndRenameInternalProperties(result)

    }else{
        result =  {count:result.hits.total,results:_.map(result.hits.hits,(result)=>result._source)}
        if(result.count>0&&_.isArray(result.results)){
            result.results = await resultMapper(result.results, params)
        }
    }
    return result
}

module.exports = {
    resultMapper,esResultMapper
}