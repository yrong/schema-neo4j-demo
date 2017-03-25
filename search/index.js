var config = require('config');

var _ = require('lodash');

var esConfig = config.get('config.elasticsearch');

var hook = require('../hooks');

var elasticsearch = require('elasticsearch');

var es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port
});

var utils = require('../helper/utils')
var hidden_fields = utils.globalHiddenFields

var schema = require('../schema')

var logger = require('../logger')

var validate = require('uuid-validate')

const file_upload = require('koa2-file-upload-local')

const store = file_upload(config.get('config.upload')[schema.cmdbTypeName.ProcessFlow]).store

var pre_process = function(params) {
    if(params.attachment&&validate(params.attachment, 1)){
        params.attachment = store.get(params.attachment)
    }
    return params
}

const ConfigurationItemIndex = 'cmdb',ProcessFlowIndex = 'processflow'

var getIndexName = function(category) {
    let indexName;
    if(schema.cmdbConfigurationItemTypes.includes(category)||category===schema.cmdbTypeName.ConfigurationItem)
        indexName = ConfigurationItemIndex
    else if(schema.cmdbProcessFlowTypes.includes(category)||category===schema.cmdbTypeName.ProcessFlow)
        indexName = ProcessFlowIndex
    else
        throw new Error('can not find index in es:'+category)
    return indexName
}

var addItem = function(result, params, ctx) {
    params = pre_process(params)
    let indexName = getIndexName(params.category),typeName = _.last(schema.cmdbTypeLabels[params.category])
    let index_obj = {
        index: indexName,
        type: typeName,
        id: params.uuid,
        body: _.omit(params,hidden_fields),
        refresh:esConfig.refresh
    }
    logger.debug(`add index in es:${JSON.stringify(index_obj,null,'\t')}`)
    return es_client.index(index_obj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

var patchItem = function(result, params, ctx) {
    params = pre_process(params)
    let indexName = getIndexName(params.category),typeName = _.last(schema.cmdbTypeLabels[params.category])
    let index_obj = {
        index: indexName,
        type: typeName,
        id:params.uuid,
        body: {doc:_.omit(params,hidden_fields)},
        refresh:esConfig.refresh
    }
    logger.debug(`patch index in es:${JSON.stringify(index_obj,null,'\t')}`)
    return es_client.update(index_obj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

var deleteItem = function(result, params, ctx) {
    var queryObj = params.uuid?{term:{uuid:params.uuid}}:{match_all:{}}
    let indexName = getIndexName(params.category),typeName = params.category
    var delObj = {
        index: indexName,
        type: typeName,
        body: {
            query: queryObj
        },
        refresh:esConfig.refresh
    }
    logger.debug(`delete index in es:${JSON.stringify(delObj,null,'\t')}`)
    return es_client.deleteByQuery(delObj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

/**
 * just for integration test purpose
 */
var deleteAll = function(result,params,ctx) {
    return es_client.deleteByQuery({index:[ConfigurationItemIndex,ProcessFlowIndex],body:{query:{match_all:{}}}})
}


var responseWrapper = function(response){
    return {count:response.hits.total,results:_.map(response.hits.hits,(result)=>_.omit(result._source,hidden_fields))}
}

var searchItem = function(params, ctx) {
    var query = params.uuid?`uuid:${params.uuid}`:(params.keyword?params.keyword:'*');
    var _source = params._source?params._source.split(','):true;
    var params_pagination = {"from":0,"size":config.get('config.perPageSize')},from;
    if(params.page&&params.per_page){
        from = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"from":from,"size":params.per_page}
    }
    var queryObj = params.body?{body:params.body}:{q:query}
    let typeName = hook.getCategoryFromUrl(ctx.url),indexName = getIndexName(typeName)
    var searchObj = _.assign({
        index: indexName,
        type: typeName,
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

module.exports = {searchItem,deleteItem,patchItem,addItem,checkStatus,deleteAll}