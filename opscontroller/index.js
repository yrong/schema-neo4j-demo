const WebSocket = require('ws')
const Throttle = require('async-throttle')
const throttle = Throttle(5)
const _ = require('lodash')
const cypherInvoker = require('../helper/cypherInvoker')
const logger = require('../logger')
const search = require('../search')
const uuid = require('uuid')
const moment = require('moment')

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

const getAgents = async (hosts)=>{
    let hosts_condition = hosts?`AND n.name IN {hosts}`:''
    let cypher = `MATCH (n)
        WHERE n:PhysicalServer OR n:VirtualServer ${hosts_condition}
        RETURN n`
    let results = await cypherInvoker.fromRestful(cypher,{hosts:hosts})
    results = results.results[0].data
    results = _.map(results,(result)=>{
        return result.row[0]
    })
    return results
}

class OpsController {

    constructor(socket_io,data,ctx) {
        this.socket_io= socket_io
        this.hosts = data.hosts
        this.script = data.script
        this.ctx = ctx
    }

    async execute()  {
        let promises = [],hosts = await getAgents(this.hosts),normalized_script = normalizeScript(this.script),
            src_address = this.ctx.socket.socket.handshake.address
        hosts.forEach((host)=>promises.push(throttle(async()=>{
            let ws_url = `ws://${host.ip_address[0]}:8081`
            const ws = new WebSocket(ws_url);
            let commandId = uuid.v1(),command,IN=1,OUT=-1
            ws.on('open', ()=> {
                logger.info(`ws connection from ${src_address}`)
                logger.info(`script after normalized:
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
                logger.info('ws connection closed')
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