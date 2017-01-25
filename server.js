var KoaNeo4jApp = require('./koa-neo4j');

var config = require('config');

var neo4jConfig = config.get('config.neo4j');

var hook = require('./hook');

var schema = require('./schema');

var search = require('./search');

var app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host + ':' + neo4jConfig.port,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    }
});

/* ConfigurationItem */
app.defineAPI({
    method: 'POST',
    route: '/api/cfgItems',
    check: schema.checkSchema,
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

app.defineAPI({
    method: 'PATCH',
    route: '/api/cfgItems/:uuid',
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/cfgItems',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/cfgItems/:uuid',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/cfgItems/categories/:filter',
    procedure: hook.configurationItemCategoryProcess
});

/*Cabinet*/
app.defineAPI({
    method: 'POST',
    route: '/api/cabinets',
    check: schema.checkSchema,
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/cabinets',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

/*Position*/
app.defineAPI({
    method: 'POST',
    route: '/api/positions',
    check: schema.checkSchema,
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/positions',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

/*Users*/
app.defineAPI({
    method: 'GET',
    route: '/api/users',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

app.defineAPI({
    method: 'POST',
    route: '/api/users',
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

/*Schema*/
app.router.get('/api/schema/:id', function (ctx, next) {
    ctx.body = schema.getSchema('/'+ctx.params.id);
    return next();
});

/*ITService*/
app.defineAPI({
    method: 'POST',
    route: '/api/it_services/service',
    check: schema.checkSchema,
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/it_services/service',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

/*ITServiceGroup*/
app.defineAPI({
    method: 'POST',
    route: '/api/it_services/group',
    check: schema.checkSchema,
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/it_services/group',
    preProcess:hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

/* ProcessFlow */
app.defineAPI({
    method: 'POST',
    route: '/api/processFlows',
    check: schema.checkSchema,
    preProcess: hook.cudItem_preProcess,
    postProcess: search.addProcessFlow
});

app.defineAPI({
    method: 'PATCH',
    route: '/api/processFlows/:uuid',
    preProcess: hook.cudItem_preProcess,
    postProcess: search.patchProcessFlow
});

app.defineAPI({
    method: 'GET',
    route: '/api/processFlows',
    procedure: search.searchProcessFlows
});

app.defineAPI({
    method: 'GET',
    route: '/api/processFlows/:uuid',
    procedure: search.searchProcessFlows
});

app.defineAPI({
    method: 'GET',
    route: '/api/processFlows/:uuid/timeline',
    preProcess: hook.queryItems_preProcess,
    postProcess: hook.queryItems_postProcess
});

/* Delete any item*/
app.defineAPI({
    method: 'DEL',
    route: '/api/items/:uuid',
    preProcess: hook.cudItem_preProcess,
    postProcess: hook.cudItem_postProcess
});


/* Delete all Items(for test purpose) */
app.defineAPI({
    method: 'DEL',
    route: '/api/items',
    cypherQueryFile: './cypher/deleteItems.cyp',
    postProcess: search.delProcessFlows
});

/* get mounted location relationship between configurationItem and Cabinet*/
app.defineAPI({
    method: 'GET',
    route: '/api/relationship/located/mounted',
    cypherQueryFile: './cypher/QueryMountedCabinet.cyp',
    postProcess: hook.queryItems_postProcess
});

app.listen(3001, function () {
    console.log('App listening on port 3001.');
});
