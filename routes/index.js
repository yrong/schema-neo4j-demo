const search = require('scirichon-search')
const routes = require('scirichon-crud-handler').routes

module.exports = (app)=> {

    /*deprecated*/
    app.defineAPI({
        method: 'POST',
        route: '/api/search/cfgItems',
        procedure: search.searchItem
    })

    routes(app)

}