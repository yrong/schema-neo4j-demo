const _ = require('lodash')
const apiInvoker = require('../../helper/apiInvoker')
const converter = require('../../helper/converter')
const checker = require('../../helper/checker')
const xslxHelper = require('../../helper/xslxHelper')
const mappingDefinition = require('./mappingDef')
const schema = require('../../schema/index')

const configurationItemMapping = async (type, sheet, line)=>{
    let configurationItem = {},value,raw_value
    let configurationItemMappingDefinition = mappingDefinition[type]
    for (let key in configurationItemMappingDefinition.definition){
        value = configurationItemMappingDefinition.definition[key]
        raw_value = xslxHelper.getRawValue(sheet,value.col,line)
        if(value.type === 'array')
            value.value = xslxHelper.data_parser.toArray(raw_value)
        else if(value.type === 'boolean')
            value.value = xslxHelper.data_parser.toBoolean(raw_value)
        else if(value.type === 'date')
            value.value = xslxHelper.data_parser.toDate(raw_value)
        else if(value.type === 'integer')
            value.value = xslxHelper.data_parser.toInteger(raw_value)
        else
            value.value = xslxHelper.data_parser.toString(raw_value)
        if(value.required)
            if(!raw_value)
                throw new Error(`required field ${key} missing!`)
        if(value.value!=null){
            if(value.converter)
                value.value = await converter[value.converter](value.value)
            configurationItem[key] = value.value
        }
    }
    for(var process of configurationItemMappingDefinition.postProcess){
         configurationItem = await process(configurationItem)
    }
    return configurationItem;
}

let error_book={}
const xlsxFilePrefix = '.xlsx',ConfigurationItemFileName = schema.cmdbTypeName.ConfigurationItem+xlsxFilePrefix

const importConfigurationItem = async (category)=>{
    let configurationItemMappingDefinition = mappingDefinition[category]
    let src_sheet = xslxHelper.initSheet(ConfigurationItemFileName,category)
    src_sheet.data_range = configurationItemMappingDefinition.range
    let src_range = xslxHelper.getSheetRange(src_sheet)
    let start_line = configurationItemMappingDefinition.range.s.r,line = start_line,configurationItem,errors=0,success=0,error_line,exception,exceptions=[],error_sheet={}
    await xslxHelper.generateHeaderInErrorSheet(src_sheet,error_sheet)
    while (line<=src_range.e.r) {
        try{
            configurationItem = await configurationItemMapping(category,src_sheet,line)
            await apiInvoker.addItem(category,configurationItem)
            success++
        }catch(error){
            error_line = errors + start_line
            error_sheet = xslxHelper.generateLineInErrorSheet(src_sheet,line,error_sheet,error_line,error.message)
            errors ++
            exception = {srcLine:line+1,error:error.message}
            exceptions.push(exception)
        }
        line ++
    }
    error_book = await xslxHelper.writeErrorBook(src_sheet,error_sheet,category,errors,error_book)
    return {success_num:success,exception_num:errors,exceptions:exceptions}
}

const importer = async()=>{
    let categories = process.env.IMPORT_CATEGORIES,results = {}
    if(categories)
        categories = categories.split(',')
    else
        categories = _.keys(xslxHelper.initSheets(ConfigurationItemFileName))
    for (let category of categories){
        let result = await importConfigurationItem(category)
        results[category] = result
    }
    await xslxHelper.dumpErrorBook(error_book,schema.cmdbTypeName.ConfigurationItem)
    return results
}

if (require.main === module) {
    importer()
}

module.exports = importer









