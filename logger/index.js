const log4js = require('log4js')
const config = require('config')
const category = config.get('config.logger.defaultCategory')
const logger = log4js.getLogger(category)
const level = config.get('config.logger.defaultLevel')
logger.setLevel(level)
module.exports=logger