var fs = require('file-system');

var KoaNeo4jApp = require('koa-neo4j');

var app = new KoaNeo4jApp({
    apis: [
        {
            method: 'GET',
            route: '/cfgItems/:skip/:limit',
            cypherQueryFile: './cypher/queryCfgItems.cyp'
        }
    ],
    neo4j: {
        boltUrl: 'bolt://localhost',
        user: 'neo4j',
        password: 'neo4j'
    }
});

app.defineAPI({
    method: 'POST',
    route: '/cfgItems',
    preProcess: function (params) {
        params.cypher = fs.readFileSync('./cypher/add' + params.type + '.cyp', 'utf8');
        return params;
    }
});


app.router.get('/noncypher', function (ctx, next) {
    ctx.body = "Using router you can do other things that don't need Cypher!";
    return next();
});

app.listen(3000, function () {
    console.log('App listening on port 3000.');
});
