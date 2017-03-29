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
const utils = require('../../helper/utils')

const exportItems = async ()=>{
    let categories = process.env.EXPORT_CATEGORIES
    if(categories){
        categories = categories.split(',')
    }
    else{
        categories = [...schema.cmdbConfigurationItemAuxiliaryTypes,schema.cmdbTypeName.ConfigurationItem,schema.cmdbTypeName.ProcessFlow]
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
            for(let field of utils.objectFields){
                if(_.isString(item[field]))
                    try {
                        item[field] = JSON.parse(item[field])
                    }catch(error){//just for geo_location legacy string format compatibility,do nothing
                    }
            }
            return item
        })
        if (items && items.length) {
            filePath = path.join(directory, `${category}.json`)
            jsonfile.writeFileSync(filePath, items, {spaces: 2});
        }
    }
    return {directory,categories}
}

if (require.main === module) {
    exportItems().then(console.log)
}

module.exports = exportItems

