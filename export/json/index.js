const config = require('config')
const jsonfile = require('jsonfile')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')
const mkdirp = require('mkdirp')
const cypherInvoker = require('../../helper/cypherInvoker')
const schema = require('redis-json-schema')

const exportItems = async ()=>{
    await schema.loadSchemas()
    let categories = process.env.EXPORT_CATEGORIES
    if(categories){
        categories = categories.split(',')
    }
    else{
        categories = _.keys(schema.getApiRoutesAll())
    }
    let timestamp = moment().format('YYYYMMDDHHmmss')
    let storeDir = config.get('runtime_data.base_dir')+config.get('runtime_data.cmdb.json_export_dir')
    mkdirp.sync(storeDir)
    let store_time_dir = path.join(storeDir, timestamp)
    mkdirp.sync(store_time_dir)
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
            filePath = path.join(store_time_dir, `${category}.json`)
            jsonfile.writeFileSync(filePath, items, {spaces: 2});
        }
    }
    return {directory: store_time_dir,categories}
}

if (require.main === module) {
    exportItems().then((result)=>{
        console.log(JSON.stringify(result,null,'\t'))
        process.exit()
    }).catch(err=>{
        console.log(err)
    })
}

module.exports = exportItems

