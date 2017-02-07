const log4js = require('koa-log4')
const logger = log4js.getLogger('cmdb')
const config = require('config')
const level = config.get('config.base.logLevel')
logger.setLevel(level)
module.exports=logger