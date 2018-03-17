const search = require('../search')
const common_route = require('./common')

module.exports = (app)=> {

    /*deprecated*/
    app.defineAPI({
        method: 'POST',
        route: '/api/search/cfgItems',
        procedure: search.searchItem
    })

    common_route(app)

}