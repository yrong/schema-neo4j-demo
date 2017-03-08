module.exports = {
    isChangeTimelineQuery:(url) => {
        var re = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/timeline/i;
        return re.test(url)
    },
    globalHiddenFields:['fields','cyphers','method','data','token','fields_old','change','url','id','_id','_index','_type','passwd']
}