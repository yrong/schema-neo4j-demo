const config = require('config')
const _ = require('lodash')
const schema = require('redis-json-schema')
var wrapRequest = (category,item) => {
    return {data:{category:category,fields:item},batchImport:true}
}
var base_url=`http://${config.get('privateIP')||'localhost'}:${config.get('cmdb.port')}/api`
const cypherInvoker = require('./cypherInvoker')
const common = require('scirichon-common')
const net = require('net')

module.exports = {
    addItem: async(category,item,update) =>{
        let route = schema.getRouteFromParentSchemas(category),method='POST',uri
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
    },
    check_cabinet_u_unique:async (asset) =>{
        if(asset&&asset.asset_location_cabinet){
            let response = await common.apiInvoker('POST',base_url,'/searchByCypher','',{"category":"ConfigurationItem", "cypherQueryFile":"mountedConfigurationItemRels"}),matched
            response = response||response.data
            if(response){
                matched = _.find(response,(mounted_cabinet)=>{
                    return (mounted_cabinet.cabinet.name === asset.asset_location_cabinet || mounted_cabinet.cabinet.uuid === asset.asset_location_cabinet)
                        && mounted_cabinet.u === asset.asset_location_u
                })
            }
            if(matched)
                throw new Error('Cabinet_U unique constraint violation')
        }
    }
}