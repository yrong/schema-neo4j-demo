var _ = require('lodash');
var schema = require('./../schema')

const hidden_properties = ['id','_id','_index','_type','passwd','change']
const removeInternalPropertys = (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return removeInternalPropertys(val);
        });
    } else {
        for (prop in val) {
            for(hidden_prop of hidden_properties){
                if (prop === hidden_prop)
                    delete val[prop];
            }
            //if (prop === 'id' || prop === '_index' || prop === '_type' || prop === '_id' || prop === 'passwd' || prop === 'change')
            if (typeof val[prop] === 'object')
                removeInternalPropertys(val[prop]);
        }
    }
    return val;
}

module.exports = {
    removeInternalPropertys: removeInternalPropertys,
    resultMapping: (result, params) => {
        if (params.type === schema.cmdbTypeName.ConfigurationItem) {
            result = _.assign(result, result.configurationItem);
            result = _.omit(result, ['configurationItem']);
            if (result.user && !result.user.alias) {
                result = _.omit(result, ['user']);
            }
        } else if (params.type === schema.cmdbTypeName.ProcessFlow) {
            if (params.url.includes('/timeline')) {
                let change_logs = [], change_log, index = 0, segments = result[0].segments
                for (segment of segments) {
                    change_log = {}
                    change_log.user = segment.start.committer
                    change_log.time = segment.start.lastUpdated
                    change_log.action = (index == segments.length - 1 ? 'created' : 'updated')
                    change_log.object = {
                        start: _.omit(segment.start, ['change']),
                        end: _.omit(segment.end, ['change']),
                        change_fields: JSON.parse(segment.start.change)
                    }
                    change_logs.push(change_log)
                    index++
                }
                result = change_logs
            }
        }
        return result
    }
}

