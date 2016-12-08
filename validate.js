var Ajv = require('ajv');

var _ = require('lodash');

var ajv = new Ajv({ useDefaults: true });

var cmdbTypes = ['ConfigurationItem','AbstractServer','Asset','Hardware','Cabinet','ITService','Location','PhysicalServer','Router','VirtualServer'];

_.forEach(cmdbTypes,function(type){
    ajv.addSchema(require('./schema/'+ type + '.json'));
});

var checkCfgItem = function (params) {
    if(!params.data||!params.data.category){
        throw new Error("cfgItem does not contain category field!");
    }
    var valid = ajv.validate('/'+params.data.category,params.data.fields);
    if(!valid){
        throw new Error(ajv.errorsText());
    }
    return valid;
};

var _getSchema = function (id) {
    return ajv.getSchema(id).schema;
};


var getSchema = function(id) {
    var schema = _getSchema(id);
    schema = extendSchema(schema);
    return schema;
}

var extendSchema = function(schema) {
    if(_.has(schema,"$ref")){
        schema = _.extend(schema,_getSchema(schema['$ref']));
        schema = _.omit(schema,"$ref");
    }
    if(_.has(schema,"allOf")){
        schema.allOf = _.map(schema.allOf,function(schema){
            return extendSchema(schema);
        })
    }
    return schema;
}



module.exports.checkCfgItem = checkCfgItem;

module.exports.getSchema = getSchema;