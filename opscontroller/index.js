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

const normalizeScript = (script)=>{
    var seperator = /\r\n/.exec(script)?'\r\n':'\n'
    var arr = script.split(seperator);
    for (var i=0; i<arr.length; i++) {
        if (arr[i].search(/ _$/) != -1) {
            arr[i] = arr[i].replace(/ _$/, '');
            arr[i] += arr[i+1];
            arr.splice(i+1, 1);
            i--;
            continue;
        }
        arr[i] = arr[i].replace(/^\s+|^\s*(?:'|\brem\b).*$|(?:'|\brem\b)[^(?:\"|_$)].*$|\s+$/gi, '');
    }
    return arr.join(' : ');
}


class OpsController {

    constructor(socket_io,data,ctx) {
        this.socket_io= socket_io
        this.hosts = data.hosts
        this.script = data.script
        this.ctx = ctx
    }

    async execute()  {
        let promises = [],hosts = await apiInvoker.getAgents(this.hosts),normalized_script = normalizeScript(this.script),
            src_address = this.ctx.socket.socket.handshake.address
        logger.info(`agents found:${hosts.length}`)
        hosts.forEach((host)=>promises.push(throttle(async()=>{
            let ws_url = `ws://${host.ip_address[0]}:8081`
            const ws = new WebSocket(ws_url);
            let commandId = uuid.v1(),command,IN=1,OUT=-1
            ws.on('open', ()=> {
                logger.info(`ws connection to ${ws_url} built and normalized script to execute is:
                ${normalized_script}`)
                ws.send(normalized_script);
                command = {cid:commandId,ts:moment().unix(),dir:IN,
                    script:this.script,agent:host.name,agent_ip:host.ip_address[0],remote_ip:src_address,
                }
                search.addOpsCommand(command)
            });
            ws.on('message', (data)=> {
                if(data&&data.length){
                    logger.info('recv message from ws connection:' + data)
                    if(this.socket_io)
                        this.socket_io.socket.emit('executeScriptResponse',data)
                    command = {cid:commandId,ts:moment().unix(),dir:OUT,
                        response:data,agent:host.name,agent_ip:host.ip_address[0],remote_ip:src_address,
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