var config = require('config');

var _ = require('lodash');

var esConfig = config.get('config.elasticsearch');

var hook = require('./hook');

var elasticsearch = require('elasticsearch');

var es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port
});

var indexName = 'cmdb',typeName = 'processFlow';

var addProcessFlow = function(result,params,ctx) {
    return es_client.index({
        index: indexName,
        type: typeName,
        body: _.omit(params,['fields','cyphers','method']),
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
    var query = params.uuid?`uuid:${params.uuid}`:(params.keyword?params.keyword:'*');
    var _source = params._source?params._source.split(','):true;
    return es_client.search({
        index: indexName,
        type: typeName,
        q: query,
        _source:_source
    }).then(function (response) {
        return hook.queryItems_postProcess(response.hits, params, ctx);
    }, function (error) {
        throw error;
    });
}

module.exports.searchProcessFlows = searchProcessFlows;