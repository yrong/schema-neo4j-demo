const _ = require('lodash')
const scirichon_cache = require('scirichon-cache')
const uuid_validator = require('uuid-validate')
const common = require('scirichon-common')
const ScirichonError = common.ScirichonError

const checkReferenceId = async (key,value)=>{
    let uuid,cached_val
    if(uuid_validator(value)||common.isLegacyUserId(key,value)){
        cached_val = await scirichon_cache.getItemByCategoryAndID(key,value)
    }else{
        throw new ScirichonError(`category ${key} as ${value} is not in uuid format`)
    }
    if(cached_val&&cached_val.uuid)
        uuid = cached_val.uuid
    else
        throw new ScirichonError(`can not find category ${key} as ${value} in scirichon cache`)
    return uuid
}
const checkReferenceIds = async (key,values)=>{
    let uuids = []
    for(let value of values){
        uuids.push(await checkReferenceId(key,value))
    }
    return uuids
}

const checkReference = async (key,value)=>{
    if(_.isArray(value))
        return await checkReferenceIds(key,value)
    else
        return await checkReferenceId(key,value)
}


module.exports = checkReference

