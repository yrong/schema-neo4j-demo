const Ajv = require('ajv')
const _ = require('lodash')
const ajv = new Ajv({ useDefaults: true })
const config = require('config')
const Model = require('redis-crud-fork')
const SchemaModel = Model('Schema')

let typeSchemas={},dereferencedSchemas = {},typeRoutes = {},typeInheritanceRelationship={},sortedTypes=[]

const persitSchema = async (schema)=>{
    await SchemaModel.insert(schema)
}

const clearSchema = async ()=>{
    await SchemaModel.deleteAll()
}

const checkSchema = (schema)=>{
    let property,key
    for(key in schema.properties){
        property = schema.properties[key]
        if(property.type==='array'&&property.items.type==='object'){
            throw new Error(`array field ${key} in schema ${schema.id} can not contain object`)
        }
    }
}

const buildInheritanceRelationship = (schema)=>{
    _.each(schema.allOf,(parent)=>{
        if(parent['$ref']){
            typeInheritanceRelationship[parent['$ref']] = typeInheritanceRelationship[parent['$ref']]||{}
            typeInheritanceRelationship[parent['$ref']]['children'] = typeInheritanceRelationship[parent['$ref']]['children']||[]
            typeInheritanceRelationship[parent['$ref']]['children'].push(schema.id)
        }
    })
}

const loadSchema = async (schema, dereference=true, persistance=true)=>{
    checkSchema(schema)
    ajv.removeSchema(schema.id)
    ajv.addSchema(schema)
    if(persistance)
        await persitSchema(schema)
    typeSchemas[schema.id] = schema
    buildInheritanceRelationship(schema)
    if(schema.route){
        typeRoutes[schema.id] = {route:schema.route}
        if(schema.searchable){
            typeRoutes[schema.id].searchable = schema.searchable
        }
    }
    if(dereference)
    {
        schema = dereferenceSchema(schema.id)
        dereferencedSchemas[schema.id]=schema
    }
}

const sortCmdbTypes = ()=>{
    let noRefTypes=[],advancedTypes=[],otherTypes=[]
    for(let category in typeRoutes){
        if(typeRoutes[category].searchable){
            advancedTypes.push(category)
        }
        let no_referenced = true
        for(let key in typeSchemas[category]['properties']){
            let val = typeSchemas[category]['properties'][key]
            if(val.schema){
                no_referenced = false
                break
            }
        }
        if(no_referenced)
            noRefTypes.push(category)
    }
    otherTypes = _.difference(_.keys(typeRoutes), _.concat(noRefTypes,advancedTypes))
    return _.concat(noRefTypes,otherTypes,advancedTypes)
}

const loadSchemas = async ()=>{
    let schemas = await SchemaModel.findAll(),schema
    for(let schema of schemas){
        await loadSchema(schema,false,false)
    }
    for(let key in typeSchemas){
        schema = dereferenceSchema(key)
        dereferencedSchemas[schema.id]=schema
    }
    sortedTypes = sortCmdbTypes()
    return schemas
}

const getSortedTypes = ()=>{
    return sortedTypes
}

const _getSchema = function (category) {
    let schema = ajv.getSchema(category)
    return schema?schema.schema:undefined
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
    let schema = dereferencedSchemas[category]
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
    let schema = dereferencedSchemas[category]
    labels = traverseParentCategory(schema,labels)
    return _.uniq(labels)
}

const traverseRefProperties = (properties,prefix='',refProperties)=>{
    _.each(properties,(val,key)=>{
        if(val.schema){
            refProperties.push({attr:prefix?prefix+'.'+key:key,schema:val.schema,type:val.type,relationship:val.relationship})
        }else if(val.type==='array'&&val.items.schema){
            refProperties.push({attr:prefix?prefix+'.'+key:key,schema:val.items.schema,type:val.type,item_type:val.items.type,relationship:val.items.relationship})
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

const checkObject = function (params) {
    if(!params.data||!params.data.category){
        throw new Error("item does not contain category field!");
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

const isSearchableType  = (category) => {
    return typeRoutes[category].searchable?true:false
}

const getSchemaHierarchy = (category)=>{
    let result = {name:category}
    if(typeInheritanceRelationship[category].children){
        result.children = []
        for(let child of typeInheritanceRelationship[category].children){
            if (typeInheritanceRelationship[child]) {
                result.children.push(getSchemaHierarchy(child))
            }else{
                result.children.push({name:child})
            }
        }
    }
    return result
}

const getApiRoutes = ()=>{
    return typeRoutes
}

const isTypeCrossed = (category1,category2)=>{
    return _.intersection(getParentCategories(category1),getParentCategories(category2)).length>0
}

const getRoute = (category)=>{
    let route,parentCategories = getParentCategories(category)
    if(typeRoutes[category]){
        route = typeRoutes[category].route
    }else{
        for(let parent of parentCategories){
            if(typeRoutes[parent]){
                route = typeRoutes[parent].route
                break
            }
        }
    }
    return route
}

const getMemberType = (category)=>{
    let memberType = typeSchemas[category].member,refProperties,result
    if(memberType){
        refProperties = getSchemaRefProperties(memberType)
        for(let refProperty of refProperties){
            if(refProperty.schema == category){
                result = {member:memberType,attr:refProperty.attr}
                break
            }
        }
    }
    return result
}

const isSubTypeAllowed = (category)=>{
    return _.includes(typeSchemas[category].required,'subtype')
}

const getDynamicSeqField = (category)=>{
    return typeSchemas[category].dynamicSeqField
}

const getAncestorCategory = (category)=>{
    let parentCategories = getParentCategories(category),parentCategory
    for(let parent of parentCategories){
        if(typeRoutes[parent]){
            parentCategory = parent
            break
        }
    }
    return parentCategory
}


module.exports = {checkSchema,loadSchema,persitSchema,clearSchema,loadSchemas,getSchemaProperties,getSchemaObjectProperties,
    getSchemaRefProperties,getSortedTypes,checkObject,getParentCategories,isSearchableType,getSchemaHierarchy,
    getApiRoutes,isTypeCrossed,getRoute,getMemberType,isSubTypeAllowed,getDynamicSeqField,
    getAncestorCategory}
