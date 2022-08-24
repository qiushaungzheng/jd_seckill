import JDLogin from './block/login'

class JDClient {

	constructor(roomID) {
		this.roomID = roomID
    }
    
	async start() {
		const jdLoginClient = new JDLogin()
		const cookies = await jdLoginClient.login()	
	}



}


const client = new JDClient()
client.start()
