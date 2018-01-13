const config = require('config')
const jsonfile = require('jsonfile')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')
const mkdirp = require('mkdirp')
const schema = require('redis-json-schema')
const common = require('scirichon-common')
const port = config.get(`${process.env['NODE_NAME']}.port`)
const base_url=`http://${config.get('privateIP')||'localhost'}:${port}`


const exportItems = async ()=>{
    const redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port'),dbname:process.env['NODE_NAME']||'schema'}
    await schema.loadSchemas({redisOption})
    let categories = process.env.EXPORT_CATEGORIES
    if(categories){
        categories = categories.split(',')
    }
    else{
        categories = _.map(schema.getApiRouteSchemas(),(schema)=>schema.id)
    }
    let timestamp = moment().format('YYYYMMDDHHmmss')
    let exportPath = `runtime_data.${process.env['NODE_NAME']}.json_export_dir`
    let storeDir = (process.env['RUNTIME_PATH']||'../runtime') + config.get(exportPath)
    mkdirp.sync(storeDir)
    let store_time_dir = path.join(storeDir, timestamp)
    mkdirp.sync(store_time_dir)
    let category,cypher,result,items,filePath
    for(category of categories){
        cypher = `MATCH (n) WHERE n:${category} RETURN n`
        result = await common.apiInvoker('POST',base_url,'/api/searchByCypher',{origional:true},{category,cypher:`MATCH (n) WHERE n:${category} RETURN collect(n)`})
        items = result.data||result
        items = _.map(items,(item)=>(_.omit(item,'id')))
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

