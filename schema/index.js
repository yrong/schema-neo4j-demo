var Ajv = require('ajv');

var _ = require('lodash');

var ajv = new Ajv({ useDefaults: true });

var config = require('config');

var additionalPropertyCheck = config.get('config.additionalPropertyCheck');

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
    Position:'Position',
    User:'User',
    ITService:'ITService',
    ITServiceGroup:'ITServiceGroup',
    Switch:'Switch',
    Firewall:'Firewall',
    ProcessFlow:'ProcessFlow',
    IncidentFlow:'IncidentFlow',
    ProcessFlowLegacy:'processFlow',
    ServerRoom:'ServerRoom'
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
    PhysicalServer: [cmdbTypeName.PhysicalServer,cmdbTypeName.AbstractServer,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    Router:[cmdbTypeName.Router,cmdbTypeName.NetworkDevice,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    Camera:[cmdbTypeName.Camera,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    Storage:[cmdbTypeName.Storage,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    IncidentFlow:[cmdbTypeName.IncidentFlow,cmdbTypeName.ProcessFlow],
    Switch:[cmdbTypeName.Switch,cmdbTypeName.NetworkDevice,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem],
    Firewall:[cmdbTypeName.Firewall,cmdbTypeName.NetworkDevice,cmdbTypeName.Hardware,cmdbTypeName.Asset,cmdbTypeName.ConfigurationItem]
}

//ConfigurationItem real types
const cmdbConfigurationItemTypes = [cmdbTypeName.PhysicalServer,cmdbTypeName.Router,cmdbTypeName.VirtualServer,cmdbTypeName.Camera,cmdbTypeName.Storage,cmdbTypeName.Switch,cmdbTypeName.Firewall];

//ConfigurationItem auxiliary types
const cmdbConfigurationItemAuxiliaryTypes = [cmdbTypeName.Cabinet,cmdbTypeName.Position,cmdbTypeName.User,cmdbTypeName.ITServiceGroup,cmdbTypeName.ITService,cmdbTypeName.ServerRoom];

//ConfigurationItem abstract types
const cmdbConfigurationItemAbstractTypes =  [cmdbTypeName.ConfigurationItem,cmdbTypeName.AbstractServer,cmdbTypeName.Asset,cmdbTypeName.Hardware,cmdbTypeName.NetworkDevice];

//Processflow real types
const cmdbProcessFlowTypes = [cmdbTypeName.IncidentFlow];

//Processflow abstract types
const cmdbProcessFlowAbstractTypes = [cmdbTypeName.ProcessFlow];

//cmdb all types
const cmdbTypesAll = [...cmdbConfigurationItemAuxiliaryTypes,...cmdbConfigurationItemAbstractTypes,...cmdbConfigurationItemTypes,...cmdbProcessFlowAbstractTypes,...cmdbProcessFlowTypes]

_.forEach(cmdbTypesAll,function(type){
    ajv.addSchema(require('./'+ type + '.json'));
});

var checkSchema = function (params) {
    if(!params.data||!params.data.category){
        throw new Error("cfgItem does not contain category field!");
    }
    var valid = ajv.validate('/'+params.data.category,params.data.fields);
    if(!valid){
        throw new Error(ajv.errorsText());
    }
    if(additionalPropertyCheck)
        checkAdditionalProperty(params)
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

var getPropertiesFromSchema = function(properties,schema){
    for (let prop in schema) {
        if (prop === 'properties')
            properties = _.assign(properties,schema[prop])
        if (typeof schema[prop] === 'object')
            getPropertiesFromSchema(properties,schema[prop]);
    }
    return properties;
}

var checkAdditionalProperty = function(params){
    let schema = getSchema('/'+params.data.category)
    let properties = {}
    getPropertiesFromSchema(properties,schema)
    for (let key in params.data.fields){
        if(!_.has(properties,key)){
            throw new Error(`additional property:${key}`)
            break
        }
    }
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


module.exports = {checkSchema,getSchema,cmdbConfigurationItemTypes,cmdbConfigurationItemAuxiliaryTypes,cmdbTypeLabels,cmdbTypeName,cmdbConfigurationItemInheritanceRelationship,cmdbProcessFlowTypes,cmdbTypesAll,cmdbProcessFlowAbstractTypes}
