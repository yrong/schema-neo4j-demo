var rp = require('request-promise')
var queryString = require('query-string')
var config = require('config')

const token = 'token'
var wrapRequest = (category,item) => {
    return {token:token, data:{category:category,fields:item}}
}

var base_url=`http://localhost:${config.get('config.port')}/api`

module.exports = {
    apiGetter:async function(path,params){
        var options = {
            method: 'GET',
            uri: base_url + path + (params?('/?' + queryString.stringify(params)):''),
            json: true
        }
        return await rp(options)
    },
    addConfigurationItem:async (category,configurationItem)=>{
        var options = {
            method: 'POST',
            uri: base_url  + '/cfgItems',
            body: wrapRequest(category,configurationItem),
            json: true
        };
        return await rp(options)
    },
    addItService: async (service)=>{
        var options = {
            method: 'POST',
            uri: base_url  + '/it_services/service',
            body: wrapRequest('ITService',service),
            json: true
        };
        return await rp(options)
    },
    addItServiceGroup: async (serviceGroup)=>{
        var options = {
            method: 'POST',
            uri: base_url  + '/it_services/group',
            body: wrapRequest('ITServiceGroup',serviceGroup),
            json: true
        };
        return await rp(options)
    }
}