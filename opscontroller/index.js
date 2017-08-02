const WebSocket = require('ws')
const Throttle = require('async-throttle')
const throttle = Throttle(5)
const _ = require('lodash')
const cypherInvoker = require('../helper/cypherInvoker')
const logger = require('log4js_wrapper').getLogger()
const search = require('../search')
const uuid = require('uuid')
const moment = require('moment')
const apiInvoker = require('../helper/apiInvoker')

const IN=0,OUT=1,ERROR=2

class OpsController {

    constructor(socket_io,data,ctx) {
        this.socket_io= socket_io
        this.hosts = data.hosts
        this.script = data.script
        this.script_type = data.script_type
        this.cutomized_cmd = data.cutomized_cmd
        this.ctx = ctx
    }

    async execute()  {
        let promises = [],hosts = await apiInvoker.getAgents(this.hosts), src_address = this.ctx.socket.socket.handshake.address,
        host_ips = _.map(hosts,(host)=>host.ip_address[0])
        if(!host_ips.length){
            if(this.socket_io)
                this.socket_io.socket.emit('executeScriptError',`hosts ${this.hosts} not found in cmdb`)
            return
        }
        if(this.cutomized_cmd === 'local-ping'){
            this.script = `ping -w 3 ${host_ips[0]}`
            host_ips = ['localhost']
        }
        logger.info(`agents:${host_ips.join()},script:${this.script}`)
        host_ips.forEach((host)=>promises.push(throttle(async()=>{
            let ws_url = `ws://${host}:8081`,command
            const ws = new WebSocket(ws_url)
            ws.on('open', ()=> {
                logger.info(`ws connection to ${ws_url} built`)
                ws.send(this.script);
                command = {script:this.script,ts:moment().unix(),dir:IN,
                    agent_ip:host,remote_ip:src_address,
                }
                search.addOpsCommand(command)
            });
            ws.on('message', (data)=> {
                if(data&&data.length){
                    logger.info('recv message from ws connection:' + data)
                    let data_json = JSON.parse(data)
                    command = {script:this.script,pid:data_json.pid,ts:moment().unix(),dir:data_json.type,
                        response:data_json.message,agent_ip:host,remote_ip:src_address,
                    }
                    if(this.socket_io){
                        this.socket_io.socket.emit('executeScriptResponse',command)
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