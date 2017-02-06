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

const path = require('path')
const fs = require('file-system')
const appDir = path.resolve(__dirname, '.')
const logDir = path.join(appDir, 'logs')

try {
    fs.mkdirSync(logDir)
} catch (e) {
    if (e.code != 'EEXIST') {
        console.error('Could not set up log directory, error was: ', e)
        process.exit(1)
    }
}
const log4js = require('koa-log4')
log4js.configure(path.join(appDir, 'log4js.json'), { cwd: logDir })

const allowed_methods=['Add', 'Modify', 'FindAll', 'FindOne','Delete']
const apiDef = {
    ConfigurationItem: {
        route: '/cfgItems',
        allowed_methods:[...allowed_methods,"Search"],
        customizedHook:{
            Add:{postProcess:search.addItem},
            Modify:{postProcess:search.patchItem},
            Delete:{postProcess: search.delItem},
            Search:{procedure:search.searchItem}
        }
    },
    Cabinet:{route: '/cabinets'},
    Position:{route: '/positions'},
    User:{route:'/users'},
    ITService:{route:'/it_services/service'},
    ITServiceGroup:{route:'/it_services/group'},
    ProcessFlow: {
        route: '/processFlows',
        allowed_methods:[...allowed_methods,"FindChanges"],
        customizedHook:{
            Add:{postProcess:search.addItem},
            Modify:{postProcess:search.patchItem},
            Delete:{postProcess: search.delItem},
            FindAll:{procedure:search.searchItem},
            FindOne:{procedure:search.searchItem},
        }
    }
}
const none_checker=(params)=>true
let preProcess,postProcess,http_method,route,checker,methods,procedure
_.each(apiDef,(val,key)=>{
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

app.listen(config.get('config.base.port'), function () {
    console.log(`App started`);
});
