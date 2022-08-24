const got = require('got')
const { random, cookieParse } = require('./uilt')

class Goods {
	constructor() {
		this.userData = require('./userData.json')
		this.area = '1_72_55668'
	}

	async start() {
		const res = await this.getUserCartInfo(userData)
		console.log(res)
	}

	async getGoodsDelite(goodId) {
		const [price, status, title] = await Promise.all([this.goodPrice(goodId), this.goodStatus(goodId), this.goodTitle(goodId)])
		console.log({ price, status, title })
	}

	// 获取商品价格
	async goodPrice(stockId) {
		const callback = {}
		let name
		let price
		callback[(name = 'jQuery' + random(100000, 999999))] = (data) => {
			price = data
		}
		const result = await got({
			method: 'GET',
			url: 'http://p.3.cn/prices/mgets',
			searchParams: {
				type: 1,
				pduid: new Date().getTime(),
				skuIds: 'J_' + stockId,
				callback: name
			}
		})
		eval('callback.' + result.body)
		return price[0]
	}

	// 商品状态
	async goodStatus(goodId, area_Id = '1-72-55668') {
		const areaId = area_Id.replaceAll('-', '_')
		const result = await got
			.get('http://c0.3.cn/stocks', {
				header: {
					...userData.headers,
					Cookie: userData.cookieData,
					'Content-Type': 'text/plain;charset=GBK'
				},
				searchParams: {
					type: 'getstocks',
					area: areaId,
					skuIds: goodId
				}
			})
			.json()

		return { ...result[goodId], canBuy: result[goodId].StockState === 33 ? true : false }
	}

	// 商品名称
	async goodTitle(goodId) {
		const result = await got
			.get('https://yx.3.cn/service/info.action', {
				header: {
					...userData.headers,
					Cookie: userData.cookieData,
					'Content-Type': 'text/plain;charset=GBK'
				},
				searchParams: {
					u_sourc: 'weidian',
					ids: goodId
				}
			})
			.json()

		return result[goodId]
	}

	//
	async getUserCartInfo() {
		const result = await got
			.post('https://api.m.jd.com/api', {
				headers: {
					...this.userData.headers,
					origin: 'https://cart.jd.com',
					referer: 'https://cart.jd.com/',
					cookie: this.userData.cookieData
				},
				searchParams: {
					functionId: 'pcCart_jc_getCurrentCart',
					appid: 'JDC_mall_cart',
					loginType: '3',
					body: JSON.stringify({ serInfo: { area: this.area, 'user-key': null }, cartExt: { specialId: 1 } })
				}
			})
			.json()
		console.log(result.resultData)
		// return this.getGoodInfo(result.data.resultData, user)
	}
}

const a = new Goods()

a.getUserCartInfo()
