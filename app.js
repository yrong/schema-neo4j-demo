const config = require('config')
/**
 * init logger
 */
const LOGGER = require('log4js_wrapper')
LOGGER.initialize(config.get('logger'))
const logger = LOGGER.getLogger()

const license_helper = require('license-helper')
const getLicense = require('./middleware/getLicense')
const responseWrapper = require('scirichon-response-wrapper')
const check_token = require('scirichon-token-checker')
const acl_checker = require('scirichon-acl-checker')
const KoaNeo4jApp = require('koa-neo4j-fork')
const neo4jConfig = config.get('neo4j')
const initRoutes = require("./routes/index")
const scirichon_cache = require('scirichon-cache')
const scirichon_common = require('scirichon-common')

/**
 * check license
 */
const lincense_file = `${process.env['LICENSE_PATH']}/${process.env['NODE_NAME']}.lic`
const license = license_helper.load(lincense_file)
logger.info('license:' + JSON.stringify(license))


/**
 * config options
 */
const auth_url = scirichon_common.getServiceApiUrl('auth')
const redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port')}
const additionalPropertyCheck = config.get('additionalPropertyCheck')


/**
 * int koa app and load scrichon middlewares
 */
let koaNeo4jOptions = {
    neo4j: {
        boltUrl: `bolt://${process.env['NEO4J_HOST']||neo4jConfig.host}:${neo4jConfig.port}`,
        user: process.env['NEO4J_USER']||neo4jConfig.user,
        password: process.env['NEO4J_PASSWD']||neo4jConfig.password
    },
    middleware:[
        getLicense,
        check_token({check_token_url:`${auth_url}/auth/check`}),
        acl_checker({redisOption})
    ]
}
if(config.get('wrapResponse'))
    koaNeo4jOptions.responseWrapper = responseWrapper
const app = new KoaNeo4jApp(koaNeo4jOptions)

/**
 * init routes from schema and start server
 */
const NODE_NAME = process.env['NODE_NAME']
const initializeApp = async (app)=>{
    await app.neo4jConnection.initialized
    await scirichon_cache.initialize({redisOption,additionalPropertyCheck,prefix:NODE_NAME})
    initRoutes(app)
    app.listen(config.get(`${NODE_NAME}.port`), async function () {
        if(parseInt(process.env['INIT_CACHE'])){
            await scirichon_cache.loadAll()
        }
    })
}
initializeApp(app).then(()=>{
    logger.info(`App started`)
}).catch((error) => {
    logger.fatal('app start error,' + error.stack||error)
    process.exit(-1)
})

app.on('restart', function() {
    logger.warn('restart signal received,will restart app in 2 seconds')
    setTimeout(function(){process.exit(0)},2000);
})

process.on('uncaughtException', (err) => {
    logger.error(`Caught exception: ${err}`)
})

