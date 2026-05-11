<template>
	<view :callParam="callParam" :change:callParam="selector.callSelfMethod">
	</view>
</template>
<script>
	import {
		emitter
	} from '../../utils/emitter.js'

	export default {
		data() {
			this.listeners = {}
			return {
				callParam: {
					// key: 'render.js中的方法名',
					// args: [], // 参数,应该是一个数组
					// isReturn:false //是否接受返回值，默认false
				},
			}
		},
		mounted() {
			emitter.on('call', this.call)
		},
		// Vue3
		beforeUnmount() {
			emitter.off('call', this.call)
		},
		// vue2
		beforeDestroy() {
			emitter.off('call', this.call)
		},
		methods: {
			// 用于调用render.js中的方法的
			async call(callParam) {
				callParam._t = Date.now()
				this.callParam = callParam
				return new Promise((resolve, reject) => {
					if (callParam.isReturn) {
						this.listeners[callParam.key] = {
							resolve,
							reject
						}
					} else {
						resolve()
					}
				})
			},
			// render.js中的返回值
			callback(callParam) {
				const {
					resolve,
					reject
				} = this.listeners[callParam.key]
				if (!callParam.err) {
					resolve && resolve(callParam?.args)
				} else {
					reject && reject(callParam.err)
				}
				delete this.listeners[callParam.key]
				this.callParam = {}
			},
			onprogress(e) {
				emitter.emit('onprogress', e)
			}

		},
	}
</script>
<script module="selector" lang="renderjs">
	import manager from '../../utils/manager.js'
	export default {
		data() {
			this.manager = manager
			return {}
		},
		beforeDestroy() {
			this.clear()
		},

		methods: {
			async callSelfMethod({
				key,
				args = [],
				isReturn = false
			}) {
				if (!key || !args) return
				let result = this[key](...args)
				if (isReturn) {
					if (result instanceof Promise) {
						try {
							result = await result
							this.$ownerInstance.callMethod('callback', {
								key,
								args: result,
							})
						} catch (error) {
							this.$ownerInstance.callMethod('callback', {
								key,
								err: error
							})
						}
						return
					}
					this.$ownerInstance.callMethod('callback', {
						key,
						args: result
					})

				}
			},
			async chooseFile(options = {}) {
				return this.manager.chooseFile(options)
			},
			async uploadFile(options = {}) {
				if (options?.onprogress) {
					options.onprogress = (e) => {
						this.$ownerInstance.callMethod('onprogress', e)
					}
				}
				return this.manager.uploadFile(options)
			},
			abort(file) {
				return this.manager.abort(file)
			},
			clear() {
				return this.manager.clear()
			},

		}
	}
</script>
<style>
</style>