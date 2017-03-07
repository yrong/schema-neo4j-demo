const config = require('config')
const convert = require('koa-convert')
const staticFile = require('koa-static')
const mount = require('koa-mount')
const path = require('path')
const appDir = path.resolve(__dirname, '.')
const logDir = path.join(appDir, 'logs')
const log4js = require('log4js')
log4js.configure(config.get('config.logger'), { cwd: logDir })
const initAppRoutes = require("./routes")
let app = initAppRoutes()
const file_uploader = require('koa2-file-upload-local')
const _ = require('lodash')
for(let option of _.values(config.get('config.upload'))){
    app.use(mount(option.url,file_uploader(option).handler))
}
app.use(convert(staticFile(__dirname + '/public')))

app.listen(config.get('config.port'), function () {
    console.log(`App started`);
});
