const _ = require('lodash');
const config = require('config');
const hook = require('../hooks');
const schema = require('../schema');
const search = require('../search');
const routesDef = require('./def');
const ws = require('./ws')
const utils = require('../helper/utils')
const allowed_methods=['Add', 'Modify', 'FindAll', 'FindOne','Delete','FindChanges']
const es_config = config.get('elasticsearch')

const customized_routes = (routesDef)=>{
    routesDef.ConfigurationItem.customizedHook = {
        Add:{postProcess:search.addItem},
        Modify:{postProcess:search.patchItem},
        Delete:{postProcess: search.deleteItem},
        Search:{procedure:search.searchItem}
    }
    routesDef.ConfigurationItem.allowed_methods = [...allowed_methods,'Search']
    routesDef.ProcessFlow.customizedHook = {
        Add:{postProcess:search.addItem},
        Modify:{postProcess:search.patchItem},
        Delete:{postProcess: search.deleteItem},
        Search:{procedure:search.searchItem}
    }
    routesDef.ProcessFlow.allowed_methods = [...allowed_methods,'Search']
}

const es_checker=(params)=>{
    if(es_config.mode === 'strict')
        return search.checkStatus(params)
    return none_checker(params)
}

const schema_checker = (params)=>{return schema.checkSchema(params)}

const none_checker = (params)=>true

module.exports = (app)=>{
    customized_routes(routesDef)
    if(es_config.mode === 'strict')
        search.checkStatus()
    let preProcess,postProcess,http_method,route,checker,methods,procedure
    _.each(routesDef,(val, key)=>{
        methods = val.allowed_methods||allowed_methods
        _.each(methods,(method)=>{
            procedure=null
            http_method = method==='Add'||method === 'Search'?'POST':method==='Modify'?'PATCH':method === 'Delete'?'DEL':'GET'
            route = method==='Add'||method==='FindAll'?'/api'+val.route:(method==='Search'?'/api/search'+val.route:(method==='FindChanges'?'/api'+val.route+'/:uuid/timeline':'/api'+val.route+'/:uuid'))
            checker = method==='Add'?[schema_checker,es_checker]:(method==='Modify'||method==='Delete')?es_checker:none_checker
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
            else {
                app.defineAPI({
                    method: http_method,
                    route: route,
                    check: checker,
                    preProcess: preProcess,
                    postProcess: postProcess
                })
                if(method==='Modify'){
                    app.defineAPI({
                        method: http_method,
                        route: '/api/by_name'+val.route,
                        check: checker,
                        preProcess: preProcess,
                        postProcess: postProcess
                    })
                }
            }
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

    /* Delete all Items(for test purpose) */
    app.defineAPI({
        method: 'DEL',
        route: '/api/items',
        preProcess: hook.cudItem_preProcess,
        postProcess: hook.cudItem_postProcess
    });

    /*License*/
    app.router.get('/api/license', function (ctx, next) {
        ctx.body = ctx.state.license;
        return next();
    });

    /*websocket routes*/
    ws(app)

    return app
}
