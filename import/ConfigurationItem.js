'use strict';

var config = require('config')
var parser = require('./../helper/parser')
var apiInvoker = require('./../helper/apiInvoker')
var converter = require('./../helper/converter')
var checker = require('./../helper/checker')
var hook = require('./hook')
var xslxHelper = require('./../helper/xslxHelper')


var physicalServer_mappings = {
    def:{
        directory_type:{col:0},
        ip_address:{col:1,type:'array',required:true},
        virtual_machine:{col:2,type:'boolean'},
        operating_system:{col:3},
        hardware_info:{col:4},
        storage_info:{col:5},
        name:{col:6,required:true},
        it_service:{col:7,type:'array',converter:'it_service'},
        monitored:{col:8,type:'boolean',required:true},
        responsibility:{col:9,converter:'user'},
        technical_support_info:{col:10},
        created_date:{col:11,type:'date'},
        last_updated_date:{col:12,type:'date'},
        updated_by:{col:13,converter:'user'},
        asset_id:{col:14},
        sn:{col:15},
        geo_location:{col:16},
        asset_location:{col:17},
        asset_location_cabinet:{col:18,converter:'cabinet'},
        asset_location_u:{col:19,type:'integer'},
        asset_location_mounted_date:{col:20,type:'date'},
        asset_location_position:{col:21,converter:'position'},
        model:{col:22,required:true},
        product_date:{col:23,type:'date'},
        warranty_expiration_date:{col:24,type:'date'},
        retirement_date:{col:25,type:'date'}
    },
    postProcess:[hook.buildAssetLocation,hook.omitProperties]

}

var physicalServerMapping = async (sheet,line)=>{
    let physicalServer = {},value,raw_value
    for (var key in physicalServer_mappings.def){
        value = physicalServer_mappings.def[key];
        raw_value = xslxHelper.getRawValue(sheet,value.col,line)
        if(value.type === 'array')
            value.value = parser.toArray(raw_value)
        else if(value.type === 'boolean')
            value.value = parser.toBoolean(raw_value)
        else if(value.type === 'date')
            value.value = parser.toDate(raw_value)
        else if(value.type === 'integer')
            value.value = parser.toInteger(raw_value)
        else
            value.value = parser.toString(raw_value)
        if(value.required)
            if(!raw_value)
                throw new Error(`required field ${key} missing!`)
        if(value.value!=null){
            if(value.converter)
                value.value = await (converter[value.converter](value.converter,value.value))
            physicalServer[key] = value.value
        }
    }
    for(var process of physicalServer_mappings.postProcess){
         physicalServer = await process(physicalServer)
    }
    return physicalServer;
}

var importer = async ()=>{
    const SHEET_NAME = '物理服务器'
    const SHEET_START_LINE = 3
    let src_sheet = xslxHelper.initSheet('configurationItem.xlsx',SHEET_NAME),error_sheet={}
    let range = xslxHelper.getSheetRange(src_sheet)
    let line = SHEET_START_LINE,physical_server,errors=0,success=0,exception,exceptions=[]
    while (line<=range.e.r) {
        try{
            physical_server = await physicalServerMapping(src_sheet,line)
            await apiInvoker.addConfigurationItem('PhysicalServer',physical_server)
            success++
        }catch(error){
            error_sheet = xslxHelper.generateErrorSheet(src_sheet,line,error_sheet,errors,error.message)
            errors ++
            exception = {srcLine:line+1,error:error.message}
            exceptions.push(exception)
        }
        line ++
    }
    await xslxHelper.writeErrorBook(src_sheet,error_sheet,SHEET_NAME,errors)
    return {success_num:success,exception_num:errors,exceptions:exceptions}
}

module.exports = importer









