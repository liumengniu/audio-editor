/**
 * ffmpeg 相关操作方法
 * @author Kevin
 * @Date: 2024-4-14
 */
import _ from "lodash"
// const ffmpeg = require("ffmpeg.js");
// const fs = require("fs");


const ffmpegUtils = {
	worker: null,
	end: 'end',
	/**
	 * 新建一个webworker(防止阻塞JS主线程)
	 * @param workerPath
	 * @returns {Worker}
	 */
	createWorker: function(workerPath){
		return new Worker(workerPath);
	},
	/**
	 * blob -> audio
	 * @param blob
	 * @returns {HTMLAudioElement}
	 */
	blobToAudio: function (blob) {
		const url = URL.createObjectURL(blob);
		return new Audio(url);
	},
	/**
	 * blob 转  arrayBuffer
	 * @param blob
	 * @returns {Promise<unknown>}
	 */
	blobToArrayBuffer: function(blob){
		return new Promise(((resolve, reject) => {
			let fileReader = new FileReader();
			fileReader.onload = function () {
				resolve(fileReader.result);
			};
			fileReader.readAsArrayBuffer(blob);
		}))
	},
	/**
	 * arrayBuffer 转 blob 对象
	 * @param buffer
	 */
	arrayBufferToBlob: function(buffer){
		const file = new File([buffer], 'test.mp3', {
			type: 'audio/mp3',
		});
		return file;
	},
	/**
	 * 和 web-worker间通信
	 * @param worker
	 * @param postInfo
	 * @returns {Promise<unknown>}
	 */
	pmToPromise: function(worker, postInfo){
		console.log(worker, 444444444444444,postInfo)
		return new Promise((resolve, reject) => {
			// 成功回调
			const successHandler = function(event) {
				// console.log(event, 5555555555555555555555555555)
				switch (event.data.type) {
					case "stdout":
						console.log("worker stdout: ", event.data.data);
						break;
					
					case "start":
						console.log("worker receive your command and start to work:)");
						break;
					
					case "done":
						worker.removeEventListener("message", successHandler);
						console.log(event, '999999999999999eventeventevent9999999999999')
						resolve(event);
						break;
					case 'error':
						worker.removeEventListener('message', successHandler);
						reject(event.data.data);
						break;
					
					default:
						break;
				}
			};
			
			// 异常捕获
			const failHandler = function(error) {
				worker.removeEventListener("error", failHandler);
				reject(error);
			};
			worker.addEventListener("message", successHandler);
			worker.addEventListener("error", failHandler);
			postInfo && worker.postMessage(postInfo);
		});
	},
	/**
	 * todo 这个第三方库 的 音频编解码 库acodec无法处理 png 视频流，根据作者所说，
	 * todo 有三种方式处理 1 -vn 不处理png视频流  2 用视频编解码器 -vcodec copy, 直接当成视频处理  3 重新编译 能处理png视频流 的acodec
	 * 按ffmpeg文档要求，将带裁剪数据转换成指定格式
	 * @param arrayBuffer 待处理的音频buffer
	 * @param st 开始裁剪时间点（秒）
	 * @param duration 裁剪时长
	 */
	getClipCommand: function(arrayBuffer, st, duration){
		return {
			type: "run",
			arguments: `-ss ${st} -i input.mp3 ${duration ? `-t ${duration} ` : ""}-acodec copy -vn output.mp3`.split(" "),
			MEMFS: [
				{
					data: new Uint8Array(arrayBuffer),
					name: "input.mp3"
				}
			]
		};
	},
	/**
	 * 合并音频command
	 * @returns {{arguments: string[], type: string, MEMFS: [{data: Uint8Array, name: string}]}}
	 */
	getMergeCommand: function (firstBuf, lastBuf){
		return {
			type: "run",
			arguments: ['-i', 'input1.mp3', '-i', 'input2.mp3', '-filter_complex', 'amix=inputs=2:duration=first:dropout_transition=2', 'output.mp3'],
			MEMFS: [
				{
					data: new Uint8Array(firstBuf),
					name: "input1.mp3"
				},
				{
					data: new Uint8Array(lastBuf),
					name: "input2.mp3"
				}
			]
		}
	},
	/**
	 * 将传入的一段音频blob，按照指定的时间位置进行裁剪
	 * @param originBlob 待处理的音频
	 * @param startSecond 开始裁剪时间点（秒）
	 * @param endSecond 结束裁剪时间点（秒）
	 * @param dataType 返回的格式  blob 或 arrayBuffer（参数"arraybuffer"）
	 */
	clip: async function(originBlob, startSecond, endSecond, dataType){
		if(!this.worker){
			this.worker = this.createWorker("./ffmpeg-worker-mp4.js")
			console.log(this.worker, 'vvvvvvvvvvvvvvvv')
		}
		const ss = startSecond;
		// 获取需要裁剪的时长，若不传endSecond，则默认裁剪到末尾
		const d = _.isNumber(endSecond) ? endSecond - startSecond : this.end;
		// 将blob转换成可处理的arrayBuffer
		const originAb = await this.blobToArrayBuffer(originBlob);
		let resultArrBuf;
		console.log(22222222222,originAb,'[[[',d)
		// 获取发送给ffmpge-worker的指令，并发送给worker，等待其裁剪完成
		if (d === this.end) {
			console.log(111111111111111111111111111111111)
			resultArrBuf = (await this.pmToPromise(
				this.worker,
				this.getClipCommand(originAb, ss)
			)).data.data.MEMFS[0].data;
		} else {
			resultArrBuf = (await this.pmToPromise(
				this.worker,
				this.getClipCommand(originAb, ss, d)
			)).data.data.MEMFS[0].data;
		}
		// 将worker处理过后的arrayBuffer包装成blob，并返回
		return dataType === "arraybuffer" ? resultArrBuf : this.arrayBufferToBlob(resultArrBuf)

	},
	/**
	 * 音频裁剪替换（类似于JS的splice方法）
	 */
	spliceAudio: function (originBlob, startSecond, endSecond) {
	
	},
	/**
	 * 音频合成
	 */
	mergeAudio: async function (originBlob, startSecond, endSecond) {
		const firstBuf = await this.clip(originBlob, 0, startSecond, "arraybuffer")
		const lastBuf = await this.clip(originBlob, endSecond, null, "arraybuffer")
		console.log(firstBuf?.buffer, '返回的buffer', lastBuf?.buffer)
		// this.worker = this.createWorker("./ffmpeg-worker-mp4.js")
		const result = (await this.pmToPromise(
			this.worker,
			this.getMergeCommand(firstBuf, lastBuf)
		));
		const resultArrBuf = _.get(result, `data.data.MEMFS[0].data`)
		// console.log(resultArrBuf, '=================resultArrBuf===============', result)
		return this.arrayBufferToBlob(resultArrBuf);
	}
	
	/**
	 * 音频转码
	 */
}

export default ffmpegUtils;
