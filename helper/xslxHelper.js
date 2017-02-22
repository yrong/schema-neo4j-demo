var XLSX = require('xlsx')
var config = require('config')
var fs = require('file-system')
var path = require('path')
var moment = require('moment')

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
    generateLineInErrorSheet:(src_sheet, src_line, error_sheet, error_line, error)=>{
        let src_cell,dst_cell
        for(var col=0;col<=src_sheet.data_range.e.c;col++){
            src_cell = XLSX.utils.encode_cell({c:col,r:src_line})
            dst_cell = XLSX.utils.encode_cell({c:col,r:error_line})
            error_sheet[dst_cell] = src_sheet[src_cell]
        }
        dst_cell = XLSX.utils.encode_cell({c:col,r:error_line})
        error_sheet[dst_cell]={v:error}
        return error_sheet
    },
    writeErrorBook:(src_sheet,error_sheet,error_sheet_name,errors)=>{
        let errorbook = {SheetNames:[error_sheet_name],Sheets:{}}
        errorbook.Sheets[error_sheet_name]=error_sheet
        let importFileBaseDir = config.get('config.import.storeDir')
        let exceptionFileBaseDir = path.join(importFileBaseDir,'exception')
        let range =  {s: {c:0, r:0}, e: {c:src_sheet.data_range.e.c+1, r:errors+src_sheet.data_range.s.r-1}}
        error_sheet['!ref'] = XLSX.utils.encode_range(range)
        fs.mkdirSync(exceptionFileBaseDir)
        XLSX.writeFile(errorbook, exceptionFileBaseDir + path.sep + (new Date).getTime() + '.xlsx')
    },
    generateHeaderInErrorSheet:(src_sheet,error_sheet)=>{
        let src_cell,dst_cell
        for(var line=0;line<src_sheet.data_range.s.r;line++){
            for(var col=0;col<=src_sheet.data_range.e.c;col++){
                src_cell = XLSX.utils.encode_cell({c:col,r:line})
                dst_cell = XLSX.utils.encode_cell({c:col,r:line})
                error_sheet[dst_cell] = src_sheet[src_cell]
            }
            dst_cell = XLSX.utils.encode_cell({c:col,r:line})
            error_sheet[dst_cell]={v:undefined}
        }
        return error_sheet
    },
    data_parser: {
        toBoolean: (val) => {
            if (val && (val.v === 'Yes' || val.v === 'yes' || val.v === '1'))
                return true
            else if (val && (val.v === 'No' || val.v === 'no' || val.v === '0'))
                return false
            else
                return null
        },
        toInteger: (val) => {
            return val ? parseInt(val.v) : null
        },
        toDate: (val) => {
            return val ? moment(val.w, 'YYYY-M-D').format('YYYY-MM-DD') : null
        },
        toArray: (val) => {
            return val ? val.v.split(',') : null
        },
        toString: (val) => {
            return val ? val.v : null
        }
    }
}