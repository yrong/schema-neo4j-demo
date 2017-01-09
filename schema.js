var Ajv = require('ajv');

var _ = require('lodash');

var ajv = new Ajv({ useDefaults: true });

const cmdbTypeName = {
    VirtualServer:'VirtualServer',
    PhysicalServer:'PhysicalServer',
    Router:'Router',
    Camera:'Camera',
    Storage:'Storage',
    ConfigurationItem:'ConfigurationItem',
    AbstractServer:'AbstractServer',
    Asset:'Asset',
    Hardware:'Hardware',
    NetworkDevice:'NetworkDevice',
    Cabinet:'Cabinet',
    Location:'Location',
    User:'User',
    ITService:'ITService',
    ITServiceGroup:'ITServiceGroup',
    Switch:'Switch',
    Firewall:'Firewall',
    ProcessFlow:'ProcessFlow',
    IncidentFlow:'IncidentFlow'
}

const cmdbConfigurationItemInheritanceRelationship = {
    name:cmdbTypeName.ConfigurationItem,
    children: [
        {
            name:cmdbTypeName.AbstractServer,
            children:[
                {name:cmdbTypeName.PhysicalServer},
                {name:cmdbTypeName.VirtualServer}]
        },
        {
            name:cmdbTypeName.Asset,
            children:[
                {name:cmdbTypeName.Hardware,
                children:[
                    {name:cmdbTypeName.Storage},
                    {name:cmdbTypeName.NetworkDevice,
                    children:[{name:cmdbTypeName.Router},{name:cmdbTypeName.Switch},{name:cmdbTypeName.Firewall}]},
                    {name:cmdbTypeName.Camera},
                    {name:cmdbTypeName.PhysicalServer}
                    ]
                }]
        }]
}

const cmdbTypeLabels= {
    VirtualServer:[cmdbTypeName.VirtualServer,cmdbTypeName.AbstractServer,cmdbTypeName.ConfigurationItem],
    PhysicalServer: [cmdbTypeName.PhysicalServer,cmdbTypeName.AbstractServer,cmdbTypeName.ConfigurationItem,cmdbTypeName.Hardware,cmdbTypeName.Asset],
    Router:[cmdbTypeName.Router,cmdbTypeName.NetworkDevice,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    Camera:[cmdbTypeName.Camera,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    Storage:[cmdbTypeName.Storage,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    IncidentFlow:[cmdbTypeName.IncidentFlow,cmdbTypeName.ProcessFlow]
}

//ConfigurationItem real types
const cmdbConfigurationItemTypes = [cmdbTypeName.PhysicalServer,cmdbTypeName.Router,cmdbTypeName.VirtualServer,cmdbTypeName.Camera,cmdbTypeName.Storage];

//ConfigurationItem auxiliary types
const cmdbConfigurationItemAuxiliaryTypes = [cmdbTypeName.Cabinet,cmdbTypeName.ITService,cmdbTypeName.Location,cmdbTypeName.User,cmdbTypeName.ITServiceGroup];

//ConfigurationItem abstract types
const cmdbConfigurationItemAbstractTypes =  [cmdbTypeName.ConfigurationItem,cmdbTypeName.AbstractServer,cmdbTypeName.Asset,cmdbTypeName.Hardware,cmdbTypeName.NetworkDevice];

//Processflow real types
const cmdbProcessFlowTypes = [cmdbTypeName.IncidentFlow];

//Processflow abstract types
const cmdbProcessFlowAbstractTypes = [cmdbTypeName.ProcessFlow];

//cmdb all types
const cmdbTypesAll = cmdbConfigurationItemAbstractTypes.concat(cmdbConfigurationItemTypes).concat(cmdbConfigurationItemAuxiliaryTypes).concat(cmdbProcessFlowTypes).concat(cmdbProcessFlowAbstractTypes);


_.forEach(cmdbTypesAll,function(type){
    ajv.addSchema(require('./schema/'+ type + '.json'));
});

var checkSchema = function (params) {
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



module.exports.checkSchema = checkSchema;

module.exports.getSchema = getSchema;

module.exports.cmdbConfigurationItemTypes = cmdbConfigurationItemTypes;

module.exports.cmdbConfigurationItemAuxiliaryTypes = cmdbConfigurationItemAuxiliaryTypes;

module.exports.cmdbTypeLabels = cmdbTypeLabels;

module.exports.cmdbTypeName = cmdbTypeName;

module.exports.cmdbConfigurationItemInheritanceRelationship = cmdbConfigurationItemInheritanceRelationship;

module.exports.cmdbProcessFlowTypes = cmdbProcessFlowTypes;
