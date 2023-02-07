import { ChatGPTAPI, SendMessageOptions } from 'chatgpt'
import { WechatyBuilder } from 'wechaty'
import qrcodeTerminal from 'qrcode-terminal'

async function createChatGPTInstance() {
	const api = new ChatGPTAPI({
		apiKey: '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', // todo: 可输入
		debug: true
	})

	let conversationParams: SendMessageOptions = {
		conversationId: undefined,
		parentMessageId: undefined
	}

	return {
		sendMessage: async (content) => {
			const res = await api.sendMessage(content, conversationParams)
			const { conversationId, id, text } = res
			conversationParams = {
				conversationId,
				parentMessageId: id
			}

			return text
		}
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
			.on('scan', onScan)
			.on('login',            user => console.log(`User ${user} logged in`))
			.on('message', onMessage.bind(this))
	
		wechaty
			.start()
			.then(() => console.log('Start to log in wechat...'))
			.catch((e) => console.error(e));
	} catch(e) {
		console.log("🚀 ~ file: index.ts:42 ~ startWechatBot ~ e", e)
	}
	
	function onScan(qrcode, status) {
		console.log("🚀 ~ file: index.ts:49 ~ onScan ~ status, qrcode", status, qrcode)

		if (status === 2) {
			qrcodeTerminal.generate(qrcode, {small: true}, function (code) {
				console.log(code)
			});
		}
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
		console.log("🚀 ~ file: index.ts:82 ~ onMessage ~ alias", alias, receiver)

		if (msg.self()) {
			console.info('Message discarded because it is from myself')
			return
		}
	
		const resText = await sendMessage(msgStr)
		console.log("🚀 ~ file: index.ts:49 ~ onMessage ~ res", resText)
		await msg.say(resText)
	}
}

startWechatBot()
