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
const cypherInvoker = require('./cypherInvoker')

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
        if(!route)
            throw new Error(`${category} api route not found`)
        var options = {
            method: 'POST',
            uri: base_url  + route,
            body: wrapRequest(category,item),
            json: true
        }
        return await rp(options)
    },
    getAgents: async (hosts)=>{
        let cypher = `MATCH (n)
        WHERE n:PhysicalServer OR n:VirtualServer
        RETURN n`
        let results = await cypherInvoker.fromRestful(cypher)
        results = results.results[0].data
        results = _.map(results,(result)=>{
            return result.row[0]
        })
        results = hosts&&hosts.length?_.filter(results,(host)=>{
            return _.includes(hosts, host.ip_address[0])||_.includes(hosts, host.name)
        }):results
        return results
    }
}