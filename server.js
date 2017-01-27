require("babel-core/register");
require("babel-polyfill");

var _ = require('lodash');

var config = require('config');

var neo4jConfig = config.get('config.neo4j');

var hook = require('./hook');

var schema = require('./schema');

var search = require('./search');

var KoaNeo4jApp = require('./koa-neo4j/src');

var app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    }
});

const allowed_methods=['Add', 'Modify', 'FindAll', 'FindOne','Delete']
const apiDef = {
    ConfigurationItem: {route: '/cfgItems'},
    Cabinet:{route: '/cabinets'},
    Position:{route: '/positions'},
    User:{route:'/users'},
    ITService:{route:'/it_services/service'},
    ITServiceGroup:{route:'/it_services/group'},
    ProcessFlow: {
        route: '/processFlows',
        allowed_methods:[...allowed_methods,"FindChanges"],
        customizedHook:{
            Add:{postProcess:search.addProcessFlow},
            Modify:{postProcess:search.patchProcessFlow},
            FindAll:{procedure:search.searchProcessFlows},
            FindOne:{procedure:search.searchProcessFlows},
        }
    }
}
const none_checker=(params)=>true
let preProcess,postProcess,http_method,route,checker,methods,procedure
_.each(apiDef,(val,key)=>{
    methods = val.allowed_methods||allowed_methods
    _.each(methods,(method)=>{
        procedure=null
        http_method = method==='Add'?'POST':method==='Modify'?'PATCH':method === 'Delete'?'DEL':'GET'
        route = method==='Add'||method==='FindAll'?'/api'+val.route:(method==='FindChanges'?'/api'+val.route+'/:uuid/timeline':'/api'+val.route+'/:uuid')
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
    postProcess: search.delProcessFlows
});

app.listen(3001, function () {
    console.log('App listening on port 3001.');
});
