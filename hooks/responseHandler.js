const _ = require('lodash')
const uuid_validator = require('uuid-validate')
const config = require('config')
const scirichon_cache = require('scirichon-cache')
const schema = require('redis-json-schema')

const propertiesCombine = (results)=>{
    return _.map(results,(result)=>{
        if(result.self&&result.members){
            result = _.merge(result.self,{members:result.members})
            return result
        }
        return result
    })
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
}

const referencedMapper = async (val) => {
    let properties,results = []
    if (_.isArray(val)) {
        for(let single of val){
            results.push(await referencedMapper(single))
        }
        val = results
    } else if(val.category){
        properties = schema.getSchemaProperties(val.category)
        if(properties){
            for (let key in val) {
                if(val[key]&&properties[key]){
                    if(properties[key].type==='object'){
                        if(_.isString(val[key])){
                            val[key] = JSON.parse(val[key])
                        }
                    }
                    if(config.get('retrieveObjectFromId')){
                        if(properties[key].schema){
                            val[key] = await scirichon_cache.getItemByCategoryAndID(properties[key].schema,val[key]) || val[key]
                        }
                        else if(val[key].length&&properties[key].type==='array'&&properties[key].items.schema){
                            let objs = []
                            for(let id of val[key]){
                                objs.push(await scirichon_cache.getItemByCategoryAndID(properties[key].items.schema,id)||id)
                            }
                            val[key] = objs
                        }else if(properties[key].type==='object') {
                            await referencedObjectMapper(val[key], properties[key])
                        }
                    }
                }
            }
        }
    }
    return val;
}

const resultMapper = async (result, params) => {
    if(schema.getMemberType(params.category))
        result = propertiesCombine(result)
    if(!params.origional)
        result = referencedMapper(result)
    return result
}

module.exports = {
    resultMapper
}