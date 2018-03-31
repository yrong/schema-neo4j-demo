const jsonfile = require('jsonfile')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const schema = require('redis-json-schema')
const search = require('../../search')
const common = require('scirichon-common')
const config = require('config')
const base_url= common.getServiceApiUrl(process.env['NODE_NAME'])

const wrapRequest = (category,item) => {
    return {data:{category:category,fields:item},batchImport:true,jsonImport:true}
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

const addItem = async (category,item,update)=>{
    let category_schema = schema.getAncestorSchema(category),method='POST',uri,
        route = category_schema&&category_schema.route
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
    let redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port')},cypher,additionalPropertyCheck = config.get('additionalPropertyCheck')
    await schema.loadSchemas({redisOption,additionalPropertyCheck,prefix:process.env['NODE_NAME']})
    let data_dir = process.env.IMPORT_FOLDER,importStrategy = process.env.IMPORT_STRATEGY||'api',
        categories = [],result = {},filePath,errorFolder,errorFilePath,errorItems,items
    if(!data_dir)
        throw new Error(`env 'IMPORT_FOLDER' not defined`)
    categories.push('Role')
    categories.push('User')
    categories = categories.concat(schema.getSortedCategories())
    if(process.env['NODE_NAME']==='vehicle'){
        categories.push('OrderHistory')
    }
    for(let category of categories){
        filePath = path.join(data_dir,category + '.json')
        errorFolder = path.join(data_dir,'exception')
        errorFilePath = path.join(errorFolder,category + '.json')
        errorItems = []
        if(fs.existsSync(filePath)){
            items = jsonfile.readFileSync(filePath)
            items = sortItemsDependentFirst(items)
            for (let item of items) {
                if(!item.category)
                    item.category = category
                try {
                    item = itemPreprocess(item)
                    if(importStrategy === 'api')
                        if(category==='OrderHistory'||category==='User'||category==='Role'){
                            await search.addOrUpdateItem(item)
                            if(category==='OrderHistory'&&item.entries){
                                item.entries = JSON.stringify(item.entries)
                            }
                            cypher = `CREATE (n:${category}) SET n = {item}`
                            await common.apiInvoker('POST',base_url,'/api/searchByCypher',{origional:true},{category:category,item,cypher})
                        }else{
                            await addItem(category, item)
                        }
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



