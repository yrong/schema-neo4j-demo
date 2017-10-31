const _ = require('lodash')
const scirichon_cache = require('scirichon-cache')
const uuid_validator = require('uuid-validate')
const common = require('scirichon-common')
const ScirichonError = common.ScirichonError

const single_converter = async (key,value)=>{
    let uuid,cached_val
    if(uuid_validator(value)||_.isInteger(value)){
        cached_val = await scirichon_cache.getItemByCategoryAndID(key,value)
    }else{
        cached_val = await scirichon_cache.getItemByCategoryAndName(key,value)
    }
    if(cached_val&&cached_val.uuid)
        uuid = cached_val.uuid
    else
        throw new ScirichonError(`can not find category '${key}' with name or id as '${value}' in cmdb`)
    return uuid
}
const array_converter = async (key,values)=>{
    let uuids = []
    for(let value of values){
        uuids.push(await single_converter(key,value))
    }
    return uuids
}

const refConverter = async (key,value)=>{
    if(_.isArray(value))
        return await array_converter(key,value)
    else
        return await single_converter(key,value)
}


module.exports = refConverter

