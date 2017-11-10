const config = require('config')
const license_checker = require('cmdb-license-checker')
const getLicense = require('./middleware/getLicense')
const schema = require('redis-json-schema')
const LOGGER = require('log4js_wrapper')
LOGGER.initialize(config.get('logger'))
const logger = LOGGER.getLogger()
const initAppRoutes = require("./routes")
const responseWrapper = require('scirichon-response-wrapper')
const check_token = require('scirichon-token-checker')
const acl_checker = require('scirichon-acl-checker')
const scirichon_cache = require('scirichon-cache')


let license = license_checker.load('./CMDB-API.lic')
logger.info('cmdb-api license:' + JSON.stringify(license))

const KoaNeo4jApp = require('koa-neo4j')
const neo4jConfig = config.get('neo4j')
let koaNeo4jOptions = {
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    },
    middleware:[
        getLicense,
        check_token({check_token_url:`http://${config.get('privateIP')||'localhost'}:${config.get('auth.port')}/auth/check`}),
        acl_checker.middleware
    ]
}
if(config.get('wrapResponse'))
    koaNeo4jOptions.responseWrapper = responseWrapper
const app = new KoaNeo4jApp(koaNeo4jOptions)

app.neo4jConnection.initialized.then(() => {
    schema.loadSchemas().then((schemas) => {
        if (schemas && schemas.length) {
            logger.info('init route and cache from schema:\n' + JSON.stringify(schema.getApiRoutesAll(), null, '\t'))
            scirichon_cache.setLoadUrl({cmdb_url: `http://${config.get('privateIP') || 'localhost'}:${config.get('cmdb.port')}/api`})
            initAppRoutes(app)
            app.listen(config.get('cmdb.port'), function () {
                logger.info(`App started`);
            })
        } else {
            logger.fatal(`load schema failed!`)
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

