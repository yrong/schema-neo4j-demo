const QRCode = require('qrcode')

QRCode.toFile('../public/upload/ConfigurationItem/a.png', 'Some text', {
    color: {
        dark: '#00F',  // Blue dots
        light: '#0000' // Transparent background
    }
}, function (err) {
    if (err) throw err
    console.log('done')
})
