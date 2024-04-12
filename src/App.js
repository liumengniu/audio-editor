import './App.less';
import {HeartOutlined, SmileOutlined} from '@ant-design/icons';
import {MenuDataItem} from '@ant-design/pro-components';
import {PageContainer, ProLayout} from '@ant-design/pro-components';
import logo from "./logo.png"
import WavesurferPlayer, {useWavesurfer} from '@wavesurfer/react'
import {Button, Col, Row, Space, Upload} from "antd";
import {SearchOutlined,UploadOutlined} from "@ant-design/icons"
import { useMemo, useRef } from "react";
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'


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
	
	const onPlayPause = () => {
		wavesurfer && wavesurfer.playPause()
	}
	/**
	 * 导入音频 blob 对象，绘制波形图
	 */
	const drawWave = file =>{
		console.log(wavesurfer, '----wavesurfer', file)
		wavesurfer?.loadBlob(file)
		// 启动region拖动事件
		enableDragSelection();
	}
	
	/**
	 * 启动region拖动事件
	 */
	const enableDragSelection = () =>{
		wsRegions.enableDragSelection({
			color: 'rgba(255, 255, 255, 0.3)',
		})
	}
	/**
	 * 自定义上传音频文件回调事件
	 * @param $event
	 */
	const customRequest = $event =>{
		const file = $event?.file;
		drawWave(file);
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
				<PageContainer content="欢迎使用">
					<div style={{height: '120vh', minHeight: 600,}}>
						
						<Space>
							<Upload customRequest={customRequest} fileList={[]}>
								<Button icon={<UploadOutlined />}>打开音频</Button>
							</Upload>
						</Space>
						
						<div id="wavesurfer-container" ref={containerRef} />
						<button onClick={onPlayPause}>
							{isPlaying ? 'Pause' : 'Play'}
						</button>
					</div>
				</PageContainer>
			</ProLayout>
		</div>
	);
}

export default App;
