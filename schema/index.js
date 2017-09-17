const Ajv = require('ajv')
const _ = require('lodash')
const ajv = new Ajv({ useDefaults: true })
const config = require('config')
const fs = require('fs')

let cmdbSchemas={},cmdbDereferencedSchemas = {},cmdbConfigurationItemAuxiliaryTypes=[],cmdbTypeName = {}

const loadSchema = ()=>{
    let schemas = fs.readdirSync("./schema"),schema,sortedAuxiliaryTypes=[],property
    for(let cmdbType of schemas){
        if(cmdbType!='index.js'){
            schema = JSON.parse(fs.readFileSync('./schema/'+ cmdbType, 'utf8'))
            for(let key in schema.properties){
                property = schema.properties[key]
                if(property.type==='array'&&property.items.type==='object'){
                    throw new Error(`array field ${key} in ${cmdbType} can not be object`)
                }
            }
            ajv.addSchema(schema)
            cmdbSchemas[schema.id] = schema
            cmdbTypeName[schema.id] = schema.id
            if(schema.category==='auxiliary'){
                cmdbConfigurationItemAuxiliaryTypes.push(schema.id)
            }
        }
    }
    for(let key in cmdbTypeName){
        schema = dereferenceSchema(key)
        cmdbDereferencedSchemas[schema.id]=schema
    }
    for(let auxiliaryType of cmdbConfigurationItemAuxiliaryTypes){
        let no_referenced = true
        for(let key in cmdbSchemas[auxiliaryType]['properties']){
            let val = cmdbSchemas[auxiliaryType]['properties'][key]
            if(val.schema){
                no_referenced = false
                break
            }
        }
        if(no_referenced)
            sortedAuxiliaryTypes.push(auxiliaryType)
    }
    cmdbConfigurationItemAuxiliaryTypes = _.uniq(_.concat(sortedAuxiliaryTypes,cmdbConfigurationItemAuxiliaryTypes))
}

const getAuxiliaryTypes = ()=>{
    return cmdbConfigurationItemAuxiliaryTypes
}

const _getSchema = function (category) {
    let schema = ajv.getSchema(category)
    return schema.schema
};

const extendSchema = function (schema) {
    if (_.has(schema, "$ref")) {
        schema = _.extend(schema, _getSchema(schema['$ref']));
        schema = _.omit(schema, "$ref");
    }
    if (_.has(schema, "allOf")) {
        schema.allOf = _.map(schema.allOf, function (schema) {
            return extendSchema(schema);
        })
    }
    return schema;
}

const dereferenceSchema = function (category) {
    let schema = _getSchema(category);
    schema = extendSchema(schema);
    return schema;
}

const traverseAllProperties = (schema,properties)=>{
    if(schema.properties){
        _.assign(properties,schema.properties)
    }
    else if(schema.allOf&&schema.allOf.length){
        _.each(schema.allOf,(sub_schema)=>{
            if(sub_schema.properties){
                _.assign(properties,sub_schema.properties)
            }else if(sub_schema.allOf){
                traverseAllProperties(sub_schema,properties)
            }
        })
    }
    return properties
}

const getSchemaProperties = (category)=>{
    let schema = cmdbDereferencedSchemas[category]
    let properties = {}
    traverseAllProperties(schema,properties)
    return properties
}

const traverseParentCategory = (schema,parents)=>{
    if(schema.allOf&&schema.allOf.length){
        _.each(schema.allOf,(sub_schema)=>{
            if(sub_schema.id){
                parents.push(sub_schema.id)
            }
            if(sub_schema.allOf)
                traverseParentCategory(sub_schema,parents)
        })
    }
    return parents
}

const getParentCategories = (category) => {
    let labels = [category]
    let schema = cmdbDereferencedSchemas[category]
    labels = traverseParentCategory(schema,labels)
    return _.uniq(labels)
}

const traverseRefProperties = (properties,prefix='',refProperties)=>{
    _.each(properties,(val,key)=>{
        if(val.schema){
            refProperties.push({attr:prefix?prefix+'.'+key:key,schema:val.schema,type:val.type})
        }else if(val.type==='array'&&val.items.schema){
            refProperties.push({attr:prefix?prefix+'.'+key:key,schema:val.items.schema,type:val.items.type})
        }else if(val.type==='object'&&val.properties){
            traverseRefProperties(val.properties,key,refProperties)
        }
    })
    return refProperties
}

const getSchemaRefProperties = (category)=>{
    let properties = getSchemaProperties(category)
    let referenced_properties = []
    traverseRefProperties(properties,'',referenced_properties)
    return referenced_properties
}

const getSchemaObjectProperties = (category)=>{
    let properties = getSchemaProperties(category),objectFields = []
    _.each(properties,(val,key)=>{
        if(val.type==='object'){
            objectFields.push(key)
        }
    })
    return objectFields
}

const isConfigurationItem = (category) => {
    let labels = getParentCategories(category)
    return labels.includes(cmdbTypeName.ConfigurationItem)||category===cmdbTypeName.ConfigurationItem
}

const isProcessFlow = (category) => {
    let labels = getParentCategories(category)
    return labels.includes(cmdbTypeName.ProcessFlow)||category===cmdbTypeName.ProcessFlow
}

const checkSchema = function (params) {
    if(!params.data||!params.data.category){
        throw new Error("cfgItem does not contain category field!");
    }
    var valid = ajv.validate(params.data.category,params.data.fields);
    if(!valid){
        throw new Error(ajv.errorsText());
    }
    let additionalPropertyCheck = config.get('additionalPropertyCheck');
    if(additionalPropertyCheck)
        checkAdditionalProperty(params)
    return valid;
}

const checkAdditionalProperty = function(params){
    let properties = getSchemaProperties(params.data.category)
    for (let key in params.data.fields){
        if(!_.has(properties,key)){
            throw new Error(`additional property:${key}`)
        }
    }
}

const isAuxiliaryTypes  = (category) => {
    return cmdbConfigurationItemAuxiliaryTypes.includes(category)
}


module.exports = {cmdbTypeName,loadSchema,getSchemaProperties,getSchemaObjectProperties,getSchemaRefProperties,getAuxiliaryTypes,checkSchema,getParentCategories,isConfigurationItem,isProcessFlow,isAuxiliaryTypes}
