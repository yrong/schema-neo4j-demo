var _ = require('lodash');
var uuid = require('node-uuid');
var schema = require('./schema');
var MAXNUM = 1000;
var helper = require('./cypher_helper');

var cudItem_preProcess = function (params) {
    var params_new = _.assign({},params);
    if(params.method === 'POST' || params.method === 'PUT'){
        params_new = {"fields":params.data.fields};
        params_new = _.assign(params_new,params.data.fields);
        params_new.method = params.method;
        params_new.category = params.data.category;
        params_new.fields.category = params.data.category;
        params_new.fields.uuid = params_new.uuid = params.uuid?params.uuid:uuid.v1();
        if(schema.cmdbConfigurationItemTypes.includes(params_new.category)){
            params_new.fields.asset_location = JSON.stringify(params_new.fields.asset_location);
            //params_new.fields.updated_by = 1
            params_new.cyphers = helper.generateCmdbCyphers(params_new);
        }else if(params_new.category === schema.cmdbTypeName.ITService){
            params_new.cyphers = helper.generateITServiceCyphers(params_new);
        }else if(schema.cmdbProcessFlowTypes.includes(params_new.category)){
            // params_new.fields.it_service
            params_new.fields = _.omit(params_new.fields,['desc','note','attachment','it_service','reference_process_flow','reference_kb']);
            params_new.cyphers = helper.generateProcessFlowCypher(params_new);
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
    let url = ctx.req.url;
    if(params.keyword){
        params.keyword = '(?i).*' +params.keyword + '.*';
        params.cypher = helper.generateQueryNodesByKeyWordCypher(url);
    }else if(params.uuids){
        params.uuids = params.uuids.split(",");
        params.cypher = helper.generateQueryITServiceByUuidsCypher(url);
    }else if(params.search){
        params.search = params.search.split(",");
        params.cypher = helper.generateAdvancedSearchITServiceCypher(url);
    }else if(params.uuid){
        params.cypher = helper.generateQueryNodeCypher(url);
    }
    else{
        params.cypher = helper.generateQueryNodesCypher(url);
    }
    return params;
}

var queryItems_preProcess = function (params,ctx) {
    params = paginationQueryItems_preProcess(params);
    params = keyWordQueryItems_preProcess(params,ctx);
    return params;
}

var base_query_response = {
    "status":"ok", //ok, info, warning, error,
    "message":{
        "content":"query success",
        "displayAs":"toast" //toast, modal, console, alert
    },
    "data":{}
};

var queryItems_postProcess = function (result,params) {
    var result_new = Object.assign({},base_query_response);
    result = _.isArray(result)&&result.length>0?result[0]:result;
    if(!result||result.total==0||result.count==0||result.length==0){
        result_new.message.content = "no record found";
    }
    result_new.data = helper.removeInternalPropertys(result);
    return result_new;
};

var configurationItemCategoryProcess = function(params) {
    var result_new = Object.assign({},base_query_response);
    result_new.data = schema.cmdbConfigurationItemInheritanceRelationship;
    if(params.filter == schema.cmdbTypeName.Asset){
        result_new.data = schema.cmdbConfigurationItemInheritanceRelationship.children[1];
    }
    return result_new;
}


module.exports = {
    'cudItem_preProcess':cudItem_preProcess,
    'cudItem_postProcess':cudItem_postProcess,
    'queryItems_preProcess':queryItems_preProcess,
    'queryItems_postProcess':queryItems_postProcess,
    'configurationItemCategoryProcess':configurationItemCategoryProcess
}

