<template>
	<view>
		<!-- #ifdef APP-PLUS -->
		<App />
		<!-- #endif -->
	</view>
</template>

<script>
	import App from '../app/app.vue'
	import {
		clear
	} from '../../index.js'
	export default {
		components: {
			App
		},

		// vue3
		beforeUnmount() {
			clear()
		},
		// vue2
		beforeDestroy() {
			clear()
		},
	}
</script>

<style>
</style>