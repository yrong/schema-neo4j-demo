const _ = require('lodash');
const config = require('config');
const hook = require('../hooks');
const schema = require('../schema');
const search = require('../search');
const routesDef = require('./def');
const logger = require('../logger')
const IO = require( 'koa-socket' )
const path = require('path')
const excelImporter = require('../import/excel')

const allowed_methods=['Add', 'Modify', 'FindAll', 'FindOne','Delete','FindChanges']
const customized_routes = (routesDef)=>{
    routesDef.ConfigurationItem.customizedHook = {
        Search:{procedure:search.searchItem}
    }
    routesDef.ConfigurationItem.allowed_methods = [...allowed_methods,'Search']
    routesDef.ProcessFlow.customizedHook = {
        Search:{procedure:search.searchItem}
    }
    routesDef.ProcessFlow.allowed_methods = [...allowed_methods,'Search']
}

const none_checker=()=>true

module.exports = (app)=>{
    customized_routes(routesDef)
    let preProcess,postProcess,http_method,route,checker,methods,procedure
    _.each(routesDef,(val, key)=>{
        methods = val.allowed_methods||allowed_methods
        _.each(methods,(method)=>{
            procedure=null
            http_method = method==='Add'||method === 'Search'?'POST':method==='Modify'?'PATCH':method === 'Delete'?'DEL':'GET'
            route = method==='Add'||method==='FindAll'?'/api'+val.route:(method==='Search'?'/api/search'+val.route:(method==='FindChanges'?'/api'+val.route+'/:uuid/timeline':'/api'+val.route+'/:uuid'))
            checker = method==='Add'?[schema.checkSchema]:(method==='Modify'||method==='Delete')?none_checker:none_checker
            preProcess = method==='Add'||method==='Modify'||method==='Delete'?hook.cudItem_preProcess:hook.queryItems_preProcess
            if(val.customizedHook&&val.customizedHook[method]&&val.customizedHook[method].preProcess)
                preProcess = val.customizedHook[method].preProcess
            postProcess = method==='Add'||method==='Modify'||method==='Delete'?hook.cudItem_postProcess:hook.queryItems_postProcess
            if(val.customizedHook&&val.customizedHook[method]&&val.customizedHook[method].postProcess)
                postProcess = val.customizedHook[method].postProcess
            if(val.customizedHook&&val.customizedHook[method]&&val.customizedHook[method].procedure)
                procedure = val.customizedHook[method].procedure
            if(procedure)
                app.defineAPI({
                    method: http_method,
                    route: route,
                    procedure: procedure
                })
            else
                app.defineAPI({
                    method: http_method,
                    route: route,
                    check: checker,
                    preProcess: preProcess,
                    postProcess: postProcess
                })
        })
    })

    /*ConfigurationItemCategory*/
    app.defineAPI({
        method: 'GET',
        route: '/api/cfgItems/categories/:filter',
        procedure: hook.configurationItemCategoryProcess
    });

    /*Schema*/
    app.router.get('/api/schema/:id', function (ctx, next) {
        ctx.body = schema.getSchema('/'+ctx.params.id);
        return next();
    });

    /* get mounted location relationship between configurationItem and Cabinet(for cabinet_u unique check purpose when import*/
    app.defineAPI({
        method: 'GET',
        route: '/api/relationship/located/mounted',
        cypherQueryFile: './cypher/QueryMountedCabinet.cyp',
        postProcess: hook.queryItems_postProcess
    });


    /* Delete all Items(for test purpose) */
    app.defineAPI({
        method: 'DEL',
        route: '/api/items',
        cypherQueryFile: './cypher/deleteItems.cyp'
    });

    /*License*/
    app.router.get('/api/license', function (ctx, next) {
        ctx.body = ctx.state.license;
        return next();
    });

    const socketio = new IO('importer')
    socketio.attach(app)
    socketio.on( 'importConfigurationItem', ( ctx, data ) => {
        logger.info("receive importConfigurationItem request from socket")
        let importerInstance
        try{
            importerInstance = new excelImporter(socketio,path.basename(data.fileId))
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
    return app
}
