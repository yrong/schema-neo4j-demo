const _ = require('lodash');
const schema = require('redis-json-schema')

const globalHiddenFields = ['fields', 'cyphers', 'cypher','method', 'data', 'token', 'fields_old', 'change', 'url', '_id', '_index', '_type','user']
    , globalHiddenFieldsInAllLevel = ['passwd', 'id']

const removeInternalProperties = (val) => {
    for (let prop in val) {
        for(let hidden_prop of globalHiddenFields){
            if (prop === hidden_prop)
                delete val[prop];
        }
    }
    return recursivelyRemoveInternalProperties(val)
}

const recursivelyRemoveInternalProperties =  (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return recursivelyRemoveInternalProperties(val);
        });
    } else {
        for (let prop in val) {
            for(let hidden_prop of globalHiddenFieldsInAllLevel){
                if (prop === hidden_prop)
                    delete val[prop];
            }
            if (typeof val[prop] === 'object')
                if(prop !== 'status')//not remove 'fields' in field 'status'
                    recursivelyRemoveInternalProperties(val[prop]);
        }
    }
    return val;
}

var propertiesCombine = (results)=>{
    return _.map(results,(result)=>{
        if(result.self&&result.members){
            result = _.merge(result.self,{members:result.members})
            return result
        }
        return result
    })
}

const resultMapper = async (result, params) => {
    if(schema.getMemberType(params.category))
        result = propertiesCombine(result)
    result = removeInternalProperties(result)
    return result
}

module.exports = {
    resultMapper,
    globalHiddenFields
}