var XLSX = require('xlsx')
var config = require('config')
var fs = require('file-system')
var path = require('path')
var configurationItemFilePath = process.argv.slice(2)[0]
var workbook = XLSX.readFile(configurationItemFilePath||'./import_data/configurationItem.xlsx')
const physical_sheet_name = '物理服务器'
var physical_server_worksheet = workbook.Sheets[physical_sheet_name]
let range = XLSX.utils.decode_range(physical_server_worksheet['!ref'])
var errorbook = {SheetNames:[physical_sheet_name],Sheets:{}}
var physical_server_errorsheet = {}
errorbook.Sheets[physical_sheet_name]=physical_server_errorsheet
var importFileBaseDir = config.get('config.import.importFileBaseDir')
var exceptionFileBaseDir = importFileBaseDir + path.sep +　'exception'
const START_LINE = 3
module.exports = {
    getRawValue:(col,line)=>{
        let cell = XLSX.utils.encode_cell({c:col,r:line})
        return physical_server_worksheet[cell]
    },
    generateSheetWithError:(src_line,dst_line,error)=>{
        let src_cell,dst_cell
        for(var i=0;i<=range.e.c;i++){
            src_cell = XLSX.utils.encode_cell({c:i,r:src_line})
            dst_cell = XLSX.utils.encode_cell({c:i,r:dst_line})
            physical_server_errorsheet[dst_cell] = physical_server_worksheet[src_cell]
        }
        dst_cell = XLSX.utils.encode_cell({c:i,r:dst_line})
        physical_server_errorsheet[dst_cell]={v:error}
    },
    writeErrorBook:(errors)=>{
        range =  {s: {c:0, r:0}, e: {c:range.e.c+1, r:errors }}
        physical_server_errorsheet['!ref'] = XLSX.utils.encode_range(range)
        fs.mkdirSync(exceptionFileBaseDir)
        XLSX.writeFile(errorbook, exceptionFileBaseDir + path.sep + (new Date).getTime() + '.xlsx')
    },
    range:{s:{c:0,r:START_LINE},e:range.e}
}