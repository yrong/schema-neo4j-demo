const apiInvoker = require('./helper/apiInvoker')
const NodeCache = require( "node-cache" );
const cmdbCache = new NodeCache();
var _ = require('lodash');
var initialized = false
var loadAll = async ()=>{
    let items = await Promise.all([apiInvoker.apiGetter('/users'),apiInvoker.apiGetter('/it_services/service'),
        apiInvoker.apiGetter('/it_services/group'),apiInvoker.apiGetter('/positions'),apiInvoker.apiGetter('/cabinets')])
    _.each(items,(item)=>{
        _.each(item.data.results,(item)=>{
            if(item&&item.uuid)
                cmdbCache.set(item.uuid,{name:item.name,uuid:item.uuid})
        })
    })
    initialized = true
}
if(!initialized)
    loadAll()
module.exports = cmdbCache