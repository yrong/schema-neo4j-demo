const apiInvoker = require('../helper/apiInvoker')
const NodeCache = require( "node-cache" )
const cache = new NodeCache()
const _ = require('lodash')
const routesDef = require('../routes/def')
const schema = require('../schema')
var initialized = false
var loadAll = async ()=>{
    let promises = []
    for(var category of schema.cmdbConfigurationItemAuxiliaryTypes){
        promises.push(apiInvoker.apiGetter(routesDef[category].route))
    }
    let items = await Promise.all(promises)
    _.each(items,(item)=>{
        _.each(item.data.results,(item)=>{
            if(item&&item.uuid)
                cache.set(item.uuid,{name:item.name,uuid:item.uuid})
            if(item&&item.group&&item.group.uuid)
                cache.set(item.group.uuid,{name:item.group.name,uuid:item.group.uuid})
        })
    })
    initialized = true
}
if(!initialized)
    loadAll()
module.exports = cache