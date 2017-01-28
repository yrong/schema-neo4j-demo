var _ = require('lodash')
var apiInvoker = require('./apiInvoker')

var name2IdMappingDef = {it_service:{path:'/it_services/service',type:'array'},user:{path:'/users'},cabinet:{path:'/cabinets'},position:{path:'/positions'}},
    name2IdConverter = {},
    name2IdCache = {}


_.each(name2IdMappingDef,(value,key)=>{
    name2IdCache[key]={}
    let single_converter = async(key,name)=>{
        let uuid,response
        if(name2IdCache[key][name])
            uuid = name2IdCache[key][name]
        else{
            response = await apiInvoker.apiGetter(value.path,{keyword:name})
            if(response&&response.data&&response.data.results&&response.data.results.length==1){
                uuid = response.data.results[0].uuid
                name2IdCache[key][name]=uuid
            }else{
                throw new Error(`can not find '${key}' with name '${name}' in cmdb`)
            }
        }
        return uuid
    }
    let array_converter = async (key,names)=>{
        let uuids=[],uuid,response
        for (let name of names){
            uuid = await single_converter(key,name)
            uuids.push(uuid)
        }
        return uuids
    }
    name2IdConverter[key]=value.type==='array'?array_converter:single_converter
})

module.exports = name2IdConverter

