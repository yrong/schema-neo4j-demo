var XLSX = require('xlsx')
var config = require('config')
var fs = require('file-system')
var path = require('path')

const getSheetRange = (sheet)=>{
    return XLSX.utils.decode_range(sheet['!ref'])
}

module.exports = {
    initSheet:(file_name, sheet_name)=>{
        let importFileBaseDir = config.get('config.import.storeDir')
        let workbook = XLSX.readFile(path.join(importFileBaseDir,file_name))
        return workbook.Sheets[sheet_name]
    },
    getSheetRange:getSheetRange,
    getRawValue:(sheet,col,line)=>{
        let cell = XLSX.utils.encode_cell({c:col,r:line})
        return sheet[cell]
    },
    generateErrorSheet:(src_sheet,src_line,error_sheet,error_line,error)=>{
        let src_cell,dst_cell,range = getSheetRange(src_sheet)
        for(var i=0;i<=range.e.c;i++){
            src_cell = XLSX.utils.encode_cell({c:i,r:src_line})
            dst_cell = XLSX.utils.encode_cell({c:i,r:error_line})
            error_sheet[dst_cell] = src_sheet[src_cell]
        }
        dst_cell = XLSX.utils.encode_cell({c:i,r:error_line})
        error_sheet[dst_cell]={v:error}
        return error_sheet
    },
    writeErrorBook:(src_sheet,error_sheet,error_sheet_name,errors)=>{
        let errorbook = {SheetNames:[error_sheet_name],Sheets:{}}
        errorbook.Sheets[error_sheet_name]=error_sheet
        let importFileBaseDir = config.get('config.import.storeDir')
        let exceptionFileBaseDir = path.join(importFileBaseDir,'exception')
        let range =  {s: {c:0, r:0}, e: {c:getSheetRange(src_sheet).e.c+1, r:errors }}
        error_sheet['!ref'] = XLSX.utils.encode_range(range)
        fs.mkdirSync(exceptionFileBaseDir)
        XLSX.writeFile(errorbook, exceptionFileBaseDir + path.sep + (new Date).getTime() + '.xlsx')
    }
}