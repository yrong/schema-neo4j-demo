const config = require('config')
const convert = require('koa-convert')
const staticFile = require('koa-static')
const mount = require('koa-mount')
const path = require('path')
const _ = require('lodash')
const check_token = require('koa-token-checker')
const cmdb_cache = require('cmdb-cache')

/*logger init*/
const LOGGER = require('log4js_wrapper')
LOGGER.initialize(config.get('logger'))
const logger = LOGGER.getLogger()

/*license check*/
const license_checker = require('cmdb-license-checker')
let license = license_checker.load('./CMDB-API.lic')
logger.info('cmdb-api license:' + JSON.stringify(license))

/*middlewares init*/
let middlewares = []
/*getLisense*/
const getLicense = require('./middleware/getLicense')
middlewares.push(getLicense)
/*fileUploader*/
const file_uploader = require('koa-file-upload-fork')
for(let option of _.values(config.get('upload'))){
    middlewares.push(mount(option.url,file_uploader(option).handler))
}
/*staticFile*/
middlewares.push(convert(staticFile(path.join(__dirname, 'public'))))
/*check token*/
middlewares.push(check_token(config.get('auth')))

/*app init*/
const KoaNeo4jApp = require('koa-neo4j-fork');
const neo4jConfig = config.get('neo4j')
const app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    },
    logger:logger,
    exceptionWrapper:(error)=>{
        return JSON.stringify({
            status:"error",
            message:{
                content:"unexpected error",
                additional: String(error),
                displayAs:"modal"
            }
        });
    },
    middleware:middlewares
})

/*route init*/
const initAppRoutes = require("./routes")
initAppRoutes(app);

(function(app) {
    app.neo4jConnection.initialized.then(()=>{
        cmdb_cache.loadAll(`http://localhost:${config.get('port')}/api`);
    }).catch((error)=>{
        logger.fatal('neo4j is not reachable,' + String(error))
        process.exit(-1)
    })
})(app)

/*start listen*/
app.listen(config.get('port'), function () {
    console.log(`App started`);
});

