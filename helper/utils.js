const _ = require('lodash');
const schema = require('redis-json-schema')
const scirichon_cache = require('scirichon-cache')
const uuid_validator = require('uuid-validate')
const config = require('config')

const globalHiddenFields = ['fields', 'cyphers', 'cypher','method', 'data', 'token', 'fields_old', 'change', 'url', '_id', '_index', '_type','user']
    , globalHiddenFieldsInAllLevel = ['passwd', 'id']

const removeInternalProperties = (val) => {
    for (let prop in val) {
        for(let hidden_prop of globalHiddenFields){
            if (prop === hidden_prop)
                delete val[prop];
        }
    }
    return recursivelyRemoveInternalProperties(val)
}

const recursivelyRemoveInternalProperties =  (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return recursivelyRemoveInternalProperties(val);
        });
    } else {
        for (let prop in val) {
            for(let hidden_prop of globalHiddenFieldsInAllLevel){
                if (prop === hidden_prop)
                    delete val[prop];
            }
            if (typeof val[prop] === 'object')
                if(prop !== 'status')//not remove 'fields' in field 'status'
                    recursivelyRemoveInternalProperties(val[prop]);
        }
    }
    return val;
}

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
                    val[key]= await scirichon_cache.get(val[key])||val[key]
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
                            val[key] = await scirichon_cache.get(val[key]) || val[key]
                        }
                        else if(val[key].length&&properties[key].type==='array'&&properties[key].items.schema){
                            let objs = []
                            for(let id of val[key]){
                                objs.push(await scirichon_cache.get(id)||id)
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
    result = removeInternalProperties(result)
    result = referencedMapper(result)
    return result
}

module.exports = {
    resultMapper,
    globalHiddenFields
}