'use strict'

$("#configurationItem").fileinput({
    uploadUrl: '/api/upload/configurationItem/xslx',
    allowedFileExtensions: ['xlsx'],
    overwriteInitial: false,
    maxFilesNum: 1,
    maxFileCount: 1,
    allowedFileTypes: ['object']
});
var importerBtn = $('.js-importBtn')
$('#configurationItem').on('fileuploaded', function(event, data, previewId, index) {
    var form = data.form, files = data.files, extra = data.extra,
        response = data.response, reader = data.reader;
    var fileId = response[data.filenames[0]]
    $('#uploaded_fileName').text(data.filenames[0])
    $('#uploaded_fileId').text(fileId)
    importerBtn.removeClass('hidden')
});
var importerSocket = io( '/importer' )
importerBtn.click(function(event){
    var fileId = $('#uploaded_fileId').text()
    if(fileId){
        $.notifyDefaults({
            delay: 3000,
            placement: {
                from: "bottom",
                align: "left"
            },
            allow_dismiss: false
        });
        $.notify('start import,waiting...')
        importerSocket.emit( 'importConfigurationItem', {fileId:fileId} )
    }
})
importerSocket.on( 'importConfigurationItemResponse', function( event ) {
    var error_exist = _.some(_.values(event),function(rec) {
        return rec.exception_num>0
    })
    var type = error_exist?'warning':'success'
    var options = {message:JSON.stringify(event,null,'\t')}
    var settings = {
        icon: 'fa fa-paw',
        type: type
    }
    var fileId = $('#uploaded_fileId').text()
    if(error_exist){
        options = _.assign(options,{url:`/upload/ConfigurationItem/exception/${fileId}.xlsx`})
        settings = _.assign(settings,{allow_dismiss: true,delay:0})
    }
    $.notify(options,settings);
})
importerSocket.on( 'importConfigurationItemError', function( event ) {
    $.notify({message:JSON.stringify(event,null,'\t')},{type:'danger',allow_dismiss: true,delay:0});
})
