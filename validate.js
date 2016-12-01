var cfgItemChecker = {};

cfgItemChecker['VirtualServer'] = function(params) {
    return true;
}

cfgItemChecker['Router'] = function(params) {
    return true;
}

var checkCfgItem = function (params) {
    if(!params.data||!params.data.category){
        throw new Error("cfgItem does not contain category field!");
    }
    var check_func = cfgItemChecker[params.data.category];
    if(check_func){
        check_func(params);
    }
    return true;
};

module.exports.checkCfgItem = checkCfgItem;