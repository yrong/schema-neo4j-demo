var KoaNeo4jApp = require('./koa-neo4j');

var config = require('config');

var neo4jConfig = config.get('config.neo4j');

var hook = require('./hook');

var schema = require('./schema');

var app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    }
});

/* ConfigurationItem */
app.defineAPI({
    method: 'POST',
    route: '/api/cfgItems',
    check: schema.checkSchema,
    preProcess: hook.addItem_preProcess,
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/cfgItems',
    cypherQueryFile: './cypher/queryCfgItems.cyp',
    preProcess: hook.paginationQueryItems_preProcess,
    postProcess: hook.paginationQueryItems_postProcess
});

app.defineAPI({
    method: 'DEL',
    route: '/api/cfgItems/:uuid',
    cypherQueryFile: './cypher/deleteItem.cyp',
    postProcess: hook.crudItem_postProcess
});


/*ITService*/

app.defineAPI({
    method: 'POST',
    route: '/api/it_services',
    check: schema.checkSchema,
    preProcess: hook.addItem_preProcess,
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'DEL',
    route: '/api/it_services/:uuid',
    cypherQueryFile: './cypher/deleteItem.cyp',
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/it_services',
    cypherQueryFile: './cypher/queryITServices.cyp',
    preProcess: hook.keyWordPaginationQueryItems_preProcess,
    postProcess: hook.paginationQueryItems_postProcess
});

/*Cabinet*/
app.defineAPI({
    method: 'POST',
    route: '/api/cabinets',
    check: schema.checkSchema,
    preProcess: hook.addItem_preProcess,
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'DEL',
    route: '/api/cabinets/:uuid',
    cypherQueryFile: './cypher/deleteItem.cyp',
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/cabinets',
    cypherQueryFile: './cypher/queryCabinets.cyp',
    preProcess: hook.keyWordPaginationQueryItems_preProcess,
    postProcess: hook.paginationQueryItems_postProcess
});

/*Location*/
app.defineAPI({
    method: 'POST',
    route: '/api/locations',
    check: schema.checkSchema,
    preProcess: hook.addItem_preProcess,
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'DEL',
    route: '/api/locations/:uuid',
    cypherQueryFile: './cypher/deleteItem.cyp',
    postProcess: hook.crudItem_postProcess
});

app.defineAPI({
    method: 'GET',
    route: '/api/locations',
    cypherQueryFile: './cypher/queryLocations.cyp',
    preProcess: hook.keyWordPaginationQueryItems_preProcess,
    postProcess: hook.paginationQueryItems_postProcess
});

/*Users*/
app.defineAPI({
    method: 'GET',
    route: '/api/users',
    cypherQueryFile: './cypher/queryUsers.cyp',
    preProcess: hook.keyWordPaginationQueryItems_preProcess,
    postProcess: hook.paginationQueryItems_postProcess
});

/*Schema*/
app.router.get('/api/schema/:id', function (ctx, next) {
    ctx.body = JSON.stringify(schema.getSchema('/'+ctx.params.id),null,3);
    return next();
});

app.listen(3000, function () {
    console.log('App listening on port 3000.');
});
