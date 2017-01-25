var _ = require('lodash');
var uuid = require('node-uuid');
var schema = require('./schema');
var MAXNUM = 1000;
var cypherBuilder = require('./helper/cypherBuilder');
var cypherResponseMapping = require('./helper/cypherResponseMapping')

var getTypeFromUrl = function (url) {
    var type;
    if (url.includes('/it_services/service')) {
        type = schema.cmdbTypeName.ITService;
    } else if (url.includes('/it_services/group')) {
        type =  schema.cmdbTypeName.ITServiceGroup;
    } else if (url.includes('/cfgItems')) {
        type =  schema.cmdbTypeName.ConfigurationItem;
    } else if (url.includes('/processFlows')) {
        type =  schema.cmdbTypeName.ProcessFlow;
    } else {
        type = _.find(schema.cmdbConfigurationItemAuxiliaryTypes, function (type) {
            return url.includes(type.toLowerCase());
        });
    }
    return type;
};

var createOrUpdateCypherGenerator = (params)=>{
    if(schema.cmdbConfigurationItemTypes.includes(params.category)){
        params.fields.asset_location = _.isString(params.fields.asset_location)?params.fields.asset_location:JSON.stringify(params.fields.asset_location);
        params.cyphers = cypherBuilder.generateCmdbCyphers(params);
    }else if(params.category === schema.cmdbTypeName.ITService){
        params.cyphers = cypherBuilder.generateITServiceCyphers(params);
    }else if(schema.cmdbProcessFlowTypes.includes(params.category)){
        params.fields = _.omit(params.fields,['desc','note','attachment']);
        params.cyphers = cypherBuilder.generateProcessFlowCypher(params);
    }else{
        params.cypher = cypherBuilder.generateAddNodeCypher(params);
    }
    return params;
}

var deleteCypherGenerator = (params)=>{
    params.cypher = cypherBuilder.generateDelNodeCypher();
    return params;
}

const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_INFO = 'info',
    CONTENT_QUERY_SUCESS='query success',CONTENT_NO_RECORD='no record found',CONTENT_OPERATION_SUCESS='operation success'
    DISPLAY_AS_TOAST='toast';

var paginationParamsGenerator = function (params) {
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

var queryParamsCypherGenerator = function (params, ctx) {
    let url = ctx.req.url;
    let type = getTypeFromUrl(url);
    params.type = type
    params.url = url
    if(params.keyword){
        params.keyword = '(?i).*' +params.keyword + '.*';
        params.cypher = cypherBuilder.generateQueryNodesByKeyWordCypher(type);
    }else if(params.uuids){
        params.uuids = params.uuids.split(",");
        params.cypher = cypherBuilder.generateQueryByUuidsCypher(type);
    }else if(params.search){
        params.search = params.search.split(",");
        params.cypher = cypherBuilder.generateAdvancedSearchCypher(type);
    }else if(params.uuid){
        params.cypher = cypherBuilder.generateQueryNodeCypher(type);
        if(url.includes('/processFlows')&&url.includes('/timeline'))
            params.cypher = cypherBuilder.generateQueryProcessFlowTimelineCypher()
    }
    else{
        params.cypher = cypherBuilder.generateQueryNodesCypher(type);
    }
    return params;
}

module.exports = {
    cudItem_preProcess:function (params,ctx) {
        params = _.assign({},params);
        if(params.method === 'POST'){
            params.fields = params.data.fields;
            params.fields.category = params.data.category;
            params.fields.uuid = params.fields.uuid||uuid.v1();
            params = _.assign(params,params.fields);
            params.created = Date.now()
            createOrUpdateCypherGenerator(params);
        }else if(params.method === 'DEL'){
            deleteCypherGenerator(params);
        }else if(params.method === 'PUT' || params.method === 'PATCH'){
            return ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.cmdb_findNode_cypher(params.data.category),params,true).then((result)=>{
                if(result&&result[0]){
                    params.fields_old = result[0]
                    params.fields = _.assign({},result[0]);
                    params.fields = _.assign(params.fields,params.data.fields);
                    params.fields.change = JSON.stringify(params.data.fields);
                    params = _.assign(params,params.fields);
                    params.last_updated = Date.now()
                    createOrUpdateCypherGenerator(params);
                    return params;
                }else{
                    throw new Error("no record found to patch,uuid is" + params.uuid);
                }
            })
        }
        return params;
    },
    cudItem_postProcess:function (result,params,ctx) {
        var result_wrapped = {
            "status":STATUS_INFO,
            "content": CONTENT_OPERATION_SUCESS,
            "displayAs":DISPLAY_AS_TOAST
        }
        if(params.method == 'DEL' && params.uuid && result.length != 1){
            result_wrapped = {
                "status":STATUS_WARNING,
                "content": CONTENT_NO_RECORD,
                "displayAs":DISPLAY_AS_TOAST
            }
        }
        if(params.uuid)
            result_wrapped.uuid = params.uuid;
        return　result_wrapped;
    },
    queryItems_preProcess:function (params,ctx) {
        params = paginationParamsGenerator(params);
        params = queryParamsCypherGenerator(params,ctx);
        return params;
    },
    queryItems_postProcess:function (result,params) {
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
            return result_new;
        }
        result = cypherResponseMapping.resultMapping(result,params);
        result = cypherResponseMapping.removeInternalPropertys(result);
        result_new.data = result;
        return result_new;
    },
    configurationItemCategoryProcess:function(params) {
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
}

