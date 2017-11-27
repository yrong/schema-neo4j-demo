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
logger.info('cmdb-api license:' + JSON.stringify(license))


/**
 * config options
 */
const redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port'),dbname:process.env['NODE_NAME']||'schema'}
const additionalPropertyCheck = config.get('additionalPropertyCheck')
const cache_loadUrl = {vehicle_url:`http://${config.get('privateIP') || 'localhost'}:${config.get('vehicle.port')}/api`}

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
    schema.loadSchemas({redisOption,additionalPropertyCheck}).then((schemas)=>{
        if (schemas && schemas.length) {
            initAppRoutes(app)
            scirichon_cache.initialize({loadUrl: cache_loadUrl,redisOption,additionalPropertyCheck,prefix:process.env['NODE_NAME']})
            app.listen(config.get('vehicle.port'), function () {
                logger.info(`App started`);
            })
        }else{
            logger.fatal(`no schemas found,npm run init first!`)
            process.exit(-2)
        }
    })
}).catch((error) => {
    logger.fatal('neo4j is not reachable,' + String(error))
    process.exit(-1)
})


app.on('restart', function() {
    logger.warn('restart signal received,will restart app in 2 seconds')
    setTimeout(function(){process.exit(0)},2000);
})

process.on('uncaughtException', (err) => {
    logger.error(`Caught exception: ${err}`)
})

