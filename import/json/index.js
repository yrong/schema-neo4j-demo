const jsonfile = require('jsonfile')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const schema = require('redis-json-schema')
const search = require('../../search')
const common = require('scirichon-common')
const config = require('config')
const port = config.get(`${process.env['NODE_NAME']}.port`)
const base_url=`http://${config.get('privateIP')||'localhost'}:${port}`


const wrapRequest = (category,item) => {
    return {data:{category:category,fields:item},batchImport:true}
}

const isSchemaCrossed = (category1, category2)=>{
    return _.intersection(schema.getParentCategories(category1),schema.getParentCategories(category2)).length>0
}

const sortItemsDependentFirst = (items)=>{
    if(!items||items.length==0)
        return items
    let dependent_items = [],refProperties = schema.getSchemaRefProperties(items[0].category),propertyVal
    for (let item of items){
        let selfReference=false
        for(let refProperty of refProperties){
            propertyVal = item[refProperty['attr']]
            if(propertyVal){
                if(isSchemaCrossed(refProperty['schema'],item.category)){
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

const addItem = async(category,item,update) =>{
    let route = schema.getAncestorSchema(category).route,method='POST',uri
    if(!route)
        throw new Error(`${category} api route not found`)
    uri = base_url  + '/api' + route
    if(update){
        method = 'PATCH'
        uri = uri + "/" + item.uuid
    }
    return await common.apiInvoker(method,uri,'','',wrapRequest(category,item))
}

const importItems = async ()=>{
    const redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port'),dbname:process.env['NODE_NAME']||'schema'}
    const additionalPropertyCheck = config.get('additionalPropertyCheck')
    await schema.loadSchemas({redisOption,additionalPropertyCheck})
    let data_dir = process.env.IMPORT_FOLDER
    if(!data_dir)
        throw new Error(`env 'IMPORT_FOLDER' not defined`)
    let importStrategy = process.env.IMPORT_STRATEGY||'api'
    let categories = schema.getSortedCategories()
    let result = {}
    for(let category of categories){
        let filePath = path.join(data_dir,category + '.json')
        let errorFolder = path.join(data_dir,'exception')
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
                        await addItem(item.category, item)
                    else if(importStrategy === 'search')
                        await search.addOrUpdateItem(item)
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



