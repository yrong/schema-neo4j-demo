const search = require('scirichon-search')
const routes = require('scirichon-crud-handler').routes

module.exports = {
    load: (app)=>{
        routes(app)
        app.defineAPI({
            method: 'POST',
            route: '/api/search/cfgItems',
            procedure: search.searchItem
        })
    }
}