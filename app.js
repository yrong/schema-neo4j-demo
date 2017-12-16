const config = require('config')
const schema = require('redis-json-schema')
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
const initAppRoutes = require("./routes")
const scirichon_cache = require('scirichon-cache')

/**
 * check license
 */
const lincense_file = `${process.env['LICENSE_PATH']}/${process.env['NODE_NAME']}.lic`
const license = license_helper.load(lincense_file)
logger.info('license:' + JSON.stringify(license))


/**
 * config options
 */
const redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port'),dbname:process.env['NODE_NAME']||'schema'}
const additionalPropertyCheck = config.get('additionalPropertyCheck')
const cache_url_key = `${process.env['NODE_NAME']}_url`
const port = config.get(`${process.env['NODE_NAME']}.port`)
const cache_loadUrl = {}
cache_loadUrl[cache_url_key]=`http://${config.get('privateIP') || 'localhost'}:${port}/api`

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
        check_token({check_token_url:`http://${config.get('privateIP')||'localhost'}:${config.get('auth.port')}/auth/check`}),
        acl_checker({redisOption})
    ]
}
if(config.get('wrapResponse'))
    koaNeo4jOptions.responseWrapper = responseWrapper
const app = new KoaNeo4jApp(koaNeo4jOptions)

/**
 * init routes from schema and start server
 */

app.neo4jConnection.initialized.then(() => {
    scirichon_cache.initialize({loadUrl: cache_loadUrl,redisOption,additionalPropertyCheck,prefix:process.env['NODE_NAME']}).then(()=>{
        initAppRoutes(app)
        app.listen(port, function () {
            logger.info(`App started`);
        })
    })
}).catch((error) => {
    logger.fatal('neo4j is not reachable,' + String(error))
    process.exit(-1)
})

if(process.env['INIT_CACHE']){
    scirichon_cache.loadAll()
}


app.on('restart', function() {
    logger.warn('restart signal received,will restart app in 2 seconds')
    setTimeout(function(){process.exit(0)},2000);
})

process.on('uncaughtException', (err) => {
    logger.error(`Caught exception: ${err}`)
})

