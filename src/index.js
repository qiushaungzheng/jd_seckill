
const clientLogin = require('./block/login')
const Goods = require('./block/Goods')
class JDClient {

	constructor(roomID) {
		this.roomID = roomID
    }
    
	async start() {
		const { userData } = await clientLogin.getUserInfo()
		const clintGoods = new Goods(userData)
		
	}



}


const client = new JDClient()
client.start()
