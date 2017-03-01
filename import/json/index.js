const jsonfile = require('jsonfile')
const _ = require('lodash')
const path = require('path')
const fs = require('file-system')
const apiInvoker = require('../../helper/apiInvoker')
const schema = require('../../schema')

const sortItemsDependentFirst = (items)=>{
    let dependent_items = []
    for (let item of items){
        if(item.category === schema.cmdbTypeName.ITService && !item.parent &&!item.children&&!item.dependencies&&!item.dependendents){
            dependent_items.push(item)
        }else if(_.includes(schema.cmdbProcessFlowTypes,item.category) && !item.reference_process_flow){
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

const importer = async ()=>{
    let date_dir = process.env.IMPORT_FOLDER
    let categories = schema.cmdbTypesAll
    let filesImported = []
    for(let category of categories){
        let filePath = path.join(date_dir,category + '.json')
        if(fs.existsSync(filePath)){
            let items = jsonfile.readFileSync(filePath)
            items = sortItemsDependentFirst(items)
            for (let item of items) {
                await apiInvoker.addItem(item.category,item)
            }
            filesImported.push(filePath)
        }
    }
    return filesImported
}

if (require.main === module) {
    importer()
}

module.exports = importer



