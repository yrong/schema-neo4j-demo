const _ = require('lodash')
const uuid_validator = require('uuid-validate')
const scirichon_cache = require('scirichon-cache')
const schema = require('redis-json-schema')

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
    if(schema.getMemberType(params.category))
        result = propertiesCombine(result)
    result = await referencedMapper(result,params.origional?true:false)
    return result
}

module.exports = {
    resultMapper
}