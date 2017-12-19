const logger = require('log4js_wrapper').getLogger()

const executeCypher = async (ctx,cypher,params)=>{
    let result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypher,params,true)
    logger.debug(`cypher to executed:${JSON.stringify({cypher,params},null,'\t')}`)
    return result
}

module.exports = {executeCypher}