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
/*route init*/
const initAppRoutes = require("./routes")
let app = initAppRoutes()
/*upload init*/
const file_uploader = require('koa2-file-upload-local')
for(let option of _.values(config.get('config.upload'))){
    app.use(mount(option.url,file_uploader(option).handler))
}
app.use(convert(staticFile(path.join(__dirname, 'public'))))
/*license checker*/
const license_checker = require('cmdb-license-checker')
let license = license_checker.load('./CMDB-API.lic')
app.listen(config.get('config.port'), function () {
    console.log(`App started`);
});

