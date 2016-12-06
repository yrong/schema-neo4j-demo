var fs = require('file-system');

var _ = require('lodash');

var uuid = require('node-uuid');

var KoaNeo4jApp = require('./koa-neo4j');

var validate = require('./validate')

var config = require('config');

var neo4jConfig = config.get('config.neo4j');

var app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://'+ neo4jConfig.host,
        user: neo4jConfig.user,
        password: neo4jConfig.password
    }
});

var postProcess = function (result) {
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
    preProcess: function (params) {
        var params_new = {"skip":0,"limit":MAXNUM};
        if(params.page&&params.per_page){
            var skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
            params_new = {"skip":skip,"limit":params.per_page}
        }
        return params_new;
    },
    postProcess: postProcess
});

app.defineAPI({
    method: 'POST',
    route: '/api/cfgItems',
    check: validate.checkCfgItem,
    preProcess: function (params) {
        var params_new = {"fields":params.data.fields};
        if(!params_new.fields.uuid){
            params_new.fields.uuid = uuid.v1();
        }
        params_new.loc = params_new.fields.asset_loc;
        params_new.fields = _.omit(params_new.fields,'asset_loc');
        params_new.cypher = fs.readFileSync('./cypher/add' + params.data.category + '.cyp', 'utf8');
        return params_new;
    },
    postProcess: function (result) {
        var result_new = {
            "status":"info", //ok, info, warning, error,
            "message":{
                "content":"add success",
                "displayAs":"toast" //toast, modal, console, alert
            }
        };
        return result_new;
    }
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

app.listen(3000, function () {
    console.log('App listening on port 3000.');
});
