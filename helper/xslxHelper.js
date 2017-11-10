const XLSX = require('xlsx')
const config = require('config')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')
const importFileBaseDir = config.get('runtime_data.base_dir')+config.get('runtime_data.upload.cmdb-excel.urlPath')

const getSheetRange = (sheet)=>{
    return XLSX.utils.decode_range(sheet['!ref'])
}

const initSheets = (fileName)=>{
    let workbook = XLSX.readFile(path.join(importFileBaseDir,fileName))
    return workbook.Sheets
}

module.exports = {
    initSheet:(file_name, sheet_name)=>{
        let sheets = initSheets(file_name)
        return sheets[sheet_name]
    },
    initSheets,
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
    writeErrorBook:(src_sheet,error_sheet,error_sheet_name,errors,error_book)=>{
        let range =  {s: {c:0, r:0}, e: {c:src_sheet.data_range.e.c+1, r:errors+src_sheet.data_range.s.r-1}}
        error_sheet['!ref'] = XLSX.utils.encode_range(range)
        if(_.isEmpty(error_book)){
            error_book = {SheetNames:[error_sheet_name],Sheets:{}}
            error_book.Sheets[error_sheet_name]=error_sheet
        }else{
            error_book.SheetNames.push(error_sheet_name)
            error_book.Sheets[error_sheet_name]=error_sheet
        }
        return error_book
    },
    dumpErrorBook:(errorbook,fileName)=>{
        let exceptionFileBaseDir = path.join(importFileBaseDir,'exception')
        if (!fs.existsSync(exceptionFileBaseDir))
            fs.mkdirSync(exceptionFileBaseDir)
        XLSX.writeFile(errorbook, path.join(exceptionFileBaseDir,fileName))
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