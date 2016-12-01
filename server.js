var fs = require('file-system');

var _ = require('lodash');

var KoaNeo4jApp = require('./koa-neo4j');

var validate = require('./validate')

var app = new KoaNeo4jApp({
    neo4j: {
        boltUrl: 'bolt://localhost',
        user: 'neo4j',
        password: 'neo4j'
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
                "count":result.length,//所有结果总数
                "results": result
            }
        };
    return result_new;
};

app.defineAPI({
    method: 'GET',
    route: '/api/cfgItems',
    cypherQueryFile: './cypher/queryCfgItems.cyp',
    preProcess: function (params) {
        var params_new = {"skip":0,"limit":Number.MAX_VALUE};
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
        var params_new = params.data.fields;
        params_new.cypher = fs.readFileSync('./cypher/add' + params.data.category + '.cyp', 'utf8');
        //params_new.cypher = "hello";
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
    route: '/api/cfgItems/:id',
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
