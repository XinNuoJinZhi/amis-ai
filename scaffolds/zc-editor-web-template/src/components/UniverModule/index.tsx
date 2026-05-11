import React, {useEffect, useState, useRef} from 'react'
import {Button, Modal, Select, Form, UploadProps, Upload, message, Spin } from "antd";
import {createUniver, defaultTheme, LocaleType, merge} from '@univerjs/presets';
import {UniverSheetsCorePreset} from '@univerjs/presets/preset-sheets-core';
import UniverPresetSheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN';
import { UniverSheetsAdvancedPreset } from '@univerjs/presets/preset-sheets-advanced';
import UniverPresetSheetsAdvancedZhCN from '@univerjs/presets/preset-sheets-advanced/locales/zh-CN';
import { UniverSheetsDrawingPreset } from '@univerjs/presets/preset-sheets-drawing'
import UniverPresetSheetsDrawingZhCN from '@univerjs/presets/preset-sheets-drawing/locales/zh-CN'
import { UniverSheetsCustomMenuPlugin } from './menu-plugin/plugin'
import {UniverInstanceType} from "@univerjs/core";
import {downloadFile} from '@univerjs-pro/exchange-client';
import {service} from '@/utils/request'
import ExcelJS from 'exceljs'
import univerStore, {setStoreUniverData} from '@/store/univer';
import '@univerjs/presets/lib/styles/preset-sheets-drawing.css'
import '@univerjs/presets/lib/styles/preset-sheets-advanced.css'
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import * as XLSX from "xlsx";
import {getPrintConfigByKey} from "@/api/sheetEditorApi";

export default function UniverModule() {
    const containerRef = useRef<HTMLDivElement>(null);
    const univerAPIs = useRef();
    const univer = useRef();
    const workbookConfig = {
        id: "workbook",
        locale: "zhCN",
    };
    const [form] = Form.useForm<{}>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [excelSelect, setExcelSelect] = useState([])
    const [excelSelectValue, setExcelSelectValue] = useState('')
    const isShow = useRef(false)
    const excelList = useRef([])
    const [loading, setLoading] = useState(false);
    useEffect(async () => {
        // const dataUrl = JSON.parse(params.get('url'));
        // console.log(dataUrl,'dataUrl')
        const {univer, univerAPI} = createUniver({
            locale: LocaleType.ZH_CN,
            locales: {
                [LocaleType.ZH_CN]: merge(
                    {},
                    UniverPresetSheetsCoreZhCN,
                    UniverPresetSheetsDrawingZhCN,
                    UniverPresetSheetsAdvancedZhCN,
                ),
            },
            theme: defaultTheme,
            presets: [
                UniverSheetsCorePreset({
                    container: containerRef.current,
                    menu: {
                        'exchange-client.operation.export-xlsx': {
                            hidden: true,
                        },
                        'sheets-exchange-client.operation.exchange': {
                            hidden: true,
                        },
                    }
                }),
                UniverSheetsDrawingPreset(),
                UniverSheetsAdvancedPreset(),
            ],
            plugins: [
                UniverSheetsCustomMenuPlugin,
            ],
        });
        console.log(univer, 'univeruniveruniver')
        console.log(univerAPI, 'univerAPIuniverAPIuniverAPI')
        univerAPIs.current = univerAPI

        univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, async (event) => {
            console.log(event, 'eventeventeventevent')
            console.log(univerAPI, 'univerAPI')
            if (event.stage === univerAPI.Enum.LifecycleStages.Rendered) {
                const fWorkbook = univerAPI.getActiveWorkbook()
                const fWorksheet = fWorkbook?.getActiveSheet()
                for (const item of excelList.current) {
                    let needImage = item.value.match(/^_img\^(.*)/)[1]
                    const image = await fWorksheet?.newOverGridImage()
                      .setSource(needImage, univerAPI.Enum.ImageSourceType.URL)
                      .setColumn(5)
                      .setRow(5)
                      .setWidth(120)
                      .setHeight(120)
                      .buildAsync()
                    const fRange = fWorksheet?.getRange(item.label)
                    await fRange?.insertCellImageAsync(needImage)
                }
            }
        })
        // univerAPI.createWorkbook({id: 'Sheet1', name: 'Sheet1'});
        await handleChangeUploadExcel()
        return () => {
            univerAPIs.current.dispose();
        };
    }, [])
    function generateWorksheet(data) {
        const cells = {};
        let minAddr = '', maxAddr = '';
        excelList.current = []
        for (const [addr, cell] of Object.entries(data)) {
            if (addr.startsWith('!')) continue;
            cells[addr] = cell;
            const pattern = /^_img\^/;
            if(pattern.test(cell.v)){
                excelList.current.push(
                  {
                      label: addr,
                      value: cell.v
                  }
                )
            }
            // 更新最小/最大单元格地址
            if (!minAddr || addr < minAddr) minAddr = addr;
            if (!maxAddr || addr > maxAddr) maxAddr = addr;
        }

        const range = minAddr && maxAddr ? `${minAddr}:${maxAddr}` : 'A1';

        return {
            '!ref': range,
            ...cells,
            ...Object.fromEntries(
                Object.entries(data).filter(([k]) => k.startsWith('!') && k !== '!ref')
            )
        };
    }
    function getCorrectRef(sheetData) {
        if (!sheetData || typeof sheetData !== 'object') {
            return '!ref';
        }

        let minCol = Infinity;
        let maxCol = -Infinity;
        let minRow = Infinity;
        let maxRow = -Infinity;

        // 遍历所有键，找出有效的单元格（排除以 ! 开头的系统键）
        for (const key in sheetData) {
            if (key.startsWith('!') || key === '!ref' || key === '!margins') {
                continue; // 跳过系统字段
            }

            // 匹配 A1、B10、AA100 这样的单元格地址
            const match = key.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const colStr = match[1];   // 列字母，如 "A"、"AB"
                const row = parseInt(match[2], 10);

                // 计算列号（A=1, B=2, ..., Z=26, AA=27...）
                let col = 0;
                for (let i = 0; i < colStr.length; i++) {
                    col = col * 26 + (colStr.charCodeAt(i) - 64);
                }

                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
            }
        }

        // 如果没有找到任何单元格，返回默认值
        if (minCol === Infinity || minRow === Infinity) {
            return "A1:Z100"; // 或你想要的默认范围
        }

        // 将列号转回字母
        function colNumToLetter(col) {
            let letter = '';
            while (col > 0) {
                const mod = (col - 1) % 26;
                letter = String.fromCharCode(65 + mod) + letter;
                col = Math.floor((col - 1) / 26);
            }
            return letter;
        }

        const startCol = colNumToLetter(minCol);
        const endCol = colNumToLetter(maxCol);

        return `${startCol}${minRow}:${endCol}${maxRow}`;
    }
    function sheetToFullJson(sheet) {
        const range = XLSX.utils.decode_range(getCorrectRef(sheet));
        // const range = XLSX.utils.decode_range(sheet['!ref']);
        console.log(range,'range')
        const rows = [];
        let maxRows = 0;
        if(range.e.c == 0){
            maxRows = range.e.r
        }else if(range.e.r == 0){
            maxRows = range.e.c
        }else{
            maxRows = range.e.c * range.e.r
        }
        for (let R = range.s.r; R <= maxRows+1; ++R) {
            const row = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = sheet[cell_ref];
                row.push(cell && cell.v ? cell.v : "");
            }
            rows.push(row);
        }

        return rows;
    }
    /** 将sheet数据转换为json */
    const convertWorkbookToJson = (workbook) => {
        const sheets = {};
        const sheetOrder = [];
        const styles = {
            'topTitleStyle': {
                "ff": "宋体",
                "fs": 14,
                "it": 0,
                "bl": 1,
                "ul": {
                    "s": 0,
                    "cl": {
                        "rgb": "rgb(0,0,0)"
                    }
                },
                "st": {
                    "s": 0,
                    "cl": {
                        "rgb": "rgb(0,0,0)"
                    }
                },
                "ol": {
                    "s": 0,
                    "cl": {
                        "rgb": "rgb(0,0,0)"
                    }
                },
                "tr": {
                    "a": 0,
                    "v": 0
                },
                "td": 0,
                "ht": 2,
                "vt": 2,
                "tb": 3,
                "pd": {
                    "t": 0,
                    "b": 2,
                    "l": 2,
                    "r": 2
                },
                "cl": {
                    "rgb": "rgb(0,0,0)"
                },
                "bg": {
                    "rgb": "rgb(192,192,192)"
                },
                "bd": {
                    "l": {
                        "cl": {
                            "rgb": "windowtext"
                        },
                        "s": 1
                    },
                    "r": {
                        "cl": {
                            "rgb": "windowtext"
                        },
                        "s": 1
                    },
                    "t": {
                        "cl": {
                            "rgb": "windowtext"
                        },
                        "s": 1
                    },
                    "b": {
                        "cl": {
                            "rgb": "windowtext"
                        },
                        "s": 1
                    }
                }
            }
        }
        workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            let worksheet = {...workbook.Sheets[sheetName]};
            console.log(worksheet, 'worksheet')
            let worksheets = generateWorksheet(worksheet);
            console.log(worksheets,'worksheetsworksheetsworksheetsworksheets')
            const jsonSheet = sheetToFullJson(worksheets)
            console.log(jsonSheet,'jsonSheet')
            const cellData = {};
            let maxColumnCount = 0;
            jsonSheet.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell !== null && cell !== undefined && cell !== "") {
                        if (!cellData[rowIndex]) {
                            cellData[rowIndex] = {};
                        }
                        cellData[rowIndex][colIndex] = {v: cell};
                        if (colIndex + 1 > maxColumnCount) {
                            maxColumnCount = colIndex + 1;
                        }
                    }
                });
            });
            const sheetId = `sheet_${sheetIndex}`;
            for (const sheetIdKey in cellData[0]) {
                cellData[0][sheetIdKey] = {
                    ...cellData[0][sheetIdKey],
                    s: isShow.current ? styles.topTitleStyle : {},
                    t: 1
                }
            }
            sheets[sheetId] = {
                id: sheetId,
                name: sheetName,
                rowCount: jsonSheet.length + 50,
                columnCount: maxColumnCount + 50,
                zoomRatio: 1,
                cellData: cellData,
                showGridlines: 1,
            };
            sheetOrder.push(sheetId);
        });
        return {
            ...workbookConfig,
            sheetOrder: sheetOrder,
            sheets: sheets,
            styles: isShow.current ? styles : {},
        };
    };
    /** 加载文件 */
    const handleChangeUploadExcel = async () => {
        isShow.current = false
        const params = new URLSearchParams(window.location.search);
        const getUrl = params.get('url') as string
        const getSessionId = params.get('sessionId') as string
        setLoading(true)
        getPrintConfigByKey({
            key: getSessionId
        }).then(items => {
            let postData = {
                ...items.data.data.api,
                postData: 'postData' in items.data.data.api ?
                    typeof items.data.data.api.postData == 'string' ?
                        JSON.parse(items.data.data.api.postData)
                        : undefined : undefined,
                type: "application/json",
                responseType: 'blob',
                config: {
                    isUploadExcel: true,
                }
            }
          setStoreUniverData({
            ...items.data.data,
            api: {...items.data.data.api, url: items.data.data.api.url + '&preview=false'}
          });
          if(items.data.data.api.method){
                isShow.current = true
            }else{
                postData.method = 'post'
            }
            postData.url += '&preview=true'
            service(postData).then(async (res: any) => {
                console.log(res, '接口excel数据')
                if (!res?.data) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = e.target.result;
                    // console.log(data, 'aaaaaaaaaaa');
                    // 使用XLSX库解析Excel文件
                    const workbook = XLSX.read(data, {type: 'binary'}); // 关键：指定类型为 array
                    console.log(workbook, 'workbook');
                    // 假设convertWorkbookToJson是你的自定义函数，用于将workbook转换为JSON格式
                    const excelData = convertWorkbookToJson(workbook);
                    console.log(excelData, 'excelData')
                    // const fWorkbook = univerAPIs.current.getActiveWorkbook();
                    // const newSheet = fWorkbook.create(excelData.sheets.sheet_0.name, undefined, undefined, {
                    //     sheet: excelData.sheets.sheet_0
                    // });
                    univerAPIs.current.createWorkbook({...excelData, id: excelData.sheets.sheet_0.name})
                    setTimeout(() => {
                        setLoading(false)
                    }, 3000)
                    univerAPIs.current.disposeUnit(workbookConfig.id);
                    // univerAPIs.current.createUnit(UniverInstanceType.UNIVER_SHEET, excelData);
                };
                // 直接读取Blob对象的内容
                // reader.readAsBinaryString(fileData.file); // 确保res.data是一个Blob对象
                reader.readAsBinaryString(res.data); // 确保res.data是一个Blob对象
            })
        })

    };

    function convertJsonTo2DArray(jsonObject) {
        const result = [];

        // 遍历对象的每一行
        for (let rowKey in jsonObject) {
            let rowArray = [];
            let currentRow = jsonObject[rowKey];

            // 遍历当前行中的每一个元素
            for (let cellKey in currentRow) {
                if (currentRow[cellKey].hasOwnProperty('v')) {
                    // 如果存在'v'属性，则添加该值
                    rowArray.push(currentRow[cellKey]['v']);
                } else {
                    // 如果不存在'v'属性，添加空字符串
                    rowArray.push("");
                }
            }

            // 将处理好的行添加到结果中
            result.push(rowArray);
        }

        return result;
    }

    /** 导出表格数据 */
    const handleGetSheetData = (name, data) => {
        // const jsonSheet = XLSX.utils.json_to_sheet(data.sheets.sheet_0);
        // const jsonSheet = convertJsonTo2DArray(data)
        // console.log(jsonSheet,'jsonSheetjsonSheetjsonSheet')
        // const worksheet = XLSX.utils.aoa_to_sheet(jsonSheet);
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        console.log(worksheet, 'worksheetworksheetworksheet')
        const workbook = XLSX.utils.book_new();
        console.log(workbook, 'workbookworkbookworkbook')
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dates");
        XLSX.writeFile(workbook, name + ".xlsx", {compression: true});
        setIsModalOpen(false)
    };

    function save(data) {
        // 创建 blob
        const blob = new Blob([data], {type: 'application/vnd.ms-excel'})
        // 创建 href 超链接，点击进行下载
        window.URL = window.URL || window.webkitURL
        const href = URL.createObjectURL(blob)
        const downA = document.createElement('a')
        downA.href = href
        // downA.download = fileName
        // downA.download = 'upload.xlsx'.replace(new RegExp('"', 'g'), '')
        downA.click()
        // 销毁超连接
        window.URL.revokeObjectURL(href)
    }

    const openModel = () => {
        const data = univerAPIs.current.getActiveWorkbook().save();
        console.log(
            "%c [ data ]-68",
            "font-size:13px; background:pink; color:#bf2c9f;",
            data
        );
        let selectArr = []
        for (const resKey in data.sheets) {
            console.log(resKey, 'resKey')
            selectArr.push({
                name: data.sheets[resKey].name,
                value: resKey
            })
        }
        console.log(selectArr, 'selectArr')
        setExcelSelect(selectArr)
        setIsModalOpen(true)
    }

    const handleChange = (e) => {
        console.log(e, '下拉选择')
        setExcelSelectValue(e)
    }

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                const data = univerAPIs.current.getActiveWorkbook().save();
                console.log(XLSX, 'SSSS')
                console.log(convertJsonTo2DArray(data.sheets[excelSelectValue].cellData))
                let paramsData = convertJsonTo2DArray(data.sheets[excelSelectValue].cellData)
                let name = excelSelect.filter(res => res.value == excelSelectValue)[0].name
                handleGetSheetData(name, paramsData)
            })
            .catch(info => {
            });
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            {/*<Button type="primary" onClick={openModel} style={{margin: '10px'}}>*/}
            {/*    下载*/}
            {/*</Button>*/}
            <Modal
                title="选择工作薄"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={'确认'}
                cancelText={'取消'}
                maskClosable={false}
                destroyOnClose={true}
            >
                <Form
                    layout="horizontal"
                    form={form}
                    clearOnDestroy
                >
                    <Form.Item label="请选择工作簿" name="name"
                               rules={[{required: true, message: '这是必填项'}]}
                    >
                        <Select
                            value={excelSelectValue}
                            onChange={handleChange}
                            placeholder='请选择工作簿'
                        >
                            {excelSelect?.map(e => {
                                return (
                                    <Select.Option key={e.value} value={e.value}>
                                        {e.name}
                                    </Select.Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
            <Spin spinning={loading}  size="large">
            <div ref={containerRef} style={{height: document.body.clientHeight+'px'}}></div>
            </Spin>
        </>
    );
}
