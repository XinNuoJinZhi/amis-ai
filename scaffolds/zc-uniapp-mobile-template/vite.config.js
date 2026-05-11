import { loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';
// import viteCompression from 'vite-plugin-compression';
import uniReadPagesV3Plugin from './sheep/router/utils/uni-read-pages-v3';
import mpliveMainfestPlugin from './sheep/libs/mplive-manifest-plugin';


// https://vitejs.dev/config/
export default (command, mode) => {
	const env = loadEnv(mode, __dirname, 'SHOPRO_');
	return {
		envPrefix: "SHOPRO_",
		resolve: {
			alias: {
				'@': path.resolve(__dirname),
				'sheep': path.resolve(__dirname, 'sheep'),
			},
		},
		plugins: [
			uni(),
			// viteCompression({
			// 	verbose: false
			// }),
			uniReadPagesV3Plugin({
				pagesJsonDir: path.resolve(__dirname, './pages.json'),
				includes: ['path', 'aliasPath', 'name', 'meta'],
			}),
			mpliveMainfestPlugin(env.SHOPRO_MPLIVE_ON)
		],
		css: {
		preprocessorOptions: {
			scss: {
				silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
			},
		},
	},
	server: {
			host: true,
			// open: true,
			port: 5200,
			hmr: {
				overlay: true,
			},
		},
	};
};
