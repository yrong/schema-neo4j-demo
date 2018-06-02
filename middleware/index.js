const scirichon_handler = require('scirichon-crud-handler')

module.exports = {
    middleware:()=>{
        return scirichon_handler.middlewares()
    },
    appMiddleware:(app)=>{
    }
}