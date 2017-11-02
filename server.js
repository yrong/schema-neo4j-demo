const config = require('config')
const convert = require('koa-convert')
const staticFile = require('koa-static')
const path = require('path')
const license_checker = require('cmdb-license-checker')
const getLicense = require('./middleware/getLicense')
const schema = require('redis-json-schema')
const initAppRoutes = require("./routes")
const responseWrapper = require('scirichon-response-wrapper')
const LOGGER = require('log4js_wrapper')
const check_token = require('scirichon-token-checker')
const acl_checker = require('scirichon-acl-checker')
const scirichon_cache = require('scirichon-cache')

LOGGER.initialize(config.get('logger'))
const logger = LOGGER.getLogger()

let license = license_checker.load('./CMDB-API.lic')
logger.info('cmdb-api license:' + JSON.stringify(license))

const KoaNeo4jApp = require('koa-neo4j-fork');
const neo4jConfig = config.get('neo4j')
let koaNeo4jOptions = {
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    },
    middleware:[getLicense,check_token(config.get('auth')),acl_checker.middleware,convert(staticFile(path.join(__dirname, 'public')))]
}
if(config.get('wrapResponse'))
    koaNeo4jOptions.responseWrapper = responseWrapper
const app = new KoaNeo4jApp(koaNeo4jOptions)

const loadSchemas = ()=>{
    schema.loadSchemas().then((schemas)=>{
        if(schemas&&schemas.length){
            logger.info('init route and cache from schema:\n' + JSON.stringify(schema.getApiRoutesAll(),null,'\t'))
            initAppRoutes(app)
            scirichon_cache.setLoadUrl({cmdb_url:`http://localhost:${config.get('port')}/api`})
            scirichon_cache.loadAll()
        }else{
            logger.fatal(`load schema failed!`)
            process.exit(-2)
        }
    })
}

app.listen(config.get('port'), function () {
    logger.info(`App started`);
    app.neo4jConnection.initialized.then(()=>{
        loadSchemas()
    }).catch((error)=>{
        logger.fatal('neo4j is not reachable,' + String(error))
        process.exit(-1)
    })
})

app.on('restart', function() {
    logger.warn('restart signal received,will restart app in 2 seconds')
    setTimeout(function(){process.exit(0)},2000);
})

process.on('uncaughtException', (err) => {
    logger.error(`Caught exception: ${err}`)
})

