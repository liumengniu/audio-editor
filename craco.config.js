/**
 * @author Kevin
 * @Date: 2024-4-10
 */

const CracoLessPlugin = require("craco-less")
const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")

const {when, whenDev, whenProd} = require("@craco/craco")

module.exports = {
	devServer: {
		port: 4444
	},
	webpack: {
		alias: {
			"@": path.resolve("src"),
			"@statics": path.resolve(__dirname, "src/statics"),
			"@views": path.resolve(__dirname, "src/views"),
			"@comp": path.resolve(__dirname, "src/components"),
			"@services": path.resolve(__dirname, "src/services"),
			"@utils": path.resolve(__dirname, "src/utils"),
			"@redux": path.resolve(__dirname, "src/redux"),
			"@styles": path.resolve(__dirname, "src/styles"),
			"@configs": path.resolve(__dirname, "src/configs")
		},
		publicPath: "/",
		plugins: [
			// 打压缩包
			...whenProd(() => [], [])
		],
		configure: (webpackConfig, {env: webpackEnv, paths}) => {
			webpackConfig.ignoreWarnings = [/Failed to parse source map/]
			webpackConfig.module.rules.push({
				test: /\.(js|mjs|jsx|svg)$/,
				enforce: "pre",
				loader: require.resolve("source-map-loader"),
				resolve: {
					fullySpecified: false
				}
			})
			webpackConfig.resolve.fallback = {
				"path": require.resolve("path-browserify"),
				// "crypto": require.resolve("crypto-browserify"),
				// "stream": require.resolve("stream-browserify"),
				// "assert": require.resolve("assert"),
				// "http": require.resolve("stream-http"),
				// "https": require.resolve("https-browserify"),
				"os": require.resolve("os-browserify"),
				// "url": require.resolve("url"),
				// "buffer": require.resolve("buffer")
			};
			whenProd(() => {
				webpackConfig.optimization.minimize = true
				webpackConfig.optimization.minimizer.map(plugin => {
					/**
					 * 重写压缩配置 TerserPlugin
					 */
					if (plugin instanceof TerserPlugin) {
						Object.assign(plugin.options.minimizer.options.compress, {
							drop_debugger: true, // 删除 debugger
							drop_console: true, // 删除 console
							pure_funcs: ["console.log"]
						})
					}
					
					return plugin
				})
				webpackConfig.optimization.runtimeChunk = "single"
				webpackConfig.optimization.splitChunks = {
					...webpackConfig.optimization.splitChunks,
					chunks: "all",
					minSize: 30000,
					maxAsyncRequests: 30,
					maxInitialRequests: 30,
					cacheGroups: {
						defaultVendors: {
							test: /[\\/]node_modules[\\/]/,
							name: "vendors"
						},
						base: {
							// 基本框架
							chunks: "all",
							test: /(react|react-dom|react-dom-router)/,
							name: "base",
							priority: 100
						},
						commons: {
							chunks: "all",
							// 将两个以上的chunk所共享的模块打包至commons组。
							minChunks: 2,
							name: "commons",
							priority: 110
						}
					}
				}
			})
			return webpackConfig
		}
	},
	babel: {
		plugins: [
			...whenProd(
				() => [
					["import", {libraryName: "antd", style: true}],
					["@babel/plugin-proposal-decorators", {legacy: true}]
				],
				[]
			)
		]
	},
	plugins: [{
		plugin: CracoLessPlugin,
	}],
	eslint: {
		enable: false
	}
}
