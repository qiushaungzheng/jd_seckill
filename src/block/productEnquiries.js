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

	// 获取购物车信息
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
		return this.getGoodInfo(result.resultData)
	}
	// 解析购物车商品信息
	getGoodInfo(resultData) {
		const user = this.userData
		let shopList = []
		let goodInfo = {}

		if (!resultData) {
			console.log('购物车无商品')
			// resultData = {}
			// if (!user.outLogin) {
			// 	let ids = this.getTempMsgUserId(user.unick)
			// 	ids.forEach((e) => {
			// 		this.temp_msg(e, '登陆状态已过期', `京东账号：${user.unick}`, '点击跳转扫码登陆', '', '', true)
			// 	})
			// }
			// user.outLogin = true
		}
		if (resultData.cartInfo) {
			let vendors = resultData.cartInfo.vendors
			vendors.forEach((e) => {
				let shopitem = e.sorted[0].item
				let sType = 1
				let num = shopitem.Num
				let Id = e.shopId
				let items = []
				e.sorted.forEach((o) => {
					let obj = {
						Id: o.item.Id,
						skuUuid: o.item.skuUuid,
						useUuid: o.item.useUuid,
						num: o.item.Num,
						Name: o.item.Name
					}
					items.push(obj)
					goodInfo[o.Id] = obj
				})
				shopList.push({
					sType,
					num,
					Id,
					items: items
				})
			})
		}
		console.log({ shopList, goodInfo })
		return { shopList, goodInfo }
	}

	// 清空购物车
	async removeUserCart(user) {
		let { shopList } = await this.getUserCartInfo(user)
		if (shopList.length == 0) {
			console.log(`${user.unick} 购物车已空${shopList.length}`)
			return true
		}
		console.log('shopList',shopList)

		let url = 'https://api.m.jd.com/api'
		let body = {
			operations: [
				{
					carttype: '4',
					TheSkus: [],
					ThePacks: [
						{
							Id: 106417096782,
							num: 1,
							sType: 13,
							TheSkus: [{ Id: '10025678773125', num: 1, skuUuid: '1194226238944649706634989568', useUuid: false }]
						}
					]
				}
			],
			serInfo: { area: '19_1601_36953_62867' }
		}
		body.serInfo.area = g_data.areaId
		body.operations[0].ThePacks = []
		console.log(body)
		shopList.forEach((e) => {
			let obj = {
				num: e.num,
				sType: e.sType,
				Id: e.Id,
				TheSkus: []
			}
			e.items.forEach((item) => {
				obj.TheSkus.push({
					num: item.num,
					Id: item.Id,
					skuUuid: item.skuUuid,
					useUuid: item.useUuid
				})
			})
			body.operations[0].ThePacks.push(obj)
		})
		// let delParam = [{id:10025522073879,s:false,vs:false},{id:10025678773125,s:false,vs:false},{id:70196142298,s:false,vs:false}]
		let delParam = []
		shopList.forEach((e) => {
			e.items.forEach((item) => {
				delParam.push({
					id: item.Id,
					s: false,
					vs: false
				})
			})
		})
		console.log(delParam)
		const result = await request({
			method: 'post',
			url: url,
			headers: Object.assign(user.header, {
				origin: 'https://cart.jd.com',
				referer: 'https://cart.jd.com/',
				cookie: user.cookieData.join('')
			}),
			params: {
				functionId: 'pcCart_jc_cartRemove',
				appid: 'JDC_mall_cart',
				loginType: '3',
				body: body
			}
		})
		// console.log(result.data)
		// console.log(result.data.resultData)
		// console.log(JSON.stringify(result.data.resultData))
	}
}

const a = new Goods()

a.getUserCartInfo()
