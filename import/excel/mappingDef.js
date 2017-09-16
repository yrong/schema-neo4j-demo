const _ = require('lodash')
const hook = require('./hook')
const schema = require('../../schema/index')

const configurationItemMapping = {
    ip_address: {col: 1, type: 'array', required: true},
    virtual_machine: {col: 2, type: 'boolean'},
    operating_system: {col: 3},
    hardware_info: {col: 4},
    storage_info: {col: 5}
}

const abstractServerMapping = {
    name: {col: 6, required: true},
    it_service: {col: 7, type: 'array', converter: 'ITService'},
    monitored: {col: 8, type: 'boolean', required: true},
    responsibility: {col: 9, converter: 'User'},
    technical_support_info: {col: 10},
    created_date: {col: 11, type: 'date'},
    last_updated_date: {col: 12, type: 'date'},
    updated_by: {col: 13, converter: 'User'}
}

const assetMapping = {
    asset_id: {col: 14},
    sn: {col: 15},
    geo_location: {col: 16},
    asset_location: {col: 17},
    asset_location_cabinet: {col: 18, converter: 'Cabinet'},
    asset_location_u: {col: 19, type: 'integer'},
    asset_location_mounted_date: {col: 20, type: 'date'},
    asset_location_shelf: {col: 21, converter: 'Shelf'},
    model: {col: 22, required: true},
    product_date: {col: 23, type: 'date'},
    warranty_expiration_date: {col: 24, type: 'date'},
    retirement_date: {col: 25, type: 'date'}
}

const physicalServermapping = {
    definition: _.assign({},configurationItemMapping,abstractServerMapping,assetMapping),
    postProcess: [hook.buildAssetLocation, hook.omitProperties],
    range:{s:{r:3},e:{c:25}}
}
module.exports['PhysicalServer'] = physicalServermapping

const virtualServermapping = {
    definition: _.assign({},configurationItemMapping,abstractServerMapping),
    postProcess: [hook.omitProperties],
    range:{s:{r:2},e:{c:13}}
}
module.exports['VirtualServer'] = virtualServermapping
