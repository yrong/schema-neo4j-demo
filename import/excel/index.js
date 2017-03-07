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

class Importer {
    constructor(socketIOContext,configurationItemFileName) {
        this.error_book= {}
        this.configurationItemFileName = configurationItemFileName||schema.cmdbTypeName.ConfigurationItem+'.xlsx'
        this.socketIOContext = socketIOContext
        this.categories = process.env.IMPORT_CATEGORIES||_.keys(xslxHelper.initSheets(this.configurationItemFileName))
    }

    async importer()  {
        let results = {}
        for (let category of this.categories){
            let result = await this.importConfigurationItem(category)
            results[category] = result
            if(this.socketIOContext)
                this.socketIOContext.socket.emit('importConfigurationItemResponse',{category:category,finished:true})
        }
        await xslxHelper.dumpErrorBook(this.error_book,this.configurationItemFileName)
        return results
    }

    async importConfigurationItem(category) {
        let configurationItemMappingDefinition = mappingDefinition[category]
        let src_sheet = xslxHelper.initSheet(this.configurationItemFileName,category)
        src_sheet.data_range = configurationItemMappingDefinition.range
        let src_range = xslxHelper.getSheetRange(src_sheet)
        let start_line = configurationItemMappingDefinition.range.s.r,line = start_line,configurationItem,errors=0,success=0,error_line,exception,exceptions=[],error_sheet={}
        await xslxHelper.generateHeaderInErrorSheet(src_sheet,error_sheet)
        let total = src_range.e.r
        while (line<=total) {
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
            if(line % 10 == 0)
                if(this.socketIOContext)
                    this.socketIOContext.socket.emit('importConfigurationItemResponse',{category:category,total:total,finished:line})
        }
        this.error_book = await xslxHelper.writeErrorBook(src_sheet,error_sheet,category,errors,this.error_book)
        return {success_num:success,exception_num:errors,exceptions:exceptions}
    }
}

if (require.main === module) {
    new Importer().importer()
}

module.exports = Importer









