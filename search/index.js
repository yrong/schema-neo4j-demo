var config = require('config');

var _ = require('lodash');

var esConfig = config.get('config.elasticsearch');

var hook = require('./../hook');

var elasticsearch = require('elasticsearch');

var es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port
});

var indexName = esConfig.index

var hidden_fields = ['fields','cyphers','method','data','token','fields_old','change','url','id']

var schema = require('../schema')

var addItem = function(result, params, ctx) {
    return es_client.index({
        index: indexName,
        type: _.last(schema.cmdbTypeLabels[params.category]),
        id:params.uuid,
        body: _.omit(params,hidden_fields),
        refresh:true
    }).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.addItem = addItem;

var patchItem = function(result, params, ctx) {
    return es_client.update({
        index: indexName,
        type: _.last(schema.cmdbTypeLabels[params.category]),
        id:params.uuid,
        body: {doc:_.omit(params,hidden_fields)},
        refresh:true
    }).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.patchItem = patchItem;

var delItem = function(result, params, ctx) {
    var queryObj = params.uuid?{term:{uuid:params.uuid}}:{match_all:{}}
    return es_client.deleteByQuery({
        index: indexName,
        type: hook.getCategoryFromUrl(params.url),
        body: {
            query: queryObj
        }
    }).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.delItem = delItem;

var responseWrapper = function(response){
    return {count:response.hits.total,results:_.map(response.hits.hits,(result)=>_.omit(result._source,hidden_fields))}
}

var searchItem = function(params, ctx) {
    var query = params.uuid?`uuid:${params.uuid}`:(params.keyword?params.keyword:'*');
    var _source = params._source?params._source.split(','):true;
    var params_pagination = {"from":0,"size":10},from;
    if(params.page&&params.per_page){
        from = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"from":from,"size":params.per_page}
    }
    var queryObj = params.body?{body:params.body}:{q:query}

    var searchObj = _.assign({
        index: indexName,
        type: hook.getCategoryFromUrl(params.url),
        _source:_source
    },queryObj,params_pagination)
    return es_client.search(searchObj).then(function (response) {
        return hook.queryItems_postProcess(responseWrapper(response), params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.searchItem = searchItem;