var _ = require('lodash');
var uuid = require('node-uuid');
var schema = require('./schema');
var MAXNUM = 1000;
var helper = require('./cypher_helper');

var cudItem_preProcess = function (params) {
    var params_new = params;
    if(params.method === 'POST' || params.method === 'PUT'){
        params_new = {"fields":params.data.fields};
        params_new = _.assign(params_new,params.data.fields);
        params_new.method = params.method;
        params_new.category = params.data.category;
        params_new.fields.uuid = params_new.uuid = params.uuid?params.uuid:uuid.v1();
        if(schema.cmdbTypes.includes(params_new.category)){
            params_new.fields.asset_location = JSON.stringify(params_new.fields.asset_location);
            params_new.fields.updated_by = 1//user.userid
            params_new.cyphers = helper.generateCmdbCyphers(params_new);
        }else if(params_new.category === schema.cmdbTypeName.ITService){
            params.data.fields.children = JSON.stringify(params.data.fields.children);
            params.data.fields.dependencies = JSON.stringify(params.data.fields.dependencies);
            params.data.fields.dependendents = JSON.stringify(params.data.fields.dependendents);
            params_new.cyphers = helper.generateITServiceCyphers(params_new);
        }else if(params_new.category === schema.cmdbTypeName.ProcessFlow){
            params_new.fields = _.omit(params_new.fields,'desc');
            params_new.cypher = helper.generateProcessFlowCypher();
        }else{
            params_new.cypher = helper.generateAddNodeCypher(params_new);
        }
    }else if(params.method === 'DEL'){
        params_new.cypher = helper.generateDelNodeCypher();
    }
    return params_new;
};

var cudItem_postProcess = function (result,params,ctx) {
    var result_new = {
        "status":"info",
        "content": 'Operation Success!',
        "displayAs":"toast"
    }
    if(params.method == 'DEL' && params.uuid && result.length != 1){
        result_new = {
            "status":"warn",
            "content": 'no record found!',
            "displayAs":"toast"
        }
    }
    if(params.uuid)
        result_new.uuid = params.uuid;
    return　result_new;
};

var paginationQueryItems_preProcess = function (params) {
    var params_pagination = {"skip":0,"limit":MAXNUM};
    if(params.page&&params.per_page){
        var skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
        if(params.uuids || params.uuid || params.search){
            throw new Error("search query not support pagination temporarily");
        }
    }
    return _.assign(params,params_pagination);
};

var keyWordQueryItems_preProcess = function (params,ctx) {
    if(params.keyword){
        params.keyword = '(?i).*' +params.keyword + '.*';
        params.cypher = helper.generateQueryNodesByKeyWordCypher(ctx.matched[0].path);
    }else if(params.uuids){
        params.uuids = params.uuids.split(",");
        params.cypher = helper.generateQueryITServiceByUuidsCypher(ctx.matched[0].path);
    }else if(params.search){
        params.search = params.search.split(",");
        params.cypher = helper.generateAdvancedSearchITServiceCypher(ctx.matched[0].path);
    }
    else{
        params.cypher = helper.generateQueryNodesCypher(ctx.matched[0].path);
    }
    return params;
}

var queryItems_preProcess = function (params,ctx) {
    params = paginationQueryItems_preProcess(params);
    params = keyWordQueryItems_preProcess(params,ctx);
    return params;
}

var queryItems_postProcess = function (result,params) {
    var result_new =
        {
            "status":"ok", //ok, info, warning, error,
            "message":{
                "content":"no record found",
                "displayAs":"toast" //toast, modal, console, alert
            },
            "data":{}
        };
    if(result&&result[0]){
        result_new.message.content = "query success";
        result_new.data = helper.removeIdProperty(result[0]);
    }
    return result_new;
};

module.exports = {
    'cudItem_preProcess':cudItem_preProcess,
    'cudItem_postProcess':cudItem_postProcess,
    'queryItems_preProcess':queryItems_preProcess,
    'queryItems_postProcess':queryItems_postProcess
}

