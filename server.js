var fs = require('file-system');

var _ = require('lodash');

var uuid = require('node-uuid');

var KoaNeo4jApp = require('./koa-neo4j');

var validate = require('./validate')

var queryString = require('query-string');

var config = require('config');

var neo4jConfig = config.get('config.neo4j');

var app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    }
});

var paginationQuery_preProcess = function (params) {
    var params_new = {"skip":0,"limit":MAXNUM};
    if(params.page&&params.per_page){
        var skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_new = {"skip":skip,"limit":params.per_page}
    }
    return _.assign(params,params_new);
};

var paginationQuery_postProcess = function (result) {
    var result_new =
        {
            "status":"ok", //ok, info, warning, error,
            "message":{
                "content":"query success",
                "displayAs":"toast" //toast, modal, console, alert
            },
            "data":{
                "count":0,
                "results": []
            }
        };
    if(result[0]){
        var results = result[0].nodes
        results = _.map(results, function(value) {
            return _.omit(value,'id');
        });
        result_new.data.count = result[0].cnt;
        result_new.data.results = results;
    }
    return result_new;
};

var MAXNUM = 1000;

app.defineAPI({
    method: 'GET',
    route: '/api/cfgItems',
    cypherQueryFile: './cypher/queryCfgItems.cyp',
    preProcess: paginationQuery_preProcess,
    postProcess: paginationQuery_postProcess
});

var addItem_preProcess = function (params) {
    var params_new = {"fields":params.data.fields};
    params_new.uuid = params.uuid?params.uuid:uuid.v1();
    params_new.asset_location = params.data.fields.asset_location?params.data.fields.asset_location:null;
    params_new.userid = params.data.fields.userid?params.data.fields.userid:null;
    params_new.fields = _.omit(params.data.fields,'asset_location');
    params_new.cypher = fs.readFileSync('./cypher/add' + params.data.category + '.cyp', 'utf8');
    params_new.fields.updated_by = 1//user.userid
    return params_new;
};

var addItem_postProcess = function (result) {
    return {
        "status":"info", //ok, info, warning, error,
        "message":{
            "content":"add success",
            "displayAs":"toast" //toast, modal, console, alert
        }
    };
}

app.defineAPI({
    method: 'POST',
    route: '/api/cfgItems',
    check: validate.checkCfgItem,
    preProcess: addItem_preProcess,
    postProcess: addItem_postProcess
});

app.defineAPI({
    method: 'POST',
    route: '/api/cabinets',
    check: validate.checkCfgItem,
    preProcess: addItem_preProcess,
    postProcess: addItem_postProcess
});

app.defineAPI({
    method: 'POST',
    route: '/api/locations',
    check: validate.checkCfgItem,
    preProcess: addItem_preProcess,
    postProcess: addItem_postProcess
});

app.defineAPI({
    method: 'POST',
    route: '/api/it_services',
    check: validate.checkCfgItem,
    preProcess: addItem_preProcess,
    postProcess: addItem_postProcess
});

app.defineAPI({
    method: 'DEL',
    route: '/api/cfgItems/:uuid',
    cypherQueryFile: './cypher/deleteCfgItem.cyp',
    postProcess: function (result) {
        var result_new = {
            "status":"info", //ok, info, warning, error,
            "message":{
                "content":"delete success",
                "displayAs":"toast" //toast, modal, console, alert
            }
        };
        return result_new;
    }
});

app.defineAPI({
    method: 'GET',
    route: '/api/users',
    cypherQueryFile: './cypher/queryUsers.cyp',
    preProcess: function (params) {
        params = paginationQuery_preProcess(params);
        if(params.keyword){
            params.alias = '(?i).*' +params.keyword + '.*';
            params.cypher = fs.readFileSync('./cypher/queryUsersByAlias.cyp', 'utf8');
        }else{
            params.cypher = fs.readFileSync('./cypher/queryUsers.cyp', 'utf8');
        }
        return params;
    },
    postProcess: paginationQuery_postProcess
});


app.router.get('/api/schema', function (ctx, next) {
    if (ctx.url.indexOf('?') >= 0) {
        params = `?${ctx.url.split('?')[1]}`;
        params = queryString.parse(params);
    }
    ctx.body = JSON.stringify(validate.getSchema('/'+params.id),null,3);
    return next();
});

app.listen(3000, function () {
    console.log('App listening on port 3000.');
});
