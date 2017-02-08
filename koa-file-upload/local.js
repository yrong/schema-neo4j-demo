const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")

module.exports = (options) => {
    if (!(options.folder)) {
        throw new Error("Missing option in options: [folder]")
    }

    if (!options.urlPath) {
        options.urlPath = options.folder
    }

    return {
        store: (fileId, file) => {
            return new Promise((resolve, reject) => {
                const filepath = path.join(process.cwd(), options.folder, options.storeDir, fileId)
                mkdirp.sync(path.dirname(filepath))
                const stream = fs.createWriteStream(filepath)
                file.pipe(stream)
                file.on("end", () => { return resolve(fileId) })
            })
        },
        get: (fileId) => {
            const filepath = path.join(process.cwd(), options.folder, options.storeDir, fileId)
            return fs.readFileSync(filepath, 'utf8');
        }
    }
}