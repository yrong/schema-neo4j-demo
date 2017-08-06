const cmdb_cache = require('cmdb-cache')

module.exports = Object.assign({
    ConfigurationItem: {route: '/cfgItems'},
    ProcessFlow: {route: '/processFlows'}
}, cmdb_cache.cmdb_auxiliary_type_routes)

