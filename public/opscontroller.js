'use strict'

var opscontrollerSocket = io( '/opscontroller' )
var opscontrollerBtn = $('.js-executeScriptBtn')

var normalizeScript = (script,script_type)=>{
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
    var splitter = script_type==='vbs'?' : ':' ; '
    return arr.join(splitter);
}

opscontrollerBtn.click(function(event){
    $.notifyDefaults({
        delay: 3000,
        placement: {
            from: "bottom",
            align: "left"
        },
        allow_dismiss: false
    });
    $.notify('start execute script,waiting...')
    var script = $('#script_txt').val()
    var script_type = $("#script_type_sel").val()
    script = normalizeScript(script,script_type)
    var data = {script,script_type}
    if($('#hostlist').val())
        data.hosts = $('#hostlist').val().split(',')
    opscontrollerSocket.emit( 'executeScript', data)
})
opscontrollerSocket.on( 'executeScriptResponse', function( event ) {
    var settings = {
        icon: 'fa fa-paw',
        type: 'success'
    }
    if(event.dir === 1){
        $.notify({message:event.response},settings);
    }else if(event.dir === 2){
        $.notify({message:event.response},{type:'danger',allow_dismiss: true,delay:0});
    }

})
importerSocket.on( 'executeScriptError', function( event ) {
    $.notify({message:event},{type:'danger',allow_dismiss: true,delay:0});
})


$("#script_type_sel").change(function() {
    var script_type = $("#script_type_sel").val()
    if(script_type === 'vbs'){
        $('#script_txt').text(`for i = 1 to 5
            WScript.echo i
            WScript.sleep 200
        next`
        )
    }else if(script_type === 'shell'){
        $('#script_txt').text(`for ((i = 1; i <= 5; i++))
        do echo $i
          sleep 0.5
        done`
        )
    }
});