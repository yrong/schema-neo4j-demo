const _ = require('lodash')
const cmdb_cache = require('scirichon-cache')
const uuid_validator = require('uuid-validate')
const schema = require('../schema')

const single_converter = (key,value)=>{
    let uuid,cached_val
    if(uuid_validator(value)){
        cached_val = cmdb_cache.getItemByCategoryAndID(key,value)
    }else if(key===schema.cmdbTypeName.User&&_.isInteger(value)){
        cached_val = cmdb_cache.getItemByCategoryAndID(key,value)
    }else{
        cached_val = cmdb_cache.getItemByCategoryAndName(key,value)
    }
    if(cached_val)
        uuid = cached_val.uuid
    else
        throw new Error(`can not find category '${key}' with name or id as '${value}' in cmdb`)
    return uuid
}
const array_converter = (key,values)=>{
    let uuids = _.map(values,(value)=>{
        return single_converter(key,value)
    })
    return uuids
}

const refConverter = (key,value)=>{
    if(_.isArray(value))
        return array_converter(key,value)
    else
        return single_converter(key,value)
}


module.exports = refConverter

