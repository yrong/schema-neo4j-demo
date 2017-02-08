const config = require('config')
const convert = require('koa-convert')
const staticFile = require('koa-static')
const upload_options = config.get('config.upload')
const path = require('path')
const appDir = path.resolve(__dirname, '.')
const logDir = path.join(appDir, 'logs')
const log4js = require('koa-log4')
log4js.configure(config.get('config.logger'), { cwd: logDir })

const initAppRoutes = require("./routes")
const uploader = require("./koa-file-upload")
let app = initAppRoutes()
app.use(uploader(upload_options))
app.use(convert(staticFile(__dirname + '/public')))

app.listen(config.get('config.port'), function () {
    console.log(`App started`);
});
