var _ = require('lodash')
var apiInvoker = require('./apiInvoker')
var routesDefinition = require('../routes/def')
var schema = require('../schema')

var name2IdConverter = {}, name2IdCache = {}


_.each(routesDefinition,(value,key)=>{
    name2IdCache[key]={}
    let single_converter = async(name)=>{
        let uuid,response
        if(name2IdCache[key][name])
            uuid = name2IdCache[key][name]
        else{
            response = await apiInvoker.apiGetter(value.route,{keyword:name})
            if(response&&response.data&&response.data.results){
                if(response.data.results.length!=1){
                    throw new Error(`find multiple '${key}' with name '${name}' in cmdb`)
                }else{
                    uuid = response.data.results[0].uuid
                    name2IdCache[key][name]=uuid
                }
            }else{
                throw new Error(`can not find '${key}' with name '${name}' in cmdb`)
            }
        }
        return uuid
    }
    let array_converter = async (names)=>{
        let uuids=[],uuid
        for (let name of names){
            uuid = await single_converter(name)
            uuids.push(uuid)
        }
        return uuids
    }
    name2IdConverter[key]= async (value)=>{
        if(_.isArray(value))
            return await(array_converter(value))
        else
            return await(single_converter(value))
    }
})

module.exports = name2IdConverter

