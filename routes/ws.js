const IO = require( 'koa-socket' )
const path = require('path')
const importer_io = new IO('importer')
const opscontroller_io = new IO('opscontroller')
const LOGGER = require('log4js_wrapper')
const logger = LOGGER.getLogger()
const excelImporter = require('../import/excel')
const OpsController = require('../opscontroller')

module.exports = (app)=>{
    importer_io.attach(app)
    opscontroller_io.attach(app)

    /*importConfigurationItem*/
    importer_io.on( 'importConfigurationItem', ( ctx, data ) => {
        logger.info("receive importConfigurationItem request from socket")
        if(!data.fileName&&!data.fileId){
            logger.error("required field missing")
            ctx.socket.emit('importConfigurationItemError','required field missing')
            return
        }
        let importerInstance = new excelImporter(importer_io,path.basename(data.fileName||data.fileId))
        importerInstance.importer().then((result)=>{
            logger.info("importConfigurationItem success:" + JSON.stringify(result))
            ctx.socket.emit('importConfigurationItemResponse',result)
        }).catch((error)=>{
            logger.error("importConfigurationItemError:" + error.stack||error)
            ctx.socket.emit('importConfigurationItemError',error.message)
        })
    })

    /*executeScript*/
    opscontroller_io.on('executeScript',(ctx,data)=>{
        logger.info("receive executeScript request from socket")
        let opscontroller = new OpsController(opscontroller_io,data,ctx)
        try{
            opscontroller.execute()
        }catch(err){
            logger.error("executeScriptError:" + error.stack||error)
            ctx.socket.emit('executeScriptError',error.message)
        }

    })

}

