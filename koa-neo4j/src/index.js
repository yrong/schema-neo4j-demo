// Start using koa2 as normal

import Application from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from 'kcors';
import queryString from 'query-string';
import {Authentication} from './auth';
import {Neo4jConnection, createProcedure, API} from './data';
import {haveIntersection} from './util';

const defaultOptions = {
    apis: [],
    log: true,
    neo4j: {
        boltUrl: 'bolt://localhost',
        user: 'neo4j',
        password: 'neo4j'
    }
};

const logger = require('../../logger')

class KoaNeo4jApp extends Application {
    constructor(options) {
        super();
        options = {...defaultOptions, ...options};

        this.router = new Router({sensitive:true});
        this.configuredAuthentication = false;

        this.methods = {
            'GET': this.router.get,
            'POST': this.router.post,
            'PUT': this.router.put,
            'DEL': this.router.del,
            'PATCH':this.router.patch
        };

        this.neo4jConnection = new Neo4jConnection(options.neo4j);
        this.neo4jInitialized = this.neo4jConnection.initialized;


        if (options.authentication)
            this.configureAuthentication(options.authentication);

        this
            .use(cors(options.cors))
            .use(async (ctx, next) => {
                try {
                    var start = new Date()
                    await next();
                    const status = ctx.status || 404
                    if (status === 404) {
                        ctx.throw(404)
                    }
                    var ms = new Date() - start
                    if (options.log)
                        logger.info('%s %s - %s ms', ctx.method,ctx.originalUrl, ms)
                } catch (error) {
                    //wrap cmdb error message
                    let cmdb_error = {
                        "status":"error", //ok, info, warning, error,
                        "message":{
                            "content": String(error),
                            "displayAs":"modal"
                        }
                    };
                    ctx.body = JSON.stringify(cmdb_error);
                    logger.error('%s %s - %s', ctx.method,ctx.originalUrl, String(error))
                    ctx.status = error.status||500;
                }
            })
            .use(bodyParser({
                onerror(error, ctx) {
                    ctx.throw(`cannot parse request body, ${JSON.stringify(error)}`, 400);
                }
            }))
            .use(this.router.routes());

        this.executeCypher = this.neo4jConnection.executeCypher;

        for (const api of options.apis)
            this.defineAPI(api);

    }

    defineAPI(options) {
        const api = new API(this.neo4jConnection, options);
        const handler = async(ctx, next) => {
            if (api.requiresJwtAuthentication)
                try {
                    await this.authentication.authenticateJwt(ctx, next);
                } catch (error) {
                    // No Authorization header
                    ctx.throw('authorization required', 401);
                }

            if (api.requiresJwtAuthentication &&
                !haveIntersection(ctx.user.roles, api.allowedRoles))
                ctx.throw('user does not have permission for this resource', 403);

            let params = {};
            if (ctx.url.indexOf('?') >= 0) {
                params = `?${ctx.url.split('?')[1]}`;
                params = queryString.parse(params);
            }
            params = {...params, ...ctx.params, ...ctx.request.body};
            params.method = api.method;
            params.url = ctx.req.url;
            try {
                ctx.body = await api.invoke(params, ctx);
            } catch (error) {
                console.log(error)
                ctx.throw(error.message || error, 409);
            }
            await next();
        };
        this.methods[api.method].apply(this.router, [api.route, handler]);
        return api;
    }

    configureAuthentication(options) {
        if (this.configuredAuthentication)
            throw new Error('authentication already configured');
        this.authentication = new Authentication(this.neo4jConnection, options);
        this.use(this.authentication.passport.initialize());
        this.router.post(options.route, this.authentication.authenticateLocal);
        this.configuredAuthentication = true;
    }

    createProcedure(options) {
        return createProcedure(this.neo4jConnection, options);
    }
}

export default KoaNeo4jApp;
