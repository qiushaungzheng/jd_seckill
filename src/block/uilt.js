const setCookie = require('set-cookie-parser')

function random(m, n) {
	return Math.ceil(Math.random() * (n - m + 1) + m - 1)
}

function cookieParse(response) {
	const cookiesObj = {}
	setCookie.parse(response).map((it) => {
		cookiesObj[it.name] = it.value
    })
    return cookiesObj
}

module.exports = { random, cookieParse }
