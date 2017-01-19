var XLSX = require('xlsx');
var workbook = XLSX.readFile('资产导入表.xlsx');
var worksheet = workbook.Sheets['物理服务器'];
const NULL = null;
var name,it_service_name,ip_address,hardware_info,technical_support_info,operating_system,storage_info,model;


var toBoolean = (val)=>{
    if(val === 'Yes' || val === 'yes')
        return true
    else
        return false;
}

var i = 4;
do{
    ip_address = worksheet['B' + i]?worksheet['B' + i].v.split():NULL
    operating_system = worksheet['G' + i]?worksheet['G' + i].v:NULL
    hardware_info = worksheet['E' + i]?worksheet['E' + i].v:NULL
    storage_info = worksheet['F' + i]?worksheet['F' + i].v:NULL
    name = worksheet['G' + i]?worksheet['G' + i].v:NULL
    it_service_name = worksheet['H' + i]?worksheet['H' + i].v.split():NULL;
    monitored = worksheet['I' + i]?toBoolean(worksheet['I' + i].v):false;
    i ++
}while (name)
