// 入口文件
// #ifdef H5 || MP-WEIXIN
import manager from './utils/manager.js'
export const chooseFile = manager.chooseFile.bind(manager)
export const uploadFile = manager.uploadFile.bind(manager)
export const clear = manager.clear.bind(manager)
export const abort = manager.abort.bind(manager)
// #endif


// #ifdef APP-PLUS
import {
	emitter
} from './utils/emitter.js'
export const chooseFile = async (options = {}) => {
	return emitter.emit('call', {
		key: 'chooseFile',
		isReturn: true,
		args: [options]
	})
}
export const uploadFile = async (options) => {
	const onprogress = options?.onprogress
	if(!!options.onprogress){
		options.onprogress = true
	}
	emitter.on('onprogress', e => {
		if (e.id === options?.file.id) {
			onprogress && onprogress({
				...e,
				progress: Math.floor((e.loaded / e.total) * 100)
			})
		}
	})
	return emitter.emit('call', {
		key: 'uploadFile',
		isReturn: true,
		args: [options]
	})
}
export const clear = () => {
	emitter.emit('call', {
		key: 'clear',
	})
	emitter.events = {}
}

export const abort = (file) => {
	emitter.emit('call', {
		key: 'abort',
		args: [file]
	})
}
// #endif