var config = require('config');

var _ = require('lodash');

var esConfig = config.get('config.elasticsearch');

var hook = require('./hook');

var elasticsearch = require('elasticsearch');

var es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port
});

var indexName = 'cmdb',typeName = 'processFlow';

var wrapResponseInHook = function(promise,params,ctx) {
    return new Promise(function (resolve, reject) {
        promise.then(function (response) {
            var result = hook.cudItem_postProcess(response, params, ctx);
            resolve(result);
        }, function (error) {
            reject(error);
        });
    });
}

var addProcessFlow = function(result,params,ctx) {
    return es_client.index({
        index: indexName,
        type: typeName,
        body: _.omit(params,'fields'),
        refresh:true
    }).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.addProcessFlow = addProcessFlow;

var delProcessFlows = function(result,params,ctx) {
    return es_client.deleteByQuery({
        index: indexName,
        type: typeName,
        body: {
            query: {
                match_all: {}
            }
        }
    }).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.delProcessFlows = delProcessFlows;

var searchProcessFlows = function(params,ctx) {
    var query =  params.keyword?params.keyword:'*';
    return es_client.search({
        index: indexName,
        type: typeName,
        q: query
    }).then(function (response) {
        return response;
    }, function (error) {
        throw error;
    });
}

module.exports.searchProcessFlows = searchProcessFlows;