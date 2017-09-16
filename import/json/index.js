const jsonfile = require('jsonfile')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const apiInvoker = require('../../helper/apiInvoker')
const schema = require('../../schema')
const search = require('../../search')

const sortItemsDependentFirst = (items)=>{
    let dependent_items = []
    for (let item of items){
        if(item.category === schema.cmdbTypeName.ITService && !item.parent &&!item.children&&!item.dependencies&&!item.dependendents){
            dependent_items.push(item)
        }else if(item.category === schema.cmdbTypeName.Software){
            dependent_items.push(item)
        }else if(schema.isProcessFlow(item.category) && !item.reference_process_flow){
            dependent_items.push(item)
        }else if(schema.isConfigurationItem(item.category)&&!item.host_server&&!item.operating_system&&!item.applications){
            dependent_items.push(item)
        }
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
    if(schema.isConfigurationItem(item.category)){
        if(_.isString(item.geo_location))
            item.geo_location = {name:item.geo_location}
        if(_.isString(item.status))
            item.status = JSON.parse(item.status)
        if(item.asset_location&&item.asset_location.location){
            item.asset_location.position = item.asset_location.location
            delete item.asset_location.location
        }
    }
    return item
}

class Importer {
    constructor() {
    }

    async importer()  {
        schema.loadSchema()
        let date_dir = process.env.IMPORT_FOLDER
        if(!date_dir)
            throw new Error(`env 'IMPORT_FOLDER' not defined`)
        let importStrategy = process.env.IMPORT_STRATEGY||'api'
        let categories = [...schema.getAuxiliaryTypes(),schema.cmdbTypeName.ConfigurationItem,schema.cmdbTypeName.ProcessFlow]
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
}

if (require.main === module) {
    new Importer().importer().then((result)=>console.log(JSON.stringify(result,null,'\t')))
}

module.exports = Importer



