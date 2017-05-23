var opscontrollerSocket = io( '/opscontroller' )
var opscontrollerBtn = $('.js-executeScriptBtn')
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
    opscontrollerSocket.emit( 'executeScript', {script:$('#script_txt').text()} )
})
opscontrollerSocket.on( 'executeScriptResponse', function( event ) {
    var options = {message:JSON.stringify(event,null,'\t')}
    var settings = {
        icon: 'fa fa-paw',
        type: 'success'
    }
    $.notify(options,settings);
})
importerSocket.on( 'executeScriptError', function( event ) {
    $.notify({message:JSON.stringify(event,null,'\t')},{type:'danger',allow_dismiss: true,delay:0});
})