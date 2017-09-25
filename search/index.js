var config = require('config');

var _ = require('lodash');

var esConfig = config.get('elasticsearch');

var hook = require('../hooks');

var elasticsearch = require('elasticsearch');

var es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port,
    requestTimeout: esConfig.requestTimeout
});

var utils = require('../helper/utils')
var hidden_fields = utils.globalHiddenFields

var schema = require('../schema')

const LOGGER = require('log4js_wrapper')
const logger = LOGGER.getLogger()


var pre_process = function(params) {
    return params
}

const OpsControllerIndex = 'opscontroller',OpsControllerCommandType = 'command'

var addOpsCommand = (command)=>{
    let index_obj = {
        index: OpsControllerIndex,
        type: OpsControllerCommandType,
        body: command
    }
    logger.debug(`add index in es:${JSON.stringify(index_obj,null,'\t')}`)
    es_client.index(index_obj)
}

var addItem = function(result, params, ctx) {
    params = pre_process(params)
    let routes = schema.getApiRoutes(),typeName = hook.getCategoryFromUrl(ctx.url),indexName = routes[typeName].searchable.index
    let index_obj = {
        index: indexName,
        type: typeName,
        id: params.uuid,
        body: _.omit(params,hidden_fields),
        refresh:true
    }
    logger.debug(`add index in es:${JSON.stringify(index_obj,null,'\t')}`)
    return es_client.index(index_obj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        params[hook.STATUS_WARNING] = 'ElasticSearch:' + error.response||String(error)
        return hook.cudItem_postProcess(result, params, ctx);
    });
}

var patchItem = function(result, params, ctx) {
    params = pre_process(params)
    let routes = schema.getApiRoutes(),typeName = hook.getCategoryFromUrl(ctx.url),indexName = routes[typeName].searchable.index
    let index_obj = {
        index: indexName,
        type: typeName,
        id:params.uuid,
        body: {doc:_.omit(params,hidden_fields)},
        refresh:true
    }
    logger.debug(`patch index in es:${JSON.stringify(index_obj,null,'\t')}`)
    return es_client.update(index_obj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        params[hook.STATUS_WARNING] = 'ElasticSearch:' + error.response||String(error)
        return hook.cudItem_postProcess(result, params, ctx);
    });
}

var deleteItem = function(result, params, ctx) {
    var queryObj = params.uuid?{term:{uuid:params.uuid}}:{match_all:{}}
    let routes = schema.getApiRoutes(),typeName = hook.getCategoryFromUrl(ctx.url),indexName
    if(typeName === hook.CATEGORY_ALL)
        indexName = '*'
    else
        indexName = routes[typeName].searchable.index
    var delObj = {
        index: indexName,
        body: {
            query: queryObj
        },
        refresh:true
    }
    logger.debug(`delete index in es:${JSON.stringify(delObj,null,'\t')}`)
    return es_client.deleteByQuery(delObj).then(function (response) {
        if(response&&response.deleted==0)
            params[hook.STATUS_WARNING] = 'ElasticSearch:no record found to delete'
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        params[hook.STATUS_WARNING] = 'ElasticSearch:' + error.response||String(error)
        return hook.cudItem_postProcess(result, params, ctx);
    });
}

var responseWrapper = function(response){
    return {count:response.hits.total,results:_.map(response.hits.hits,(result)=>_.omit(result._source,hidden_fields))}
}

var searchItem = function(params, ctx) {
    var query = params.uuid?`uuid:${params.uuid}`:(params.keyword?params.keyword:'*');
    var _source = params._source?params._source.split(','):true;
    var params_pagination = {"from":0,"size":config.get('perPageSize')},from;
    if(params.page&&params.per_page){
        from = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"from":from,"size":params.per_page}
    }
    var queryObj = params.body?{body:params.body}:{q:query}
    let routes = schema.getApiRoutes(),typeName = hook.getCategoryFromUrl(ctx.url),indexName = routes[typeName].searchable.index
    params.search = true
    var searchObj = _.assign({
        index: indexName,
        type: params.category,
        _source:_source
    },queryObj,params_pagination)
    logger.debug(`search in es:${JSON.stringify(searchObj,null,'\t')}`)
    return es_client.search(searchObj).then(function (response) {
        return hook.queryItems_postProcess(responseWrapper(response), params, ctx);
    });
}

var checkStatus = ()=> {
    return es_client.ping({
        requestTimeout: Infinity
    })
}

module.exports = {searchItem,deleteItem,patchItem,addItem,checkStatus,addOpsCommand}