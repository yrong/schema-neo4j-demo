const config = require('config')
const _ = require('lodash')
const routesDefinition = require('../routes/def')
const schema = require('../schema')
var wrapRequest = (category,item) => {
    return {data:{category:category,fields:item}}
}
var base_url=`http://localhost:${config.get('port')}/api`
const cypherInvoker = require('./cypherInvoker')
const common = require('scirichon-common')

module.exports = {
    apiGetter: async function(path,params){
        return await common.apiInvoker('GET',base_url,path,params)
    },
    addItem: async(category,item,update) =>{
        let route,method='POST',uri;
        if(routesDefinition[category]){
            route = routesDefinition[category].route
        }else if(_.includes(schema.cmdbConfigurationItemTypes,category)){
            route = routesDefinition.ConfigurationItem.route
        }else if(_.includes(schema.cmdbProcessFlowTypes,category)){
            route = routesDefinition.ProcessFlow.route
        }
        if(!route)
            throw new Error(`${category} api route not found`)
        uri = base_url  + route
        if(update){
            method = 'PATCH'
            uri = uri + "/" + item.uuid
        }
        return await common.apiInvoker(method,uri,'','',wrapRequest(category,item))
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
        if(results.length)
            return results
        else
            return _.map(hosts,(host)=>{
                return {ip_address:[host],name:host}
            })
    }
}