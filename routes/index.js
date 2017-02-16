const _ = require('lodash');
const config = require('config');
const hook = require('../hooks');
const schema = require('../schema');
const search = require('../search');
const KoaNeo4jApp = require('koa-neo4j');
const routesDef = require('./def');
const logger = require('../logger')

const allowed_methods=['Add', 'Modify', 'FindAll', 'FindOne','Delete']
const customized_routes = (routesDef)=>{
    routesDef.ConfigurationItem.customizedHook = {
        Add:{postProcess:search.addItem},
        Modify:{postProcess:search.patchItem},
        Delete:{postProcess: search.delItem},
        Search:{procedure:search.searchItem}
    }
    routesDef.ConfigurationItem.allowed_methods = [...allowed_methods,"Search"]
    routesDef.ProcessFlow.customizedHook = {
        Add:{postProcess:search.addItem},
        Modify:{postProcess:search.patchItem},
        Delete:{postProcess: search.delItem},
        FindAll:{procedure:search.searchItem},
        FindOne:{procedure:search.searchItem}
    }
    routesDef.ProcessFlow.allowed_methods = [...allowed_methods,"FindChanges"]
}

module.exports = ()=>{
    const neo4jConfig = config.get('config.neo4j')
    const app = new KoaNeo4jApp({
        neo4j: {
            boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
            user: neo4jConfig.user,
            password: neo4jConfig.password
        },
        logger:logger,
        exceptionWrapper:(error)=>{
            return JSON.stringify({
                status:"error",
                message:{
                    content: String(error),
                    displayAs:"modal"
                }
            });
        }
    })
    customized_routes(routesDef)
    const none_checker=(params)=>true
    let preProcess,postProcess,http_method,route,checker,methods,procedure
    _.each(routesDef,(val, key)=>{
        methods = val.allowed_methods||allowed_methods
        _.each(methods,(method)=>{
            procedure=null
            http_method = method==='Add'||method === 'Search'?'POST':method==='Modify'?'PATCH':method === 'Delete'?'DEL':'GET'
            route = method==='Add'||method==='FindAll'?'/api'+val.route:(method==='Search'?'/api/search'+val.route:(method==='FindChanges'?'/api'+val.route+'/:uuid/timeline':'/api'+val.route+'/:uuid'))
            checker = method==='Add'?schema.checkSchema:none_checker
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
        cypherQueryFile: './cypher/deleteItems.cyp',
        postProcess: search.delItem
    });

    /* file upload for demo purpose */
    app.router.get('/upload_demo', (ctx,next)=>{
        ctx.body = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <title>test</title>
                      <meta name="description" content="">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                    <form method="POST" action="/api/upload/processFlows/attachment" enctype="multipart/form-data">
                      <input type="file" multiple name="file" />
                      <br />
                      <input type="submit" value="submit"/>
                    </form>
                    </body>
                  </html>
                  `
        return next()
    })
    return app
}
