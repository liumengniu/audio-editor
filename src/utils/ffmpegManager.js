/**
 * @author Kevin
 * @Date: 2024-4-12
 */
import { remote } from 'electron'
import audioManager from "./audioManager";
const path = require('path')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegStatic = require('ffmpeg-static')
if (process.env.NODE_ENV === 'production') {
	const ffmpegPath = path.join(remote.app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'node_modules/ffmpeg-static/ffmpeg.exe')
	const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')
	ffmpeg.setFfmpegPath(ffmpegPath)
	ffmpeg.setFfprobePath(ffprobePath)
}

// https://www.cnblogs.com/fangsmile/p/5345898.html

const ffmpegManager = {
	editAudio: async function (file, startTime, endTime, fileName, id) {
		// console.log(file, startTime, endTime, fileName, 'Directory__' + id)
		// return
		// 1、截取首部
		let res1 = await this.clipAudio(file, 'first', 0, startTime)
		// 2、截取尾部
		let res2 = await this.clipAudio(file, 'last', endTime)
		// 3、首尾拼接，合成最终需要的音频
		let finalPath = await this.mergeAudio(path.join(remote.app.getPath('temp'), `/first.mp3`), path.join(remote.app.getPath('temp'), `/last.mp3`), id)
		await audioManager.saveClipList(id, finalPath);
		if (finalPath) {
			let buf = fs.readFileSync(finalPath);
			let file =  this.arrayBufferToBlob(buf, fileName);
			return { file, finalPath };
		}
		return null
	},
	/**
	 * 裁剪音频
	 * @param file
	 * @param position
	 * @param startTime
	 * @param duration
	 * @returns {Promise<unknown>}
	 */
	clipAudio: function (file, position, startTime, duration) {
		let outputOptions = []
		if (duration) { // 如果持续时间参数不存在，则从开始时间一直裁剪到音频结束
			outputOptions.push(`-t ${duration}`)
		}
		outputOptions.push('-acodec copy')
		outputOptions.push('-vn')
		return new Promise((resolve, reject) => {
			ffmpeg().input(file).inputOptions([`-ss ${startTime}`]).outputOptions(outputOptions).save(path.join(remote.app.getPath('temp'), `/${position}.mp3`))
				.on('error', function (err) {
					console.log('error: ' + err, position)
					reject(err)
				}).on('end', function (err, response) {
				if (!err) {
					resolve(response)
				} else {
					reject(err)
				}
			})
		})
	},
	/**
	 * 合并音频
	 * @param filePathFirst
	 * @param filePathLast
	 * @param id
	 * @returns {Promise<unknown>}
	 */
	mergeAudio: function (filePathFirst, filePathLast, id) {
		console.log('开始合并音频.......................')
		let finalPath = path.join(remote.app.getPath('temp'), `/${id + '' + new Date().getTime()}.mp3`);
		return new Promise((resolve, reject) => {
			ffmpeg().input(filePathFirst).input(filePathLast)
				.on('error', function (err) {
					reject(err)
					console.log('An error occurred: ' + err.message)
				})
				.on('end', function () {
					console.log('merge finish!')
					//结束后存入本地
					resolve(finalPath);
				}).mergeToFile(finalPath, path.join(remote.app.getPath('temp')))
		})
	},
	/**
	 * arrayBuffer 转 blob 对象
	 * @param buffer
	 * @param fileName
	 * @returns {File}
	 */
	arrayBufferToBlob: function (buffer, fileName) {
		return new File([buffer], fileName, {type: 'audio/mp3'})
	}
}

export default ffmpegManager
