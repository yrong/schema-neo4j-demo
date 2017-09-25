const config = require('config')
const _ = require('lodash')
const cmdb_cache = require('scirichon-cache')
const routesDefinition = cmdb_cache.cmdb_type_routes
const schema = require('../schema')
var wrapRequest = (category,item) => {
    return {data:{category:category,fields:item}}
}
var base_url=`http://localhost:${config.get('port')}/api`
const cypherInvoker = require('./cypherInvoker')
const common = require('scirichon-common')
const net = require('net')

module.exports = {
    apiGetter: async function(path,params){
        return await common.apiInvoker('GET',base_url,path,params)
    },
    addItem: async(category,item,update) =>{
        let route = schema.getRoute(category),method='POST',uri
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
        WHERE n:ConfigurationItem
        RETURN n`
        let results = await cypherInvoker.fromRestful(cypher)
        results = results.results[0].data
        results = _.map(results,(result)=>{
            return result.row[0]
        })
        results = _.filter(results,(host)=>{
            let name_exist,ip_exist
            if(host&&host.name)
                name_exist = _.includes(hosts, host.name)
            if(host.ip_address&&host.ip_address.length)
                ip_exist = _.includes(hosts, host.ip_address[0])
            return name_exist||ip_exist
        })
        if(!results.length)
            _.each(hosts,(host)=>{
                if(net.isIP(host))
                    results.push({ip_address:[host],name:host})
            })
        return results
    }
}