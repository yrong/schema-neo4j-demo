const config = require('config')
const convert = require('koa-convert')
const staticFile = require('koa-static')
const path = require('path')
const license_checker = require('cmdb-license-checker')
const getLicense = require('./middleware/getLicense')
const schema = require('redis-json-schema')
const socket_route = require('./routes/ws')
const initAppRoutes = require("./routes")
const responseWrapper = require('scirichon-response-wrapper')
const LOGGER = require('log4js_wrapper')
const check_token = require('scirichon-token-checker')
const acl_checker = require('scirichon-acl-checker')

LOGGER.initialize(config.get('logger'))
const logger = LOGGER.getLogger()

let license = license_checker.load('./CMDB-API.lic')
logger.info('cmdb-api license:' + JSON.stringify(license))

const loadMiddleWares = ()=>{
    let middlewares = []
    middlewares.push(getLicense)
    if(config.get('wrapResponse'))
        middlewares.push(responseWrapper())
    middlewares.push(check_token(config.get('auth')))
    middlewares.push(acl_checker.middleware)
    middlewares.push(convert(staticFile(path.join(__dirname, 'public'))))
    return middlewares
}

const KoaNeo4jApp = require('koa-neo4j-fork');
const neo4jConfig = config.get('neo4j')
const app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    },
    logger:logger,
    middleware:loadMiddleWares()
})
socket_route(app)

const loadSchema = ()=>{
    schema.loadSchemas().then((schemas)=>{
        initAppRoutes(app)
    })
}

app.listen(config.get('port'), function () {
    logger.info(`App started`);
    app.neo4jConnection.initialized.then(()=>{
        loadSchema()
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

