/**
 * @author Kevin
 * @Date: 2024-4-12
 */

import { remote } from 'electron';
import _ from "lodash"
const fs = require("fs");
const path = require("path")

const audioManager = {
	jsonPath: path.join(remote.app.getPath('userData'), '/audio.json'),
	/**
	 * 保存音频裁剪的状态
	 */
	saveClipList: function (id, filePath){
		const _this = this;
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(remote.app.getPath('userData'), '/audio.json'), 'utf-8', function (err, json) {
				if (!err) {
					let jsonContent = JSON.parse(json);
					if (!_.isEmpty(_.get(jsonContent, `${id}.fileList`))) {
						jsonContent[id].fileList.push(filePath);
					} else {
						if(_.isEmpty(jsonContent[id])){
							jsonContent[id] = {};
						}
						jsonContent[id].fileList = [];
						jsonContent[id].fileList.push(filePath);
					}
					fs.writeFileSync(path.join(remote.app.getPath('userData'), '/audio.json'), JSON.stringify(jsonContent));
					resolve(true);
				} else {
					let newData = {};
					newData[id] = {};
					newData[id].fileList = [];
					newData[id].fileList.push(filePath);
					fs.writeFileSync(path.join(remote.app.getPath('userData'), '/audio.json'), JSON.stringify(newData));
					resolve(true);
				}
			});
		})
	},
	/**
	 * 撤回，最多5次,返回上一次的音频地址
	 */
	withdraw: function (id, fileName){
		const _this = this;
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(remote.app.getPath('userData'), '/audio.json'), 'utf-8', function (err, json) {
				if(!err){
					let jsonContent = JSON.parse(json);
					let fileList = jsonContent[id].fileList = _.dropRight(jsonContent[id].fileList);
					fs.writeFileSync(path.join(remote.app.getPath('userData'), '/audio.json'), JSON.stringify(jsonContent));
					let file = null;
					if(_.isEmpty(fileList)){ //如果数组为空，则撤回到服务器上数据
					
					} else {//如果数组不为空，撤回到上一次的数据
						let buf = fs.readFileSync(_.last(_.get(jsonContent, `${id}.fileList`)));
						file = _this.arrayBufferToBlob(buf, fileName);
					}
					resolve({file, filePath: _.last(_.get(jsonContent, `${id}.fileList`))});
				} else {
					resolve(null);
				}
			})
		})
	},
	/**
	 * 获取最后一次编辑后的音频地址
	 * @param id
	 */
	getLastPath: function (id){
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(remote.app.getPath('userData'), '/audio.json'), 'utf-8', function (err, json) {
				if(!err){
					let jsonContent = JSON.parse(json);
					resolve(_.last(_.get(jsonContent, `${id}.fileList`)))
				} else {
					resolve(null);
				}
			})
		})
	},
	/**
	 * 清除全部json配置
	 */
	clearJson: function (){
		return new Promise((resolve, reject) => {
			fs.unlink(this.jsonPath, (err, data) =>{
				if(err){
					reject(err)
				} else {
					resolve(true);
				}
			})
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

export default audioManager;
