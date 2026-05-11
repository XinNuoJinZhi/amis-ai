// 简单的发布-订阅实现，用于与app事件通信

export const emitter = {
	events: {},
	on: function(eventName, callback) {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}
		this.events[eventName].push(callback);
	},
	emit: async function(eventName, data) {
		if (this.events[eventName]) {
			let result = null
			for (const callback of this.events[eventName]) {
				result = callback(data);
			}
			return result
		}
	},
	off: function(eventName, callback) {
		if (this.events[eventName]) {
			this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
		}
	},
}