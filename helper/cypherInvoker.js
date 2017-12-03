const logger = require('log4js_wrapper').getLogger()

const executeCypher = async (ctx,cypher,params)=>{
    logger.debug(`cypher to executed:${JSON.stringify({cypher,params},null,'\t')}`)
    let result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypher,params,true)
    return result
}

module.exports = {executeCypher}