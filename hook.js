var _ = require('lodash');
var uuid = require('node-uuid');
var schema = require('./schema');
var MAXNUM = 1000;
var cypher = require('./cypher');

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
            params_new.cyphers = cypher.generateCmdbCyphers(params_new);
        }else if(params_new.category === schema.cmdbTypeName.ITService){
            params_new.cyphers = cypher.generateITServiceCyphers(params_new);
        }else if(schema.cmdbProcessFlowTypes.includes(params_new.category)){
            // params_new.fields.it_service
            params_new.fields = _.omit(params_new.fields,['desc','note','attachment','it_service','reference_process_flow','reference_kb']);
            params_new.cyphers = cypher.generateProcessFlowCypher(params_new);
        }else{
            params_new.cypher = cypher.generateAddNodeCypher(params_new);
        }
    }else if(params.method === 'DEL'){
        params_new.cypher = cypher.generateDelNodeCypher(params_new);
    }
    return params_new;
};

const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_INFO = 'info',
    CONTENT_QUERY_SUCESS='query success',CONTENT_NO_RECORD='no record found',CONTENT_OPERATION_SUCESS='operation success'
    DISPLAY_AS_TOAST='toast';

var cudItem_postProcess = function (result,params,ctx) {
    var result_new = {
        "status":STATUS_INFO,
        "content": CONTENT_OPERATION_SUCESS,
        "displayAs":DISPLAY_AS_TOAST
    }
    if(params.method == 'DEL' && params.uuid && result.length != 1){
        result_new = {
            "status":STATUS_WARNING,
            "content": CONTENT_NO_RECORD,
            "displayAs":DISPLAY_AS_TOAST
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
    let type = cypher.getTypeFromUrl(url);
    params.type = type;
    if(params.keyword){
        params.keyword = '(?i).*' +params.keyword + '.*';
        params.cypher = cypher.generateQueryNodesByKeyWordCypher(type);
    }else if(params.uuids){
        params.uuids = params.uuids.split(",");
        params.cypher = cypher.generateQueryITServiceByUuidsCypher(type);
    }else if(params.search){
        params.search = params.search.split(",");
        params.cypher = cypher.generateAdvancedSearchITServiceCypher(type);
    }else if(params.uuid){
        params.cypher = cypher.generateQueryNodeCypher(type);
    }
    else{
        params.cypher = cypher.generateQueryNodesCypher(type);
    }
    return params;
}

var queryItems_preProcess = function (params,ctx) {
    params = paginationQueryItems_preProcess(params);
    params = keyWordQueryItems_preProcess(params,ctx);
    return params;
}

var queryItems_postProcess = function (result,params) {
    let base_query_response = {
        "status":STATUS_OK, //ok, info, warning, error,
        "message":{
            "content":CONTENT_QUERY_SUCESS,
            "displayAs":DISPLAY_AS_TOAST//toast, modal, console, alert
        },
        "data":{}
    };
    var result_new = _.assign({},base_query_response);
    result = _.isArray(result)&&result.length>0?result[0]:result;
    if(!result||result.total==0||result.count==0||result.length==0){
        result_new.message.content = CONTENT_NO_RECORD;
        result_new.status = STATUS_WARNING;
    }
    result = cypher.removeInternalPropertys(result);
    result = cypher.resultMapping(result,params);
    result_new.data = result;
    return result_new;
};

var configurationItemCategoryProcess = function(params) {
    let base_query_response = {
        "status":STATUS_OK, //ok, info, warning, error,
        "message":{
            "content":CONTENT_QUERY_SUCESS,
            "displayAs":DISPLAY_AS_TOAST//toast, modal, console, alert
        },
        "data":{}
    };
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

