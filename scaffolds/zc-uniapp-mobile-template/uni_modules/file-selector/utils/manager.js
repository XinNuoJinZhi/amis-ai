import {
	getId
} from './uuid.js'

// 文件管理器



class Manager {
	constructor() {
		if (!uni.getSystemInfoSync) {
			const isIOSDevice = () => {
				return /iPad|iPhone|iPod|Mac/.test(navigator.userAgent) && !window.MSStream
			}
			//render.js 无法使用uni api
			this.env = 'app'
			this.isIos = isIOSDevice()
		} else {
			const systemInfo = uni.getSystemInfoSync();
			const env = systemInfo.uniPlatform || 'app';
			this.env = env // h5(web) or mp-weixin or app
		}

		this.files = new Map()
		this.inputEl = null // h5或app使用
		this.xhrList = [] // 用来取消请求的
		this.cancelList = []
	}
	normalizeFiles(files) {
		const result = [...files].map(file => {
			const id = getId()
			this.files.set(id, file)
			return {
				id,
				name: file.name,
				size: file.size,
				ext: file.name.split('.').pop(),
			}
		})
		return result
	}

	async chooseFile(options = {}) {
		this.clear()
		if (['web', 'h5', 'app'].includes(this.env)) {
			return new Promise((resolve, reject) => {
				const accept = options.accept || '*/*'
				const multiple = options.multiple || false
				const input = this.inputEl = document.createElement('input')
				input.type = 'file'
				// 设置文件类型为图像类型
				input.accept = accept
				input.multiple = multiple
				// 将 input 元素移出屏幕
				input.style.position = 'absolute'
				input.style.left = '-9999px'


				// 为了取消事件，默认赋予一个文件,如果用户未选择文件会将files置空,从而触发change
				// 此方法在小米15中浏览器或app都生效，在雷电模拟器中不生效
				// ios8及以下没有File
				
	
				try {
					const file = new File(["Hello, World!"], "example.txt", {
						type: "text/plain"
					});
					const dt = new DataTransfer();
					dt.items.add(file);
					input.files = dt.files;
				} catch (error) {
					// 有些设置不支持new DataTransfer
					console.log(error)
				}
			
				document.body.appendChild(input)
				input.click()


				// 监听选择文件事件
				const onChange = (event) => {
					const files = event.target.files
					input.remove()
					resolve(this.normalizeFiles(files))
					
				}
				this.cancelList.push(() => {
					input.removeEventListener('change', onChange)
				})
				input.addEventListener('change', onChange)
			})
		}

		if (['mp-weixin'].includes(this.env)) {
			return new Promise((resolve, reject) => {
				const multiple = options.multiple || false
				const accept = options.accept || ''
				if (!options.count) {
					options.count = multiple ? 999 : 1
				}
				// type!=‘all’时，extension才生效
				if (accept) {
					options.extension = accept.split(',')
				}
				uni.chooseMessageFile({
					...options,
					success: (result) => {
						const files = result?.tempFiles || []
						resolve(this.normalizeFiles(files))
					},
					fail: (err) => {
						if (err.errMsg != "chooseMessageFile:fail cancel") {
							reject(err)
							return
						}
						resolve([])
					}
				})
			})
		}
	}

	async uploadFile(options = {}) {
		const fileId = options.file.id

		// h5或app
		if (['web', 'h5', 'app'].includes(this.env)) {
			options.file = this.files.get(fileId)
			// 修改为xhr上传
			return new Promise(async (resolve, reject) => {
				const name = options.name || 'file';
				const url = options.url;
				const xhr = new XMLHttpRequest()

				xhr.upload.onprogress = function(e) {
					options?.onprogress && options.onprogress({
						loaded: e.loaded,
						total: e.total,
						progress: Math.floor((e.loaded / e.total) * 100),
						id: fileId
					})
				};
				xhr.onload = function() {
					const result = {
						data: null
					}
					try {
						result.data = JSON.parse(xhr.response)
					} catch (error) {
						//TODO handle the exception
						console.log('JSON.parse error:', error)
					}

					if (xhr.status !== 200) {
						reject({
							statusCode: xhr.status,
							msg: xhr.statusText,
							data: result.data
						})
						return
					}
					resolve(result.data)
				}
				xhr.open('POST', url, true)
				const headers = options.headers || {}
				for (const key in headers) {
					xhr.setRequestHeader(key, headers[key])
				}
				const formData = new FormData();
				formData.append(name, options.file)

				xhr.send(formData)
				this.xhrList.push({
					id: fileId,
					abort: xhr.abort.bind(xhr)
				})
			})

		}
		// 微信
		if (['mp-weixin'].includes(this.env)) {
			options.header = options.headers
			options.filePath = this.files.get(fileId)?.path

			return new Promise((resolve, reject) => {
				const task = uni.uploadFile({
					...options,
					success(result) {
						try {
							// uni.uploadFile Api返回的数据是字符串，尝试解析一下
							result.data = JSON.parse(result.data)
						} catch (error) {
							//TODO handle the exception
							console.log('JSON.parse error:', error)
						}
						if (result.statusCode !== 200) {
							reject({
								...result,
								msg: result.errMsg
							})
							return
						}
						resolve(result.data)
					},
					fail(err) {
						console.log('mp eror', err)
						reject(err)
					}
				})
				task.onProgressUpdate(e => {
					options?.onprogress && options.onprogress({
						loaded: e.totalBytesSent,
						total: e.totalBytesExpectedToSend,
						progress: e.progress
					})

				})
				this.xhrList.push({
					id: fileId,
					abort: task.abort.bind(task)
				})
			})
		}


	}
	abort(file) {
		let xhrItem = this.xhrList.find(item => item.id === file?.id)
		if (!xhrItem) {
			xhrItem = this.xhrList.pop()
		} else {
			this.xhrList = this.xhrList.filter(item => item.id !== file?.id)
		}
		xhrItem?.abort && xhrItem.abort()
	}

	// 清理文件和input等
	clear() {
		this.files.clear()
		this.xhrList.length = 0
		this.inputEl && this.inputEl.remove()
		this.cancelList.forEach(fn => fn())
		this.cancelList.length = 0
	}
}

export default new Manager()