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

const pullBucketField =  (val) => {
    let keys = _.keys(val)
    for(let key of keys){
        if(val[key]['buckets']&&_.isArray(val[key]['buckets'])){
            val[key] = val[key]['buckets']
            for(let internal_val of val[key]){
                pullBucketField(internal_val)
            }
        }
    }
    return val
}


const memberCombine = (result,params)=>{
    let schema_obj = schema.getSchema(params.category)
    if(schema_obj.getMember){
        if(result.self){
            if(result.members){
                result = _.merge(result.self,{members:result.members})
            }else{
                result = result.self
            }
            return result
        }
    }
    return result
}

const referencedObjectMapper = async (val,props)=>{
    if(_.isObject(val)&&props.properties){
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

const parse2JsonObject = async (val,params)=>{
    let properties = schema.getSchemaProperties(val.category||params.category)
    for (let key in val) {
        if (val[key] && properties[key]) {
            if (properties[key].type === 'object' || (properties[key].type === 'array' && properties[key].items.type === 'object')) {
                if (_.isString(val[key])) {
                    try{
                        val[key] = JSON.parse(val[key])
                    }catch(err){
                        //ignore
                    }
                }
            }
        }
    }
    return val
}

const uuid2ReferencedObject = async (val,params)=>{
    let properties = schema.getSchemaProperties(val.category||params.category),objs,obj
    for (let key in val) {
        if (val[key] && properties[key]) {
            if(properties[key].schema&&_.isString(val[key])){
                val[key] = await scirichon_cache.getItemByCategoryAndID(properties[key].schema,val[key]) || val[key]
            }
            else if(val[key].length&&_.isString(val[key][0])&&properties[key].type==='array'&&properties[key].items.schema){
                objs = []
                for(let id of val[key]){
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
    return val
}


const resultMapper = async (val,params) => {
    if(!params.origional){
        val = await memberCombine(val,params)
    }
    val = await parse2JsonObject(val,params)
    if(!params.origional){
        val = await uuid2ReferencedObject(val,params)
    }
    return val
}

const cypherResponseMapper = async (val, params,ctx) => {
    let results = []
    if (_.isArray(val)) {
        for(let single of val){
            results.push(await resultMapper(single,params))
        }
        val = results
    }else{
        val = await resultMapper(val,params)
    }
    return val
}

const esResponseMapper = async function(result,params,ctx){
    if(params.aggs){
        result = result.aggregations
        result = await aggsReferencedMapper(result,params.category)
        result = removeAndRenameInternalProperties(result)
    }else{
        result =  {count:result.hits.total,results:_.map(result.hits.hits,(result)=>result._source)}
        if(result.count>0&&_.isArray(result.results)){
            result.results = await cypherResponseMapper(result.results, params)
        }
    }
    return result
}

module.exports = {
    cypherResponseMapper,esResponseMapper
}