const config = require('config')
const convert = require('koa-convert')
const staticFile = require('koa-static')
const mount = require('koa-mount')
const path = require('path')
const _ = require('lodash')
const fs = require("fs");

/*logger init*/
const logDir = path.join(__dirname, 'logs')
const log4js = require('log4js')
log4js.configure(config.get('config.logger'), { cwd: logDir })
const logger = require('./logger')

/*license check*/
const license_checker = require('cmdb-license-checker')
let license = license_checker.load('./CMDB-API.lic')
logger.info('cmdb-api license:' + JSON.stringify(license))
/*middlewares*/
let middlewares = []
/*getLisense*/
const getLicense = require('./middleware/getLicense')
middlewares.push(getLicense)
/*fileUploader*/
const file_uploader = require('koa2-file-upload-local')
for(let option of _.values(config.get('config.upload'))){
    middlewares.push(mount(option.url,file_uploader(option).handler))
}
/*staticFile*/
middlewares.push(convert(staticFile(path.join(__dirname, 'public'))))

/*app init*/
const KoaNeo4jApp = require('koa-neo4j-middleware');
const neo4jConfig = config.get('config.neo4j')
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
                content: String(error),
                displayAs:"modal"
            }
        });
    },
    middleware:middlewares
})

/*route init*/
const initAppRoutes = require("./routes")
initAppRoutes(app)

/*start listen*/
app.listen(config.get('config.port'), function () {
    console.log(`App started`);
});

