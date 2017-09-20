const _ = require('lodash');
const cmdb_cache = require('scirichon-cache')
const schema = require('../schema')
const uuid_validator = require('uuid-validate')

const globalHiddenFields = ['fields', 'cyphers', 'method', 'data', 'token', 'fields_old', 'change', 'url', 'id', '_id', '_index', '_type','user']
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

const referencedMapper_assetLocation = async (val)=>{
    let asset_val = {}
    if(uuid_validator(val['cabinet'])){
        asset_val = val['cabinet']=await cmdb_cache.get(val['cabinet'])||val['cabinet']
    }
    if(uuid_validator(val['shelf'])){
        asset_val = val['shelf']=await cmdb_cache.get(val['shelf'])||val['shelf']
    }
    if(uuid_validator(asset_val['parent']))
        asset_val['parent']=await cmdb_cache.get(asset_val['parent'])||asset_val['parent']
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
        for (let key in val) {
            if(val[key]&&properties[key]){
                if(properties[key].schema){
                    val[key] = await cmdb_cache.get(val[key])
                }
                else if(val[key].length&&properties[key].type==='array'&&properties[key].items.schema){
                    let objs = []
                    for(let id of val[key]){
                        objs.push(await cmdb_cache.get(id))
                    }
                    val[key] = objs
                }
                else if(properties[key].type==='object'&&_.isString(val[key])){
                    try{
                        val[key] = JSON.parse(val[key])
                    }catch(error){
                    }
                    if(key === 'asset_location'&&val[key]){
                        await referencedMapper_assetLocation(val[key])
                    }
                }
            }
        }
    }
    return val;
}

var propertiesCombine = (results)=>{
    return _.map(results,(result)=>{
        if(result.self&&result.members){
            result = _.merge(result.self,{members:result.members})
            return result
        }
        return result
    })
}

const resultMapper = (result, params) => {
    if (params.category === schema.cmdbTypeName.ConfigurationItem || params.category === schema.cmdbTypeName.ProcessFlow)
        result = referencedMapper(result)
    if (params.category === schema.cmdbTypeName.ITServiceGroup || params.category === schema.cmdbTypeName.WareHouse || params.category === schema.cmdbTypeName.ServerRoom)
        result = propertiesCombine(result)
    result = removeInternalProperties(result)
    return result
}

module.exports = {
    resultMapper,
    globalHiddenFields
}