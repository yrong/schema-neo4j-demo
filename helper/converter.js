const _ = require('lodash')
const cmdb_cache = require('cmdb-cache')

const single_converter = (key,name)=>{
    let uuid,cached_val = cmdb_cache.getItemByCategoryAndName(key,name)
    if(cached_val)
        uuid = cached_val.uuid
    else
        throw new Error(`can not find category '${key}' with name '${name}' in cmdb`)
    return uuid
}
const array_converter = (key,names)=>{
    let uuids = _.map(names,(name)=>{
        return single_converter(key,name)
    })
    return uuids
}

const name2IdConverter = (key,value)=>{
    if(_.isArray(value))
        return array_converter(key,value)
    else
        return single_converter(key,value)
}


module.exports = name2IdConverter

