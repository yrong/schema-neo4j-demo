const rp = require('request-promise')
const queryString = require('query-string')
const config = require('config')
const _ = require('lodash')
const routesDefinition = require('../routes/def')
const schema = require('../schema')

const token = 'token'
var wrapRequest = (category,item) => {
    return {token:token, data:{category:category,fields:item}}
}

var base_url=`http://localhost:${config.get('config.port')}/api`

module.exports = {
    apiGetter: async function(path,params){
        var options = {
            method: 'GET',
            uri: base_url + path + (params?('/?' + queryString.stringify(params)):''),
            json: true
        }
        return await rp(options)
    },
    addItem: async(category,item) =>{
        let route;
        if(routesDefinition[category]){
            route = routesDefinition[category].route
        }else if(_.includes(schema.cmdbConfigurationItemTypes,category)){
            route = routesDefinition.ConfigurationItem.route
        }else if(_.includes(schema.cmdbProcessFlowTypes,category)){
            route = routesDefinition.ProcessFlow.route
        }
        var options = {
            method: 'POST',
            uri: base_url  + route,
            body: wrapRequest(category,item),
            json: true
        }
        return await rp(options)
    }
}