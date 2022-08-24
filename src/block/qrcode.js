const Jimp = require('jimp')
const QrCode = require('qrcode-reader')
const fs = require('fs')
const path = require('path')

const buffer = fs.readFileSync(path.resolve('./b.png'))
console.log(path.resolve('./b.png'))
// Jimp.read(path.resolve('./b.png'), function (err, image) {
// 	if (err) {
// 		console.error('Jimp.read', err)
// 		// TODO handle error
// 	}
// 	var qr = new QrCode()
// 	qr.callback = function (err, value) {
// 		if (err) {
// 			console.error(err)
// 			// TODO handle error
// 		}
// 		console.log(value.result)
// 		console.log(value)
// 	}
// 	console.log('image.bitmap', image.bitmap)
// 	qr.decode(image.bitmap)
// })

var qr = new QrCode()
qr.callback = function (err, value) {
	if (err) {
		console.error(err)
		// TODO handle error
	}
	console.log(value.result)
	console.log(value)
}
// console.log('image.bitmap', image.bitmap)
qr.decode('https://qr.m.jd.com/show?appid=133&size=147&t=')
