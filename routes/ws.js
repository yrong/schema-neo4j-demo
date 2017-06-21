const IO = require( 'koa-socket' )
const path = require('path')
const importer_io = new IO('importer')
const opscontroller_io = new IO('opscontroller')
const logger = require('log4js_wrapper').getLogger()
const excelImporter = require('../import/excel')
const OpsController = require('../opscontroller')

module.exports = (app)=>{
    importer_io.attach(app)
    opscontroller_io.attach(app)

    /*importConfigurationItem*/
    importer_io.on( 'importConfigurationItem', ( ctx, data ) => {
        logger.info("receive importConfigurationItem request from socket")
        let importerInstance
        try{
            importerInstance = new excelImporter(importer_io,path.basename(data.fileId))
        }catch(error){
            logger.error("excelImporter initialized failed:" + String(error))
            ctx.socket.emit('importConfigurationItemError',error.message)
            return
        }
        importerInstance.importer().then((result)=>{
            logger.info("importConfigurationItem success:" + JSON.stringify(result))
            ctx.socket.emit('importConfigurationItemResponse',result)
        }).catch((error)=>{
            logger.error("importConfigurationItemError:" + String(error))
            ctx.socket.emit('importConfigurationItemError',error.message)
        })
    })

    /*executeScript*/
    opscontroller_io.on('executeScript',(ctx,data)=>{
        logger.info("receive executeScript request from socket")
        let opscontroller = new OpsController(opscontroller_io,data,ctx)
        opscontroller.execute()
    })
}

