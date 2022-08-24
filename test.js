const got = require('got')

// got.get('https://qr.m.jd.com/show', {
// 	searchParams: {
// 		t: 212,
// 		k: 212
// 	},
// 	// cookieJar: {
// 	// 	a: 222
// 	// }
// }).then((response) => {
// 	console.log(response)
// 	// console.log(response.headers['set-cookie'])
// })
let price
const callback = {}
const a = `jQuery9487874({
   "code" : 200,
   "ticket" : "AAEAMKehHej6uBXf_C5Gbt2L_uYyriChQjM94IYuxk4nP7KQLtsByTgHovwmdMOB-rqF7A"
})`

callback['jQuery9487874'] = (data) => {
	price = data
}

eval('callback.' + a)
console.log(price)
