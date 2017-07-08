var _ = require('lodash')
var routesDefinition = require('../routes/def')
var schema = require('../schema')
var cmdb_cache = require('cmdb-cache')

var name2IdConverter = {}


_.each(routesDefinition,(value,key)=>{
    let single_converter = (name)=>{
        let uuid,cached_val = cmdb_cache.getItemByCategoryAndName(key,name)
        if(cached_val)
            uuid = cached_val.uuid
        else
            throw new Error(`can not find category '${key}' with name '${name}' in cmdb`)
        return uuid
    }
    let array_converter = (names)=>{
        let uuids = _.map(names,(name)=>{
            return single_converter(name)
        })
        return uuids
    }
    name2IdConverter[key]= (value)=>{
        if(_.isArray(value))
            return array_converter(value)
        else
            return single_converter(value)
    }
})

module.exports = name2IdConverter

