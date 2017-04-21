const apiInvoker = require('../helper/apiInvoker')
const NodeCache = require( "node-cache" )
const cache = new NodeCache()
const _ = require('lodash')
const routesDef = require('../routes/def')
const schema = require('../schema')
var initialized = false
var utils = require('../helper/utils')

var loadAll = async ()=>{
    let promises = []
    for(var category of schema.cmdbConfigurationItemAuxiliaryTypes){
        promises.push(apiInvoker.apiGetter(routesDef[category].route))
    }
    let items = await Promise.all(promises)
    _.each(items,(item)=>{
        _.each(item.data,(item)=>{
            if(item&&item.uuid){
                if(item.category === schema.cmdbTypeName.User)
                    cache.set(item.uuid,{name:item.alias,uuid:item.uuid,category:item.category})
                else
                    cache.set(item.uuid,{name:item.name,uuid:item.uuid,category:item.category})
            }
        })
    })
    initialized = true
}

var getByCategoryAndName = (category,name)=>{
    let val,found_val
    for(let key of cache.keys()){
        val = cache.get(key)
        if(val.name === name&&val.category === category){
            found_val = val
            break
        }
    }
    return found_val
}

var set = (key,val)=>{
    return cache.set(key,val)
}

var get = (key)=>{
    return cache.get(key)
}

var del = (key)=>{
    return cache.del(key)
}

var flushAll = ()=>{
    for(let key of cache.keys()){
        val = cache.get(key)
        if(val.category !== schema.cmdbTypeName.User){
            cache.del(val.uuid)
        }
    }
}

if(!initialized)
    loadAll()

module.exports = {get,set,del,getByCategoryAndName,flushAll}