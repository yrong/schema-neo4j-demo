const uuid = require("node-uuid")
const path = require("path")
const mount = require("koa-mount")
const parse = require("async-busboy")

const fileUpload = (opts) => {

    let store
    try {
        store = require(`./${opts.provider}`)(opts)
    } catch (err) {
        throw new Error(`Error: ${err}`)
    }

    const {mimetypes, exts} = opts

    return async (ctx, next) => {
        // Validate Request
        if ("POST" !== ctx.method && !ctx.request.is("multipart/*")) {
            return await next()
        }

        // Parse request for multipart
        const {files, fields} = await parse(ctx.req)

        // Check if any file is not valid mimetype
        if (mimetypes) {
            const invalidFiles = files.filter(file => {
                return !mimetypes.includes(file.mimeType)
            })

            // Return err if any not valid
            if (invalidFiles.length !== 0) {
                ctx.status = 400
                ctx.body = `Error: Invalid type of files ${invalidFiles.map(file => `${file.filename}[${file.mimeType}]`)}`
                return
            }
        }

        // Check if any file is not valid ext
        if (exts) {
            const invalidFiles = files.filter(file => {
                return !exts.includes(file.filename.substring(file.filename.lastIndexOf('.') + 1))
            })

            // Return err if any not valid
            if (invalidFiles.length !== 0) {
                ctx.status = 400
                ctx.body = `Error: Invalid type of files ${invalidFiles.map(file => file.filename)}`
                return
            }
        }

        // Generate oss path
        let result = {}
        // const storeDir = opts.storeDir ? `${opts.storeDir}/` : ''
        files.forEach(file => {
            result[file.filename] = `${uuid.v1()}`
        })

        // Upload to OSS or folders
        try {
            await Promise.all(files.map(file => { return store.store(result[file.filename], file) }))
        } catch (err) {
            ctx.status = 500
            ctx.body = `Error: ${err}`
            return
        }

        // Return result
        ctx.status = 200
        ctx.res.setHeader("Content-Type", "text/html")
        ctx.body = JSON.stringify(result)
        return
    }
}

module.exports = (options) => {
    if (!options.url) {
        throw new Error('Can not find option url')
    }
    return mount(options.url, fileUpload(options))
}