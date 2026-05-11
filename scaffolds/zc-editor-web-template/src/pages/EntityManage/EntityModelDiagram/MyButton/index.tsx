import { Button, Tooltip, message, Dropdown } from "antd";
import { observer } from "mobx-react";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
    ExpandOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    SyncOutlined,
    QuestionCircleOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import { Graph, DataUri } from "@antv/x6";
import type { MenuProps } from 'antd';

interface EntityDiagramProps {
    graph: Graph | null,
    setShowKeyDialog: Dispatch<SetStateAction<boolean>>,
    getData: (flag: boolean) => void,
    fileName: string
}

export default observer((props: EntityDiagramProps) => {
    // 同步滚动和缩放
    // useEffect(() => {
    //     props.graphRef?.on('scale', ({ sx, sy }) => {
    //         setZoomSize(sx)
    //     })
    // }, [props.graphRef]);
    const [zoomSize, setZoomSize] = useState<number>(1);
    const zoomStep = 0.1;
    useEffect(() => {
        setZoomSize(props.scaleSize)
    }, [props.scaleSize]);
    
    //缩小
    function handleZoomOut() {
        let newSize: number = Math.floor(zoomSize * 100 - zoomStep * 100) / 100;
        if (newSize < 0.2) {
            newSize = 0.2;
            setZoomSize(newSize);
            props.graphRef?.zoomTo(newSize)
            message.warning('已达到最小倍数 20%').then(() => { });
            return
        }
        setZoomSize(newSize);
        props.graphRef?.zoom(-0.1)
    }
    //点击中间
    function sizeChange() {
        if (props.graphRef) {
            setZoomSize(1);
            props.graphRef.zoomTo(1)
        }
    }
    //放大
    function handleZoomIn() {
        let newSize: number = Math.floor(zoomSize * 100 + zoomStep * 100) / 100;
        if (newSize > 4) {
            newSize = 4;
            setZoomSize(newSize);
            props.graphRef?.zoomTo(newSize)
            message.warning('已达到最大倍数 400%').then(() => { });
            return
        }
        setZoomSize(newSize);
        props.graphRef?.zoom(0.1)
    }
    //居中
    function resetZoom() {
        props.graphRef!.zoomToFit({ padding: 10, maxScale: 1 })
    }
    //刷新
    function handleRefresh() {
        props.getData()
    }
    //快捷键
    function handleKey() {
        props.setShowKeyDialog(true)
    }
    const padding = 30
    function exportJpeg(fileName: string) {
        props?.graphRef.toJPEG((dataUri: string) => {
            DataUri.downloadDataUri(dataUri, fileName + '.jpeg')
        }, {
            padding: {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            },
        })
    }
    function exportSvg(fileName: string) {
        const viewBox = props?.graphRef?.getContentBBox()
        viewBox.x = viewBox.x - padding
        viewBox.y = viewBox.y - padding
        viewBox.width = viewBox.width + padding * 2
        viewBox.height = viewBox.height + padding * 2
        props?.graphRef.toSVG((dataUri: string) => {
            DataUri.downloadDataUri(DataUri.svgToDataUrl(dataUri), fileName + '.svg')
        }, {
            viewBox: viewBox,
        })
    }
    function exportPng(fileName: string) {
        props?.graphRef.toPNG((dataUri: string) => {
            DataUri.downloadDataUri(dataUri, fileName + '.png')
        }, {
            padding: {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            },
        })
    }
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: (
                <a onClick={() => exportSvg(props.fileName)}>
                    导出SVG
                </a>
            ),
        },
        {
            key: '2',
            label: (
                <a onClick={() => exportPng(props.fileName)}>
                    导出PNG
                </a>
            ),
        },
        {
            key: '3',
            label: (
                <a onClick={() => exportJpeg(props.fileName)}>
                    导出JPEG
                </a>
            ),
        },
    ];
    return (
        <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>
            <Tooltip title="缩小">
                <Button
                    type={'default'}
                    size={'small'}
                    style={{ width: '45px' }}
                    icon={<ZoomOutOutlined />}
                    onClick={handleZoomOut}
                />
            </Tooltip>
            <Button type={'default'} size={'small'} style={{ width: '65px' }} onClick={sizeChange}>
                {zoomSize ? Math.floor(zoomSize * 10 * 10) + '%' : ''}
            </Button>
            <Tooltip title="放大">
                <Button
                    type={'default'}
                    size={'small'}
                    style={{ width: '45px' }}
                    icon={<ZoomInOutlined />}
                    onClick={handleZoomIn}
                />
            </Tooltip>
            <Tooltip title="适应视口">
                <Button
                    type={'default'}
                    size={'small'}
                    style={{ width: '45px' }}
                    icon={<ExpandOutlined />}
                    onClick={resetZoom}
                />
            </Tooltip>
            <Tooltip title="刷新">
                <Button
                    type={'default'}
                    size={'small'}
                    style={{ width: '45px' }}
                    icon={<SyncOutlined />}
                    onClick={handleRefresh}
                />
            </Tooltip>
            <Tooltip title="导出">
                <Dropdown menu={{ items }} placement="bottomLeft">
                    <Button
                        type={'default'}
                        size={'small'}
                        style={{ width: '45px' }}
                        icon={<ExportOutlined />}
                    />
                </Dropdown>
            </Tooltip>
            <Tooltip title="快捷键">
                <Button
                    type={'default'}
                    size={'small'}
                    style={{ width: '45px' }}
                    icon={<QuestionCircleOutlined />}
                    onClick={handleKey}
                />
            </Tooltip>
        </div>
    )
}) as React.FC<EntityDiagramProps> 
