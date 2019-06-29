const compose = require('koa-compose')
const search = require('scirichon-search')
const route = require('scirichon-crud-handler').route

module.exports = {
    load: (app)=>{
        route(app)
        app.defineAPI({
            method: 'POST',
            route: '/api/search/cfgItems',
            procedure: search.searchItem
        })

        app.use(compose(
            [
                app.router.routes(),
                app.router.allowedMethods()
            ]))
    }
}
