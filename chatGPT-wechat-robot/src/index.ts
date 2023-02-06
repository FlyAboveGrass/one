import { ChatGPTAPI } from 'chatgpt'
import { WechatyBuilder } from 'wechaty'

async function createChatGPTInstance() {
	const api = new ChatGPTAPI({
		apiKey: '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', // todo: 可输入
		debug: true
	})

	const res = await api.sendMessage('Hello World!')
	const conversationParams = {
		conversationId: res.conversationId,
		parentMessageId:res.parentMessageId
	}

	return {
		sendMessage: async (text) => await api.sendMessage(text, conversationParams)
	}
}

let wechaty;
async function startWechatBot() {
	const { sendMessage } = await createChatGPTInstance()
	try {
		wechaty = WechatyBuilder.build({
			name: 'WechatEveryDay',
			puppet: 'wechaty-puppet-wechat', // 如果有token，记得更换对应的puppet
			puppetOptions: {
				uos: true,
			},
		}) // get a Wechaty instance
	
		
	
		wechaty
			.on('scan', (qrcode, status) => console.log(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`))
			.on('login',            user => console.log(`User ${user} logged in`))
			.on('message', onMessage.bind(this))
	
		wechaty
			.start()
			.then(() => console.log('Start to log in wechat...'))
			.catch((e) => console.error(e));
	} catch(e) {
		console.log("🚀 ~ file: index.ts:42 ~ startWechatBot ~ e", e)
	}
	

	async function onMessage(msg) {
		const msgStr = msg.toString()
		console.info(msgStr)

		if (msg.room()) {
			console.info('Message is discarded because it is  From Room')
			return
		}

		if (msg.age() > 2 * 60) {
			console.info(`Message discarded because its TOO OLD(${msg.age()} than 2 minutes)`)
			return
		}

		if (msg.type() !== 7) {
			console.info('Message discarded because it does not match ding/ping/bing/code')
			await msg.say('暂时只支持文字形式')
			return
		}

		/**
		 * 1. reply 'dong'
		 */
		console.log("🚀 ~ file: index.ts:35 ~ onMessage ~ msg", msg)
		const contact = msg.talker();
		const receiver = msg.to();
		const alias = (await contact.alias()) || (await contact.name());
		console.log("🚀 ~ file: index.ts:82 ~ onMessage ~ alias", alias, receiver, /^问[:：]/.test(msgStr))

		if (msg.self() && !/^问[:：]/.test(msgStr)) {
			console.info('Message discarded because it is from myself')
			return
		}
	
		const res = await sendMessage(msgStr)
		console.log("🚀 ~ file: index.ts:49 ~ onMessage ~ res", res)
		await msg.say(res.text)
	}
}

startWechatBot()
