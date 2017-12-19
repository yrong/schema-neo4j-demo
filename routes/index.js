const _ = require('lodash');
const config = require('config');
const hook = require('../hooks');
const schema = require('redis-json-schema');
const search = require('../search');
const es_config = config.get('elasticsearch')
const requestWrapper = require('../hooks/requestHandler')

const schema_checker = (params)=>{
    return schema.checkObject(params)&&requestWrapper.internalUsedFieldsChecker(params)
}

const es_checker=()=>{
    if(es_config.mode === 'strict')
        return search.checkStatus()
    return none_checker()
}

const none_checker = ()=>true


module.exports = (app)=>{
    let routesDef = schema.getApiRouteSchemas(),allowed_methods=['Add', 'Modify', 'FindAll', 'FindOne','Delete']
    let preProcess,postProcess,http_method,route,checker,procedure
    _.each(routesDef,(val)=>{
        _.each(allowed_methods,(method)=>{
            procedure=null
            http_method = method==='Add'?'POST':method==='Modify'?'PATCH':method === 'Delete'?'DEL':'GET'
            route = method==='Add'||method==='FindAll'?'/api'+val.route:'/api'+val.route+'/:uuid'
            checker = method==='Add'?[schema_checker,es_checker]:(method==='Modify'||method==='Delete')?[requestWrapper.internalUsedFieldsChecker,es_checker]:none_checker
            preProcess = method==='Add'||method==='Modify'||method==='Delete'?hook.cudItem_preProcess:hook.queryItems_preProcess
            postProcess = method==='Add'||method==='Modify'||method==='Delete'?hook.cudItem_postProcess:hook.queryItems_postProcess
            app.defineAPI({
                method: http_method,
                route: route,
                check: checker,
                preProcess: preProcess,
                postProcess: postProcess
            })
        })
    })

    /*search by es*/
    app.defineAPI({
        method: 'POST',
        route: '/api/searchByEql',
        procedure:search.searchItem
    })

    /*search by neo4j*/
    app.defineAPI({
        method: 'POST',
        route: '/api/searchByCypher',
        preProcess: hook.customizedQueryItems_preProcess,
        postProcess: hook.queryItems_postProcess
    })


    /*Schema*/
    app.defineAPI({
        method: 'GET',
        route: '/api/schema/:category',
        procedure: hook.getCategorySchema
    })

    /*SchemaHierarchy*/
    app.defineAPI({
        method: 'GET',
        route: '/api/schema/hierarchy/:category/',
        procedure: hook.getCategoryInheritanceHierarchy
    })

    app.defineAPI({
        method: 'POST',
        route: '/api/schema/hierarchy/:category',
        procedure: hook.addCategoryInheritanceHierarchy
    })


    /*deprecated*/
    app.defineAPI({
        method: 'GET',
        route: '/api/cfgItems/categories/:category',
        procedure: hook.getSchemaHierarchy
    })

    /*deprecated*/
    app.defineAPI({
        method: 'POST',
        route: '/api/search/cfgItems',
        procedure:search.searchItem
    })

    /*deprecated*/
    app.defineAPI({
        method: 'POST',
        route: '/api/search/processFlows',
        procedure:search.searchItem
    })

    /* Delete all Items(for test purpose) */
    if(process.env.NODE_ENV === 'development'){
        app.defineAPI({
            method: 'DEL',
            route: '/api/items',
            preProcess: hook.cudItem_preProcess,
            postProcess: hook.cudItem_postProcess
        })
    }

    /*License*/
    app.router.get('/api/license', function (ctx, next) {
        ctx.body = ctx.state.license
    })

    app.defineAPI({
        method: 'POST',
        route: '/api/schema/',
        procedure: hook.loadSchemas
    })

    return app
}
