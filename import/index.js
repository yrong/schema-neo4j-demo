'use strict';
var XLSX = require('xlsx')
var _ = require('lodash')
var rp = require('request-promise')
var queryString = require('query-string')
var config = require('config')
var fs = require('file-system');
var path = require('path')
var moment = require('moment');

var importFileBaseDir = config.get('config.import.importFileBaseDir')
var processedFileBaseDir = importFileBaseDir + path.sep +　'processed'
var exceptionFileBaseDir = importFileBaseDir + path.sep +　'exception'
var importFileName = config.get('config.import.configurationItemFile')
var importFileBaseName = path.basename(importFileName, '.xlsx')
var configurationItemFilePath = importFileBaseDir + path.sep +importFileName
var workbook = XLSX.readFile(configurationItemFilePath)
const physical_sheet_name = '物理服务器'
var physical_server_worksheet = workbook.Sheets[physical_sheet_name]
var errorbook = {SheetNames:[physical_sheet_name],Sheets:{}}
var errorbook_worksheet = {}
errorbook.Sheets[physical_sheet_name]=errorbook_worksheet
const NULL = null;

/**
 * start line retrieving data from the excel file
 * @type {number}
 */
const START_LINE = 3

var toBoolean = (val)=>{
    if(val&&(val.v === 'Yes' || val.v === 'yes' || val.v === '1'))
        return true
    else if(val&&(val.v === 'No' || val.v === 'no' || val.v === '0'))
        return false
    else
        return NULL
}

var toInteger = (val)=>{return val?parseInt(val.v):NULL}

var toDate = (val)=>{return val?moment(val.w,'YYYY-M-D').format('YYYY-MM-DD'):NULL}

var toArray = (val)=>{return val?val.v.split(','):NULL}

var toString = (val)=>{return val?val.v:NULL}

var apiInvoker=async function(path,params){
    var options = {
        method: 'GET',
        uri: config.get('config.import.base_url') + path + (params?('/?' + queryString.stringify(params)):''),
        json: true
    }
    return await rp(options)
}

var addConfigurationItem = async (configurationItem)=>{
    var options = {
        method: 'POST',
        uri: config.get('config.import.base_url')  + '/cfgItems',
        body: configurationItem,
        json: true
    };
    return await rp(options)
}

var it_service_name_2_id_mapping = {}
var it_service_names_2_ids_converter = async (names)=>{
    let service_ids = [],response,service_id;
    for (let name of names){
        if(it_service_name_2_id_mapping[name])
            service_ids.push(it_service_name_2_id_mapping[name])
        else{
            response = await apiInvoker('/it_services/service',{keyword:name})
            if(response&&response.data&&response.data.results&&response.data.results.length==1){
                service_id = response.data.results[0].uuid
                it_service_name_2_id_mapping[name] = service_id
                service_ids.push(service_id)
            }else{
                throw new Error(`can not find it service with name '${name}' in cmdb`)
            }
        }
    }
    return service_ids
}

var user_name_2_id_mapping = {}
var user_name_2_id_converter = async (name)=>{
    let userid,response
    if(user_name_2_id_converter[name])
        userid = user_name_2_id_converter[name]
    else{
        response = await apiInvoker('/users',{keyword:name})
        if(response&&response.data&&response.data.results&&response.data.results.length==1){
            userid = response.data.results[0].userid
            user_name_2_id_mapping[name]=userid
        }else{
            throw new Error(`can not find user with name '${name}' in cmdb`)
        }
    }
    return userid
}

var cabinet_name_2_id_mapping = {}
var cabinet_name_2_id_converter = async (name)=>{
    let cabinet_id,response
    if(cabinet_name_2_id_mapping[name])
        cabinet_id = cabinet_name_2_id_mapping[name]
    else{
        response = await apiInvoker('/cabinets',{keyword:name})
        if(response&&response.data&&response.data.results&&response.data.results.length==1){
            cabinet_id = response.data.results[0].uuid
        }else{
            throw new Error(`can not find cabinet with name '${name}' in cmdb`)
        }
    }
    return cabinet_id
}

var position_name_2_id_mapping = {}
var position_name_2_id_converter = async (name)=>{
    let position_id,response
    if(position_name_2_id_mapping[name])
        position_id = position_name_2_id_mapping[name]
    await apiInvoker('/positions',{keyword:name})
    if(response&&response.data&&response.data.results&&response.data.results.length==1){
        position_id = response.data.results[0].uuid
    }else{
        throw new Error(`can not find cabinet with name '${name}' in cmdb`)
    }
    return position_id
}

var buildAssetLocation = async (asset) =>{
    if(asset&&asset.asset_location_cabinet){
        asset.asset_location = {cabinet:asset.asset_location_cabinet,status:"mounted",u:asset.asset_location_u,date_mounted:asset.asset_location_mounted_date}
        let response = await apiInvoker('/relationship/located/mounted'),matched
        if(response&&response.data){
            matched = _.find(response.data,(mounted_cabinet)=>{
                return mounted_cabinet.cabinet === asset.asset_location_cabinet && mounted_cabinet.u === asset.asset_location_u
            })
        }
        if(matched)
            throw new Error('Cabinet_U unique constraint violation')
    }
    else if(asset&&asset.asset_location_position)
        asset.asset_location = {position:asset.asset_location_position,status:"unmounted"}
}

/**
 * physicalServer_mappings_def which describes the column meta data including index in the excel,data type and so on
 * @type {{directory_type: {col: string}, ip_address: {col: string, type: string, required: boolean}, virtual_machine: {col: string, type: string}, operating_system: {col: string}, hardware_info: {col: string}, storage_info: {col: string}, name: {col: string, required: boolean}, it_service: {col: string, type: string, converter: ((p1:*))}, monitored: {col: string, type: string, required: boolean}, responsibility: {col: string}, technical_support_info: {col: string}, created_date: {col: string, type: string}, last_updated_date: {col: string, type: string}, updated_by: {col: string}, asset_id: {col: string}, sn: {col: string}, geo_location: {col: string}, asset_location: {col: string}, asset_location_cabinet: {col: string}, asset_location_u: {col: string, type: string}, asset_location_mounted_date: {col: string, type: string}, asset_location_position: {col: string}, model: {col: string}, product_date: {col: string, type: string}, warranty_expiration_date: {col: string, type: string}, retirement_date: {col: string, type: string}}}
 */
var physicalServer_mappings_def = {
    directory_type:{col:0},
    ip_address:{col:1,type:'array',required:true},
    virtual_machine:{col:2,type:'boolean'},
    operating_system:{col:3},
    hardware_info:{col:4},
    storage_info:{col:5},
    name:{col:6,required:true},
    it_service:{col:7,type:'array',converter:it_service_names_2_ids_converter},
    monitored:{col:8,type:'boolean',required:true},
    responsibility:{col:9,converter:user_name_2_id_converter},
    technical_support_info:{col:10},
    created_date:{col:11,type:'date'},
    last_updated_date:{col:12,type:'date'},
    updated_by:{col:13,converter:user_name_2_id_converter},
    asset_id:{col:14},
    sn:{col:15},
    geo_location:{col:16},
    asset_location:{col:17},
    asset_location_cabinet:{col:18,converter:cabinet_name_2_id_converter},
    asset_location_u:{col:19,type:'integer'},
    asset_location_mounted_date:{col:20,type:'date'},
    asset_location_position:{col:21,converter:position_name_2_id_converter},
    model:{col:22,required:true},
    product_date:{col:23,type:'date'},
    warranty_expiration_date:{col:24,type:'date'},
    retirement_date:{col:25,type:'date'}
}

var physicalServerMapping = async (line)=>{
    let physicalServer = {},cell,raw_value,value;
    for (var key in physicalServer_mappings_def){
        value = physicalServer_mappings_def[key];
        cell = XLSX.utils.encode_cell({c:value.col,r:line})
        raw_value = physical_server_worksheet[cell]
        if(value.type === 'array')
            value.value = toArray(raw_value)
        else if(value.type === 'boolean')
            value.value = toBoolean(raw_value)
        else if(value.type === 'date')
            value.value = toDate(raw_value)
        else if(value.type === 'integer')
            value.value = toInteger(raw_value)
        else
            value.value = toString(raw_value)
        if(value.required)
            if(!raw_value)
                throw new Exception(`required field ${key} missing!`)
        if(value.value!=NULL&&value.value!=undefined){
            if(value.converter)
                value.value = await (value.converter(value.value))
            physicalServer[key] = value.value
        }
    }
    await buildAssetLocation(physicalServer)
    physicalServer = _.omit(physicalServer,['directory_type','created_date','last_updated_date','asset_location_cabinet','asset_location_u','asset_location_mounted_date','asset_location_position'])
    return physicalServer;
}

var copyToErrorBookWorkSheet = (src_line,dst_line,error)=>{
    let src_cell,dst_cell,range = XLSX.utils.decode_range(physical_server_worksheet['!ref'])
    for(var i=0;i<=range.e.c;i++){
        src_cell = XLSX.utils.encode_cell({c:i,r:src_line})
        dst_cell = XLSX.utils.encode_cell({c:i,r:dst_line})
        errorbook_worksheet[dst_cell] = physical_server_worksheet[src_cell]
    }
    dst_cell = XLSX.utils.encode_cell({c:i,r:dst_line})
    errorbook_worksheet[dst_cell]={v:error}
}

const token = 'token'

var wrapRequest = (category,item) => {
    return {token:token, data:{category:category,fields:item}}
}


async function process(){
    let line = START_LINE,physical_server,error_sheet_line=0,success_num=0,response
    let range = XLSX.utils.decode_range(physical_server_worksheet['!ref'])
    while (line<=range.e.r) {
        try{
            physical_server = await physicalServerMapping(line)
            console.log(JSON.stringify(physical_server))
            response = await addConfigurationItem(wrapRequest('PhysicalServer',physical_server))
            success_num++
        }catch(error){
            copyToErrorBookWorkSheet(line,error_sheet_line,error.message)
            error_sheet_line ++
        }
        line ++
    }
    range =  {s: {c:0, r:0}, e: {c:range.e.c+1, r:error_sheet_line }}
    errorbook_worksheet['!ref'] = XLSX.utils.encode_range(range)
    // fs.mkdirSync(processedFileBaseDir)
    fs.mkdirSync(exceptionFileBaseDir)
    XLSX.writeFile(errorbook, exceptionFileBaseDir + path.sep + (new Date).getTime() + '.xlsx')
    // fs.renameSync(configurationItemFilePath,processedFileBaseDir + path.sep + importFileBaseName + (new Date).getTime() + '.xlsx')
    return {success_num:success_num,exception_num:error_sheet_line}
}

console.time("importConsuming")
process().then((result)=>{
    console.timeEnd("importConsuming");
    console.log(JSON.stringify(result))
})




