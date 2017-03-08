const config = require('config')
const jsonfile = require('jsonfile')
const fs = require('file-system')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')
const cypherInvoker = require('../../helper/cypherInvoker')
const schema = require('../../schema/index')
const apiInvoker = require('../../helper/apiInvoker')
const routeDef = require('../../routes/def')

const exportItems = async ()=>{
    let categories = process.env.EXPORT_CATEGORIES,categories_original,containsProcessFlow = true
    if(categories){
        categories = categories.split(',')
        categories_original = _.assign({},categories)
        categories = _.without(categories,schema.cmdbProcessFlowTypes,schema.cmdbProcessFlowAbstractTypes)
        containsProcessFlow = categories.length != categories_original.length
    }
    else{
        categories = [...schema.cmdbConfigurationItemAuxiliaryTypes,schema.cmdbTypeName.ConfigurationItem]
        categories_original = [...categories,schema.cmdbTypeName.ProcessFlow]
    }
    let timestamp = moment().format('YYYYMMDDHHmmss')
    let directory = path.join(config.get('config.export.storeDir'), timestamp)
    fs.mkdirSync(directory)
    let category,cypher,result,items,filePath
    for(category of categories){
        cypher = `MATCH (n) WHERE n:${category} RETURN n`
        result = await cypherInvoker(cypher, {})
        items = result.results[0].data
        items = _.map(items,(item)=>{
            return item.row[0]
        })
        items = _.map(items,(item)=>{
            if(_.isString(item.asset_location))
                item.asset_location = JSON.parse(item.asset_location)
            if(_.isString(item.geo_location))
                try{
                    item.geo_location = JSON.parse(item.geo_location)
                }catch(error){//just for geo_location legacy string format compatibility,do nothing
                }
            return item
        })
        if (items && items.length) {
            filePath = path.join(directory, `${category}.json`)
            jsonfile.writeFileSync(filePath, items, {spaces: 2});
        }
    }
    if(containsProcessFlow){
        items = await apiInvoker.apiGetter(routeDef.ProcessFlow.route)
        if(items&&items.data&&items.data.results){
            filePath = path.join(directory, `ProcessFlow.json`)
            jsonfile.writeFileSync(filePath, items.data.results, {spaces: 2});
        }
    }
    return {directory,categories:categories_original}
}

if (require.main === module) {
    exportItems().then(console.log)
}

module.exports = exportItems

