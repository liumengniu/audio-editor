import './App.less';
import {HeartOutlined, SmileOutlined} from '@ant-design/icons';
import {MenuDataItem} from '@ant-design/pro-components';
import {PageContainer, ProLayout} from '@ant-design/pro-components';
import logo from "./logo.png"
import WavesurferPlayer, {useWavesurfer} from '@wavesurfer/react'
import {Button, Col, Row, Space, Upload} from "antd";
import {
	SearchOutlined,
	UploadOutlined,
	PlayCircleOutlined,
	StopOutlined,
	PauseCircleOutlined,
	CloseCircleOutlined,
	SaveOutlined,
	ExportOutlined
} from "@ant-design/icons"
import {useMemo, useRef, useState} from "react";
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import ffmpegUtils from "@utils/ffmpegUtil";


const IconMap = {
	smile: <SmileOutlined/>,
	heart: <HeartOutlined/>,
};

const defaultMenus = [
	{
		path: '/',
		name: '编辑',
		icon: 'smile',
	},
	{
		path: '/demo',
		name: '未完待续',
		icon: 'heart',
	},
];

const loopMenuItem = (menus) =>
	menus.map(({icon, routes, ...item}) => ({
		...item,
		icon: icon && IconMap['smile'],
		children: routes && loopMenuItem(routes),
	}))

/**
 * 时间轴插件初始化
 */
const topTimeline = TimelinePlugin.create({
	height: 20,
	insertPosition: 'beforebegin',
	timeInterval: 10,
	primaryLabelInterval: 20,
	secondaryLabelInterval: 1,
	style: {
		fontSize: '14px',
		color: '#ccc',
	},
})

/**
 * regions插件初始化
 */
const wsRegions = RegionsPlugin.create({
	maxRegions: 1,
	regionsMinLength: 2,
	color: 'rgb(238,187,187, 0.6)',
	dragSelection: {
		slop: 5
	}
})

function App() {
	const containerRef = useRef(null)
	const [currentFile, setCurrentFile] = useState(null)
	
	const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
		height: 175,
		container: containerRef,
		waveColor: '#62CB9B',
		progressColor: 'red',
		barWidth: 4,
		splitChannels: true,
		autoScroll: true,
		plugins: useMemo(() => [topTimeline, wsRegions],[])
	})
	
	/**
	 * 导入音频 blob 对象，绘制波形图
	 */
	const drawWave = file =>{
		wavesurfer?.loadBlob(file)
		/**
		 * wavesurfer回调事件
		 */
		wavesurfer.on('interaction', (newTime) => {
			console.log('Interaction', newTime + 's')
		})
		// 启动region拖动事件
		enableDragSelection();
		
		wavesurfer.on('drag', (relativeX) => {
			console.log('drag', relativeX)
		})
	}
	
	/**
	 * 启动region拖动事件
	 */
	const enableDragSelection = () =>{
		wsRegions.enableDragSelection({
			color: 'rgba(255, 255, 255, 0.3)',
		})
		
		wsRegions.on('region-created', (region) => {
		
		})
		
		wsRegions.on('region-updated', (region) => {
			console.log('Updated region', region)
		})
	}
	/**
	 * 自定义上传音频文件回调事件
	 * @param $event
	 */
	const customRequest = $event =>{
		const file = $event?.file;
		setCurrentFile(file)
		drawWave(file);
	}
	/**
	 * 关闭
	 */
	
	/**
	 * 保存
	 */
	
	
	/**
	 * 播放/暂停
	 */
	const onPlayPause = () => {
		wavesurfer && wavesurfer.playPause()
	}
	/**
	 * 停止
	 */
	const onPlayStop = () =>{
		wavesurfer && wavesurfer.stop();
	}
	/**
	 * 裁剪
	 */
	const handleCrop = async () =>{
		const regionList = wsRegions.getRegions();
		const region = regionList[0];
		let startTime = region.start, endTime = region.end;
		// let newFile = await ffmpegUtils.clip(currentFile, startTime, endTime);
		let newFile = await ffmpegUtils.mergeAudio(currentFile, startTime, endTime);
		drawWave(newFile)
		wsRegions.clearRegions();
	}
	
	return (
		<div className="App">
			<ProLayout
				style={{
					minHeight: 500,
				}}
				title={"音频编辑"}
				logo={logo}
				fixSiderbar
				location={{
					pathname: '/welcome/welcome',
				}}
				menu={{request: async () => loopMenuItem(defaultMenus)}}
			>
				<PageContainer content="简易编辑">
					<div style={{height: '120vh', minHeight: 600,}}>
						
						<Space>
							文件：
							<Upload customRequest={customRequest} fileList={[]}>
								<Button icon={<UploadOutlined />}>打开音频</Button>
							</Upload>
							<Button icon={<CloseCircleOutlined />}>关闭音频</Button>
							<Button icon={<SaveOutlined />}>保存音频</Button>
							<Button icon={<ExportOutlined />} type="primary">导出</Button>
						</Space>
						<Space style={{marginTop: 10, width: "100%"}}>
							剪辑：
							<Space>
								<Button>剪切</Button>
								<Button onClick={handleCrop}>裁剪</Button>
								<Button>拷贝</Button>
								<Button>粘贴</Button>
								<Button>删除</Button>
							</Space>
							<Space>
								<Button>插入停顿</Button>
								<Button>拼接音频</Button>
								<Button>合并音频</Button>
							</Space>
							
						</Space>
						
						<div id="wavesurfer-container" ref={containerRef} />
						<Space>
							{
								isPlaying ? <Button icon={<PauseCircleOutlined />} onClick={onPlayPause}>暂停</Button> :
									<Button icon={<PlayCircleOutlined/>} onClick={onPlayPause}>播放</Button>
							}
							<Button icon={<StopOutlined />} onClick={onPlayStop}>停止</Button>
						</Space>
						<Space>
						
						</Space>
					</div>
				</PageContainer>
			</ProLayout>
		</div>
	);
}

export default App;
