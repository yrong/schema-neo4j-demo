var config = require('config')
var parser = require('./../helper/parser')
var apiInvoker = require('./../helper/apiInvoker')
var converter = require('./../helper/converter')
var checker = require('./../helper/checker')
var xslxHelper = require('./../helper/xslxHelper')
var mappingDefinition = require('./mappingDef')
var schema = require('../schema')

var configurationItemMapping = async (type, sheet, line)=>{
    let configurationItem = {},value,raw_value
    let configurationItemMappingDefinition = mappingDefinition[type]
    for (var key in configurationItemMappingDefinition.definition){
        value = configurationItemMappingDefinition.definition[key];
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
                value.value = await (converter[value.converter](value.value))
            configurationItem[key] = value.value
        }
    }
    for(var process of configurationItemMappingDefinition.postProcess){
         configurationItem = await process(configurationItem)
    }
    return configurationItem;
}

var importer = async ()=>{
    const SHEET_NAME = '物理服务器'
    const SHEET_START_LINE = 3
    let src_sheet = xslxHelper.initSheet('configurationItem.xlsx',SHEET_NAME),error_sheet={}
    let range = xslxHelper.getSheetRange(src_sheet)
    let line = SHEET_START_LINE,physical_server,errors=0,success=0,exception,exceptions=[]
    while (line<=range.e.r) {
        try{
            physical_server = await configurationItemMapping(schema.cmdbTypeName.PhysicalServer,src_sheet,line)
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

if (require.main === module) {
    importer();
}

module.exports = importer









