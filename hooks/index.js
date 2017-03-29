var _ = require('lodash')
var uuid = require('uuid')
var schema = require('../schema')
var config = require('config')
var cypherBuilder = require('../cypher/cypherBuilder')
var cypherResponseMapping = require('../cypher/cypherResponseMapping')
var cache = require('../cache')
var logger = require('../logger')
var routesDef = require('../routes/def')
var utils = require('../helper/utils')

var getCategoryFromUrl = function (url) {
    let category,key,val
    for (key in routesDef){
        val = routesDef[key]
        if(url.includes(val.route)){
            category = key
            break
        }
    }
    if(!category)
        throw new Error('can not find category from url:'+url)
    return category;
}

var logCypher = (params)=>{
    let cypher = params.cyphers?JSON.stringify(params.cyphers,null,'\t'):params.cypher
    let cypher_params = _.omit(params,['cypher','cyphers','data','fields','fields_old','method','url','token'])
    logger.debug(`cypher to executed:${JSON.stringify({cypher:cypher,params:cypher_params},null,'\t')}`)
}

var createOrUpdateCypherGenerator = (params)=>{
    if(schema.cmdbConfigurationItemTypes.includes(params.category)){
        params.cyphers = cypherBuilder.generateCmdbCyphers(params);
    }else if(params.category === schema.cmdbTypeName.ITService){
        params.cyphers = cypherBuilder.generateITServiceCyphers(params);
    }else if(schema.cmdbProcessFlowTypes.includes(params.category)){
        params.cyphers = cypherBuilder.generateProcessFlowCypher(params);
    }else{
        params.cypher = cypherBuilder.generateAddNodeCypher(params);
    }
    if(params.method == 'PUT'||params.method =='PATCH')
        params.cyphers = [...params.cyphers,cypherBuilder.generateAddPrevNodeRelCypher(params)];
    logCypher(params)
    return params;
}

var deleteCypherGenerator = (params)=>{
    params.cypher = cypherBuilder.generateDelNodeCypher();
    logCypher(params)
    return params;
}

const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_INFO = 'info',
    CONTENT_QUERY_SUCESS='query success',CONTENT_NO_RECORD='no record found',CONTENT_OPERATION_SUCESS='operation success',
    DISPLAY_AS_TOAST='toast';

var paginationParamsGenerator = function (params) {
    var params_pagination = {"skip":0,"limit":config.get('config.perPageSize')};
    if(params.page&&params.per_page){
        var skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
        if(params.uuids || params.uuid || params.search){
            throw new Error("search query not support pagination temporarily");
        }
    }
    return _.assign(params,params_pagination);
}

var queryParamsCypherGenerator = function (params) {
    if(params.keyword){
        params.cypher = cypherBuilder.generateQueryNodesByKeyWordCypher(params);
    }else if(params.uuid){
        params.cypher = cypherBuilder.generateQueryNodeCypher(params);
        if(utils.isChangeTimelineQuery(params.url))
            params.cypher = cypherBuilder.generateQueryNodeChangeTimelineCypher(params)
    }
    else{
        params.cypher = cypherBuilder.generateQueryNodesCypher(params);
    }
    if(params.category === schema.cmdbTypeName.ITService){
        if(params.uuids){
            params.uuids = params.uuids.split(",");
            params.cypher = cypherBuilder.generateQueryITServiceByUuidsCypher(params);
        }else if(params.search){
            params.search = params.search.split(",");
            params.cypher = cypherBuilder.generateAdvancedSearchITServiceCypher(params);
        }
    }
    logCypher(params)
    return params;
}

var cudItem_params_stringify = (params, list) => {
    for(let name of list){
        if(_.isObject(params.fields[name])){
            params.fields[name] = JSON.stringify(params.fields[name])
        }
        if(params.change&&_.isObject(params.change[name])){
            params.change[name] = JSON.stringify(params.change[name])
        }
    }
    for (let key in params.fields){
        if(_.isArray(params.fields[key])){
            if(_.isObject(params.fields[key][0]))
                throw new Error('Property values can only be of primitive types or arrays thereof,invalid field:' + key)
            if(params.fields[key].length ==1&&params.fields[key][0]=='')
                params.fields[key] = []
        }
        else if(_.isObject(params.fields[key])){
            throw new Error('Property values can only be of primitive types or arrays thereof,invalid field:' + key)
        }
    }
    params = _.assign(params, params.fields)
    for(let name of list){
        if(_.isString(params[name])){
             try{
                 params[name] = JSON.parse(params[name])
             }catch(error){
                 //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
             }
        }
    }
}

var cudItem_callback = (params,update)=>{
    params.fields = _.assign(params.fields, params.data.fields)
    if(update){
        params.fields.lastUpdated = Date.now()
    }else{
        params.fields.category = params.data.category
        params.fields.uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
        params.fields.created = Date.now()
    }
    cudItem_params_stringify(params,utils.objectFields)
    return createOrUpdateCypherGenerator(params)
}

module.exports = {
    cudItem_preProcess: function (params, ctx) {
        params.method = ctx.method,params.url = ctx.url,params.category = params.data?params.data.category:getCategoryFromUrl(params.url)
        if (params.method === 'POST') {
            if (params.data.category === schema.cmdbTypeName.IncidentFlow)
                return ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateSequence(schema.cmdbTypeName.IncidentFlow), params, true).then((result) => {
                    params.data.fields.pfid = 'IR' + result[0]
                    return cudItem_callback(params)
                })
            else
                return cudItem_callback(params)
        }
        else if (params.method === 'PUT' || params.method === 'PATCH') {
            return ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeCypher(params), params, true).then((result) => {
                if (result && result[0]) {
                    params.fields_old = result[0]
                    params.fields = _.assign({}, result[0]);
                    params.change = params.data.fields
                    return cudItem_callback(params,true)
                } else {
                    throw new Error("no record found to patch,uuid is" + params.uuid);
                }
            })
        } else if (params.method === 'DELETE') {
            return deleteCypherGenerator(params);
        }
    },
    cudItem_postProcess:function (result,params,ctx) {
        let response_wrapped = {
            "status":STATUS_INFO,
            "content": CONTENT_OPERATION_SUCESS,
            "displayAs":DISPLAY_AS_TOAST
        }
        if(params.method==='POST'||params.method==='PUT'||params.method==='PATCH'){
            if(!params.uuid||!params.fields)
                throw new Error('added obj without uuid')
            cache.set(params.uuid,{name:params.fields.name,uuid:params.uuid})
        }
        if(params.method==='DEL'){
            if(params.uuid)
                cache.del(params.uuid)
            if(params.url.includes('items'))
                cache.flushAll()
            if(params.uuid && (result.length != 1&&result.total!=1))
                response_wrapped = {
                    "status":STATUS_WARNING,
                    "content": CONTENT_NO_RECORD,
                    "displayAs":DISPLAY_AS_TOAST
                }
        }
        if(params.uuid)
            response_wrapped.uuid = params.uuid;
        return　response_wrapped;
    },
    queryItems_preProcess:function (params,ctx) {
        params.method = ctx.method,params.url = ctx.url,params.category = getCategoryFromUrl(ctx.url)
        params = paginationParamsGenerator(params);
        params = queryParamsCypherGenerator(params);
        return params;
    },
    queryItems_postProcess:function (result,params,ctx) {
        let response_wrapped = {
            "status":STATUS_OK, //ok, info, warning, error,
            "message":{
                "content":CONTENT_QUERY_SUCESS,
                "displayAs":DISPLAY_AS_TOAST//toast, modal, console, alert
            },
            "data":{}
        };
        result = _.isArray(result)&&result.length>0?result[0]:result;
        if(!result||result.total==0||result.count==0||result.length==0){
            response_wrapped.message.content = CONTENT_NO_RECORD;
            response_wrapped.status = STATUS_WARNING;
            return response_wrapped;
        }
        result = cypherResponseMapping.resultMapper(result,params);
        result = cypherResponseMapping.removeInternalPropertys(result);
        response_wrapped.data = result;
        return response_wrapped;
    },
    configurationItemCategoryProcess:function(params) {
        let response_wrapped = {
            "status":STATUS_OK, //ok, info, warning, error,
            "message":{
                "content":CONTENT_QUERY_SUCESS,
                "displayAs":DISPLAY_AS_TOAST//toast, modal, console, alert
            },
            "data":{}
        };
        response_wrapped.data = schema.cmdbConfigurationItemInheritanceRelationship;
        if(params.filter == schema.cmdbTypeName.Asset){
            response_wrapped.data = schema.cmdbConfigurationItemInheritanceRelationship.children[1];
        }
        return response_wrapped;
    },
    getCategoryFromUrl:getCategoryFromUrl
}

