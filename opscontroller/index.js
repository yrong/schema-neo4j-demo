const WebSocket = require('ws')
const Throttle = require('async-throttle')
const throttle = Throttle(5)
const _ = require('lodash')
const cypherInvoker = require('../helper/cypherInvoker')
const logger = require('../logger')
const search = require('../search')
const uuid = require('uuid')
const moment = require('moment')
const apiInvoker = require('../helper/apiInvoker')


class OpsController {

    constructor(socket_io,data,ctx) {
        this.socket_io= socket_io
        this.hosts = data.hosts
        this.script = data.script
        this.script_type = data.script_type
        this.ctx = ctx
    }

    async execute()  {
        let promises = [],hosts = await apiInvoker.getAgents(this.hosts), src_address = this.ctx.socket.socket.handshake.address,
        host_ips = _.map(hosts,(host)=>host.ip_address[0])
        logger.info(`agents:${host_ips.join()},script:${this.script}`)
        host_ips.forEach((host)=>promises.push(throttle(async()=>{
            let ws_url = `ws://${host}:8081`
            const ws = new WebSocket(ws_url);
            let commandId = uuid.v1(),command,IN=1,OUT=-1
            ws.on('open', ()=> {
                logger.info(`ws connection to ${ws_url} built`)
                ws.send(this.script);
                command = {cid:commandId,ts:moment().unix(),dir:IN,
                    script:this.script,agent_ip:host,remote_ip:src_address,
                }
                search.addOpsCommand(command)
            });
            ws.on('message', (data)=> {
                if(data&&data.length){
                    logger.info('recv message from ws connection:' + data)
                    if(this.socket_io)
                        this.socket_io.socket.emit('executeScriptResponse',data)
                    command = {cid:commandId,ts:moment().unix(),dir:OUT,
                        response:data,agent_ip:host,remote_ip:src_address,
                    }
                    search.addOpsCommand(command)
                }
            });
            ws.on('close',()=>{
                logger.info(`ws connection to ${ws_url} closed`)
            })
            ws.on('error',(error)=>{
                logger.error('ws connection error happened:' + String(error))
                if(this.socket_io)
                    this.socket_io.socket.emit('executeScriptError',String(error))
            })
        })))
        await Promise.all(promises)
    }
}

module.exports = OpsController