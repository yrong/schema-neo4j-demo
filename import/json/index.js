const jsonfile = require('jsonfile')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const apiInvoker = require('../../helper/apiInvoker')
const schema = require('../../schema')
const search = require('../../search')
const common = require('scirichon-common')

const sortItemsDependentFirst = (items)=>{
    if(!items||items.length==0)
        return items
    let dependent_items = [],refProperties = schema.getSchemaRefProperties(items[0].category),propertyVal
    for (let item of items){
        let selfReference=false
        for(let refProperty of refProperties){
            propertyVal = item[refProperty['attr']]
            if(propertyVal){
                if(schema.isTypeCrossed(refProperty['schema'],item.category)){
                    selfReference = true
                    break
                }
            }
        }
        if(!selfReference)
            dependent_items.push(item)
    }
    let other_items = []
    for (let item of items){
        let found = false
        for (let dependent_item of dependent_items){
            if(item.uuid === dependent_item.uuid){
                found = true
                break
            }
        }
        if(!found)
            other_items.push(item)
    }
    return [...dependent_items,...other_items]
}

const itemPreprocess = (item)=>{
    return common.pruneEmpty(item)
}

const importItems = async ()=>{
    await schema.loadSchemas()
    let date_dir = process.env.IMPORT_FOLDER
    if(!date_dir)
        throw new Error(`env 'IMPORT_FOLDER' not defined`)
    let importStrategy = process.env.IMPORT_STRATEGY||'api'
    let categories = [...schema.getSortedTypes()]
    let result = {}
    for(let category of categories){
        let filePath = path.join(date_dir,category + '.json')
        let errorFolder = path.join(date_dir,'exception')
        let errorFilePath = path.join(errorFolder,category + '.json')
        let errorItems = []
        if(fs.existsSync(filePath)){
            let items = jsonfile.readFileSync(filePath)
            items = sortItemsDependentFirst(items)
            for (let item of items) {
                if(!item.category)
                    item.category = category
                try {
                    item = itemPreprocess(item)
                    if(importStrategy === 'api')
                        await apiInvoker.addItem(item.category, item)
                    else if(importStrategy === 'search')
                        await search.addItem({},item)
                    else
                        throw new Error('unknown importStrategy')
                }catch(error){
                    item.error = String(error)
                    errorItems.push(item)
                }
            }
            if(errorItems.length){
                if (!fs.existsSync(errorFolder))
                    fs.mkdirSync(errorFolder)
                jsonfile.writeFileSync(errorFilePath, errorItems, {spaces: 2})
            }
        }
        result[category] = {errorItems}
    }
    return result
}

if (require.main === module) {
    importItems().then((result)=>{
        console.log(JSON.stringify(result,null,'\t'))
        process.exit()
    }).catch(err=>{
        console.log(err)
    })
}

module.exports = importItems



