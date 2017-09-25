const config = require('config')
const jsonfile = require('jsonfile')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')
const cypherInvoker = require('../../helper/cypherInvoker')
const schema = require('../../schema/index')

const exportItems = async ()=>{
    await schema.loadSchemas()
    let categories = process.env.EXPORT_CATEGORIES
    if(categories){
        categories = categories.split(',')
    }
    else{
        categories = _.keys(schema.getApiRoutes())
    }
    let timestamp = moment().format('YYYYMMDDHHmmss')
    let directory = path.join(config.get('export.storeDir'), timestamp)
    if (!fs.existsSync(directory))
        fs.mkdirSync(directory)
    let category,cypher,result,items,filePath
    for(category of categories){
        cypher = `MATCH (n) WHERE n:${category} RETURN n`
        result = await cypherInvoker.fromRestful(cypher, {})
        items = result.results[0].data
        items = _.map(items,(item)=>{
            return item.row[0]
        })
        items = _.map(items,(item)=>{
            for(let field of schema.getSchemaObjectProperties(item.category)){
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
    exportItems().then((result)=>console.log(JSON.stringify(result,null,'\t')))
}

module.exports = exportItems

