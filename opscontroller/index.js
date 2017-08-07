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
        let promises = [],hosts = await apiInvoker.getAgents(this.hosts), src_address = this.ctx.socket.socket.handshake.address,script_tasks = []
        if(hosts&&hosts.length){
            _.each(hosts,(host)=>{
                if(host.ip_address&&host.ip_address.length)
                    script_tasks.push({ip:host.ip_address[0],script:this.script})
                else{
                    if(this.socket_io)
                        this.socket_io.socket.emit('executeScriptError',`${host.name} found in cmdb invalid without ip address`)
                }
            })
        }else{
            if(this.socket_io)
                this.socket_io.socket.emit('executeScriptError',`hosts ${this.hosts} not found in cmdb`)
            return
        }
        if(!script_tasks.length){
            if(this.socket_io)
                this.socket_io.socket.emit('executeScriptError',`no script task need to be executed`)
            return
        }
        if(this.cutomized_cmd === 'local-ping'){
            script_tasks = _.map(script_tasks,(task)=>{
                task.script = `ping -c 3 -W 1 ${task.ip}`
                task.ip = 'localhost'
                return task
            })
        }
        script_tasks.forEach((task)=>promises.push(throttle(async()=>{
            let agent_ip=task.ip,ws_url = `ws://${agent_ip}:8081`,command
            const ws = new WebSocket(ws_url)
            ws.on('open', ()=> {
                logger.info(`ws connection to ${ws_url} built`)
                ws.send(task.script);
                command = {script:task.script,ts:moment().unix(),dir:IN,
                    agent_ip,remote_ip:src_address,
                }
                search.addOpsCommand(command)
            });
            ws.on('message', (data)=> {
                if(data&&data.length){
                    logger.info('recv message from ws connection:' + data)
                    let data_json = JSON.parse(data)
                    command = {script:task.script,pid:data_json.pid,ts:moment().unix(),dir:data_json.type,
                        response:data_json.message,agent_ip,remote_ip:src_address,
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