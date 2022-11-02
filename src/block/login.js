const got = require('got')
// const QRCode = require('qrcode')
const fs = require('fs-extra')
const path = require('path')
const open = require('open')
const util = require('util')
const puppeteer = require('puppeteer')
const moment = require('moment')

const setCookie = require('set-cookie-parser')
const { random, cookieParse } = require('./uilt')
const querystring = require('querystring')

class JDLogin {
	constructor() {}

	async getUserInfo() {
		const isExist = fs.existsSync(path.resolve(__dirname, './userData.json'))
		if (isExist) {
			const userData = fs.readJsonSync(path.resolve(__dirname, './userData.json'))
			const cardInfo = await this.checkCookie(userData)
			if (cardInfo) {
				console.log(`已登录，购物车共计${cardInfo.cartNum}件商品`)
				return { userData }
			} else {
				return await this.start()
			}
		} else {
			return await this.start()
		}
	}

	async checkCookie(userData) {
		const { resultData } = await got
			.post('https://api.m.jd.com/api', {
				headers: {
					...userData.headers,
					origin: 'https://cart.jd.com',
					referer: 'https://cart.jd.com/',
					cookie: userData.cookieData
				},
				searchParams: {
					functionId: 'pcCart_jc_getCurrentCart',
					appid: 'JDC_mall_cart',
					loginType: '3',
					body: JSON.stringify({ serInfo: { area: this.area, 'user-key': null }, cartExt: { specialId: 1 } })
				}
			})
			.json()

		if (resultData?.errInfo?.errCode === 0) {
			return resultData.cartInfo
		} else {
			return false
		}
	}

	async start() {
		// 获取登录二维码
		const QRresponse = await got.get(`https://qr.m.jd.com/show?appid=133&size=147&t=${new Date().getTime()}`, {
			responseType: 'buffer'
		})
		const setCookies = QRresponse.headers['set-cookie']
		fs.writeFile(path.resolve(__dirname, './login.png'), QRresponse.body, 'binary', function (err) {
			console.log('保存图片成功')
		})

		// 打开游览器扫描二维码
		open(path.resolve(__dirname, './templata.html'), 'chrome')
		const cookiesObj = cookieParse(QRresponse)

		let headers = {
			cookie: setCookies,
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
			connection: 'keep-alive'
		}

		// 扫码获取 ticket
		const ticket = await this.checkScan(
			{
				appid: 133,
				token: cookiesObj.wlfstk_smdl
			},
			headers
		)

		// 开始登陆
		const loginInfo = await this.login(ticket, setCookies, headers)
		headers.p3p = loginInfo.p3p

		// 获取实体游览器信息
		const inputs = await this.getBrowerInfo()
		const userData = {
			cookiesObj: loginInfo.cookiesObj,
			cookies: setCookies,
			cookieData: loginInfo.cookieData,
			ticket,
			headers: headers,
			unick: loginInfo.unick,
			loginTime: moment().format('YYYY-MM-DD HH:mm:ss'),
			...inputs
		}

		// 登录信息保存到本地
		fs.outputFileSync(path.resolve(__dirname, 'userData.json'), JSON.stringify(userData, null, '    '))
		console.log('登陆成功')
		return { userData }
	}

	// 检测二维码是否被扫描
	checkScan = async (params, headers) => {
		return new Promise((resolve, reject) => {
			const timer = setInterval(async () => {
				const callName = `jQuery${random(1000000, 9999999)}`
				const callback = {}
				let result
				callback[callName] = (data) => {
					result = data
				}
				const res = await got.get('https://qr.m.jd.com/check', {
					headers: {
						...headers,
						host: 'qr.m.jd.com',
						Referer: 'https://order.jd.com/center/list.action'
					},
					searchParams: {
						callback: callName,
						appid: 133,
						token: params.token,
						_: new Date().getTime()
					}
				})
				eval('callback.' + res.body)
				if (result.code === 200) {
					clearInterval(timer)
					resolve(result.ticket)
				}
			}, 2000)
		})
	}

	// 开始登录
	async login(ticket, cookieData, header) {
		const result = await got({
			method: 'GET',
			url: 'https://passport.jd.com/uc/qrCodeTicketValidation',
			headers: {
				...header,
				Host: 'passport.jd.com',
				Referer: 'https://passport.jd.com/uc/login?ltype=logout',
				Cookie: cookieData
			},
			searchParams: {
				t: ticket,
				ReturnUrl: ''
			}
		})
		console.log(result.body, result.headers)
		let p3p = result.headers['p3p']
		let newcookieData = result.headers['set-cookie']
		let cookies = cookieParse(newcookieData)
		if (!cookies.unick && cookies._pst) {
			cookies.unick = cookies._pst
			console.log('cookies.unick ', `${cookies.unick}`)
		}
		return { p3p, cookieData: newcookieData, unick: cookies.unick, cookiesObj: cookies }
	}

	//提取浏览器需要的信息
	async getBrowerInfo() {
		//使用浏览器打开网页获取必要信息
		let browser = await puppeteer.launch({
			headless: true, //是否不显示浏览器，true ：不显示，false：会显示浏览器（linux服务器必须是true）
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars', '--window-size=1280,960'],
			ignoreDefaultArgs: ['--enable-automation']
		})
		const page = await browser.newPage()
		await page.goto('https://passport.jd.com/new/login.aspx')
		await Promise.all([page.waitForSelector('#eid'), page.waitForSelector('#sessionId')])
		const inputs = await page.evaluate(() => {
			return new Promise((resolve, reject) => {
				const timer = setInterval(() => {
					const eid = document.getElementById('eid').value
					const fp = document.getElementById('sessionId').value
					if (eid && fp) {
						clearInterval(timer)
						resolve({ eid, fp })
					}
				}, 100)
			})
		})
		await browser.close()
		console.log('eid fp 获取完成')
		return inputs
	}
}

module.exports = new JDLogin()
// const client = new JDLogin()
// client.getUserInfo()
// client.getUserInfo()
