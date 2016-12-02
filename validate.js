var Ajv = require('ajv');

var _ = require('lodash');

var ajv = new Ajv({ useDefaults: true });

var abstractTypes = ['ConfigurationItem','AbstractServer','Asset','Hardware'];

_.forEach(abstractTypes,function(type){
    ajv.addSchema(require('./schema/'+ type + '.json'));
});

var checkCfgItem = function (params) {
    if(!params.data||!params.data.category){
        throw new Error("cfgItem does not contain category field!");
    }
    var valid = ajv.validate(require('./schema/'+ params.data.category + '.json'),params.data.fields);
    if(!valid){
        throw new Error(ajv.errorsText());
    }
    return valid;
};

module.exports.checkCfgItem = checkCfgItem;