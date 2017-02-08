const log4js = require('koa-log4')
const logger = log4js.getLogger('cmdb-api')
const config = require('config')
const level = config.get('config.logger.defaultLevel')
logger.setLevel(level)
module.exports=logger