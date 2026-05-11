import React, { useState, useEffect, useRef } from 'react';
import { Tree as TreeSelector} from 'amis-ui';
import { render as amisRender, confirm, alert, toast } from 'amis';
import { service } from "@/utils/request"
import IConSelect from "@/components/IconSelect"
import { getCorrelationPage, getCorrelationLarge } from "@/api/portalManage"
import { guid } from 'amis-core';
import { useDevBaseUrl } from "@/utils/util";
import {env as amisEnv} from '@/hooks/amis';

const MenuList: React.FC = (props) => {
  const addChildren = (data:any[], path:number[], newAdd:any[]) => {
    if (path.length === 0) return;
    const [head, ...tail] = path;
    if (!data[head].children) {
      data[head].children = [];
    }
    if (tail.length === 1) {
      data[head].children.push(...newAdd)
    } else {
        addChildren(data[head].children, tail, newAdd);
    }
  };

  const [options,setOptions] = useState([])
  const [portalKey,setPortalKey] = useState('')
  const [init, setInit] = useState(true);
  const [setting, setSetting] = useState(false);
  const [isApp, setIsApp] = useState(false); // 移动端门户
  const [addSchema,setAddSchema] = useState({})
  const [editSchema,setEditSchema] = useState({})
  useEffect(()=>{
    //第一次点击编辑进来，navigation是空， 取 appNavigation的值，调用一遍更新接口后，取navigation的值
    let option = [];
    if(props.data.navigation && props.data.navigation.length == 0){
      setInit(true)
      option = props.data.appNavigation && props.data.appNavigation?.pages;
      //只有第一遍需要处理接口返回的appNavigation数据
      if(props.data.type == 2) { //移动端
        setIsApp(true)
        option = option.filter(i => i.sourceType == 'page')
      } else {
        setIsApp(false)
      }
      setOptions(dealData(option))
    } else {
      setInit(false)
      option = props.data.navigation;
      if(props.data.type == 2) { //移动端
        setIsApp(true)
      } else {
        setIsApp(false)
      }
      if(option?.length > 0){
        setOptions(dealAppPerData(option))
      }
    }
    let portalKey = props.data.queryKey;
    setPortalKey(portalKey)
  },[props.data.appNavigation])
  useEffect(()=>{
    let toFatherData = options ? JSON.parse(JSON.stringify(options)) : [];
    if(toFatherData && toFatherData.length > 0){
      let data = [];
      if(init == true){
        data = (toFatherData)
      } else {
        data = toFatherData
      }
      let lastData = (data)
      props?.sendValueToFather(lastData);
    } else {
      props?.sendValueToFather([]);
    }
  },[options])
  const dealData = function(data:any){
    for(var i=0;i<data.length;i++){
      data[i].correlationId = data[i].id;
      data[i].name = data[i].label;
      data[i].portalKey = portalKey;
      //type(页面1、目录2、分组3) 改为 portalMenuType
      // 普通页面 1  外部链接 2 文件夹 3
      if(data[i].sourceType=='page'){
        data[i].portalMenuType = (data[i].pageType == 1 ||  data[i].pageType == 2) ? 1 : (data[i].pageType == 3 ? 2 : null);
        delete data[i].pageType;
      } else if(data[i].sourceType=='system'){
        data[i].portalMenuType = data[i].menuType == 1 ? 2 : 1;
      } else if(data[i].sourceType == "vis") { //大屏
        data[i].portalMenuType = 4
      }
      if(data[i].schema=='AppSetting/appPermissions/index'){
        delete data[i].children
      }
      if(data[i].children){
        dealData(data[i].children)
      }
    }
    return data;
  }
  const dealAppPerData = function(data:any){
    for(var i=0;i<data?.length;i++){
      if(data[i]?.visible == true && data[i]?.creatable == false){
        delete data[i].children
      }
      if(data[i]?.children?.length>0){
        dealAppPerData(data[i]?.children)
      }
    }
    return data;
  }
  const onAdd = function(i:any){
    let addSub = Array.isArray(i) ? true : false;
    if(addSub){
      addMenu(i)
    } else {
      addMenu([])
    }
  };
  let temp:any = []
  let iconVal:any = '';
  //处理添加页面时，判断页面是否已存在，当添加的页面完全存在时，提示已存在，当有一条不存在时，直接添加不存在的，没有提示信息
  // const dealAddData = function(oldData, addData){
  //   for(var i=0;i<oldData.length;i++){
  //     addData.findIndex(item => item.correlationId == oldData[i].correlationId) !== -1 ? temp.push(oldData[i]) : ''
  //     if(oldData[i].children && oldData[i].children.length > 0){
  //       dealAddData(oldData[i].children, addData)
  //     }
  //   }
  //   return temp;
  // };

  // 重构后的方法，处理树形结构的匹配逻辑
const dealAddData = function(oldData: any[], addData: any[]): any[] {
    // 把temp定义在函数内部，避免多次调用数据污染
    // const temp: any[] = [];

    // 定义递归函数，专门处理树形结构的匹配
    const matchTreeData = (sourceNodes: any[], targetNodes: any[]) => {
        for (const sourceNode of sourceNodes) {
            // 核心逻辑：判断当前节点是否在目标数组中存在匹配的correlationId
            const isMatched = targetNodes.some(
                targetNode => targetNode.correlationId === sourceNode.correlationId
            );

            if (isMatched) {
                temp.push(sourceNode);
            }

            // 递归处理当前节点的子节点（如果有）
            if (sourceNode.children && sourceNode.children.length > 0) {
                matchTreeData(sourceNode.children, targetNodes);
            }
        }

        // 遍历目标数组的子节点，继续匹配（处理addData包含children的场景）
        for (const targetNode of targetNodes) {
            if (targetNode.children && targetNode.children.length > 0) {
                matchTreeData(sourceNodes, targetNode.children);
            }
        }
    };

    // 启动递归匹配
    matchTreeData(oldData, addData);
    return temp;
};
const filterTreeData = (treeData: any[], excludeIds: Set<any>) => {
  // 递归函数：返回当前层级的有效节点（满足保留条件）
  const recursion = (nodes: any[]) => {
    const layerResult: any[] = [];

    for (const node of nodes) {
      // 第一步：先处理当前节点的子节点（递归过滤）
      let filteredChildren = [];
      if (node.children && node.children.length > 0) {
        filteredChildren = recursion(node.children);
      }

      // 第二步：判断当前节点是否需要保留（核心逻辑）
      const shouldKeepNode = (() => {
        // 情况1：当前节点本身在排除列表 → 直接不保留
        if (excludeIds.has(node.correlationId)) return false;

        // 情况2：当前节点本身不在排除列表
        // 子条件1：节点原本就没有子节点 → 保留
        if (!node.children || node.children.length === 0) return true;
        // 子条件2：节点有子节点，且至少有一个子节点未被过滤 → 保留
        if (filteredChildren.length > 0) return true;
        // 子条件3：节点有子节点，但子节点全被过滤 → 不保留
        return false;
      })();

      // 第三步：根据保留判断结果处理节点
      if (shouldKeepNode) {
        const newNode = { ...node };
        // 只有子节点有有效内容时，才保留children属性
        if (filteredChildren.length > 0) {
          newNode.children = filteredChildren;
        } else {
          delete newNode.children; // 清空空的children属性
        }
        layerResult.push(newNode);
      }
      // 补充：如果当前节点被排除，但有未被过滤的子节点 → 把子节点直接加入当前层级
      else if (filteredChildren.length > 0) {
        layerResult.push(...filteredChildren);
      }
    }

    return layerResult;
  };

  return recursion(treeData);
};
  const dealAddPageData = (data, targetValue, form) => {
    const result = [];
    const traverse = (node) => {
      if (targetValue.includes(node.value)) {
            addAllDescendants(node);
            return true;
        }
        if (node.children) {
            for (const child of node.children) {
                // if (traverse(child)) {
                //     return true;
                // }
                traverse(child)
            }
        }
        return false;
    };
    function addAPropertyRecursively(items:any) {
      for (let i = 0; i < items.length; i++) {
        // let iconVal = form.correlationPage.split(',').length > 1 ? items[i].icon : form.icon;
        let badgeVal = form.correlationPage.split(',').length > 1 ? items[i].badge : form.badge;
        items[i].correlationId = items[i].value
        // items[i].icon = iconVal
        items[i].badge = badgeVal
        if(items[i].children.length>0){
          items[i].creatable = true;
          items[i].portalMenuType = 2;
        }else{
          items[i].creatable = false;
          items[i].portalMenuType = 1;
        }
        // 如果对象有 children 属性且是一个数组
        if (Array.isArray(items[i].children)) {
            // 递归调用函数以处理子项
            addAPropertyRecursively(items[i].children);
        }
      }
    }
    const addAllDescendants = (node) => {
      if(form.correlationPage.split(',').length > 1){

      }else{
        node.label = form.label ? form.label : node.label;
        node.icon = form.icon != undefined ? form.icon : iconVal;
      }
      addAPropertyRecursively([node])
      result.push(node);
    };
    for (const node of data) {
      traverse(node)
        // if (traverse(node)) {
        //     break;
        // }
    }
    return result;
  };

  const dealAddLargeData = (data, targetValue, form) => {
    const result = [];
    const traverse = (node) => {
      if (targetValue.includes(node.value)) {
            addAllDescendants(node);
            return true;
        }
        if (node.children) {
            for (const child of node.children) {
                if (traverse(child)) {
                    return true;
                }
            }
        }
        return false;
    };
    function addAPropertyRecursively(items:any) {
      for (let i = 0; i < items.length; i++) {
        let badgeVal = form.correlationPage.split(',').length > 1 ? items[i].badge : form.badge;
        items[i].correlationId = items[i].value
        items[i].badge = badgeVal
        if(items[i]?.children?.length>0){
          items[i].creatable = true;
          items[i].portalMenuType = 2;
        }else{
          items[i].creatable = false;
          items[i].portalMenuType = 4;
        }
        // 如果对象有 children 属性且是一个数组
        if (Array.isArray(items[i].children)) {
            // 递归调用函数以处理子项
            addAPropertyRecursively(items[i].children);
        }
      }
    }
    const addAllDescendants = (node) => {
      if(form.correlationPage.split(',').length > 1){

      }else{
        node.label = form.label ? form.label : node.label;
        node.icon = form.icon != undefined ? form.icon : iconVal;
      }
      addAPropertyRecursively([node])
      result.push(node);
    };
    for (const node of data) {
      traverse(node)
    }
    return result;
  };
  let addPageData:any = [];
  let addPageSetValData:any = [];
  const dealAddPageSetVal = function(data, correlationPage){
    for(var i=0;i<data.length;i++){
      if(data[i].value == correlationPage) {
        addPageSetValData.push(data[i]);
      } else {
        dealAddPageSetVal(data[i].children, correlationPage)
      }
    }
    return addPageSetValData;
  }
  const addMenu = (val:any) => {
    //type:1 是页面的时候，不能显示+,其余2和3，可以显示+
    //将type 改为 portalMenuType
    temp = [];
    addPageData = [];
    addPageSetValData = [];
    iconVal = '';
    let groupShow = val.length > 0
    let noLargeScreen = props.data.type == 3
    let largeScreen = props.data.type != 3
    const schema = {
      "type": "page",
      "body": {
        "type": "dialog",
        "show": true,
        "title": '新增菜单',
        "onEvent": {
          "confirm": {
            "actions": [
              {
                "actionType": "custom",
                "script": async function (obj:any,doAction, event) {
                  doAction({
                    actionType: "validate", componentId: "new_menu", "outputVar": "validateResult"
                  });
                  setTimeout(() => {
                    let isTure = false
                    if (event.data.validateResult) {
                        if (event.data.validateResult.error == '') {
                            isTure = false
                        } else {
                            isTure = true
                        }
                    }
                    if (isTure) return
                    let form = obj.props.store.form;
                    let portalMenuType = form.portalMenuType;
                    //添加子节点
                    if(val.length > 0){
                      if(portalMenuType==1){ //页面
                        let correlationPage = form.correlationPage.split(',');
                        getCorrelationPage(props.data.type).then(res => {
                          let data = res.data.data;
                          let arr:any = [];
                          arr = dealAddPageData(data, correlationPage, form)
                          let optionsData = [...options];
                          let result = dealAddData(optionsData, arr)
                          //新添加的页面完全存在
                          if(result.length > 0 && result.length == arr.length && result?.children?.length == 0){
                            toast.info('页面已存在', {
                              position: 'top-center'
                            });
                            setAddSchema({})
                            return;
                          } else {
                            //新添加的页面不完全存在
                            let newAdd:any = []
                            if(result.length == 0){ //新添加的页面，不存在菜单导航中
                              newAdd = arr;
                            } else {
                              // for(var i=0;i<result.length;i++){
                              //   newAdd = arr.filter(item => item.correlationId != result[i].correlationId)
                              // }
                              let resultCorrelationIds = new Set(result.map(item => item.correlationId));
                              // 过滤 arr，找出不在 result 中的元素
                              // newAdd = arr.filter(item => !resultCorrelationIds.has(item.correlationId));
                              newAdd = filterTreeData(arr, resultCorrelationIds);
                              if(newAdd.length == 0) {
                                toast.info('页面已存在', {
                                  position: 'top-center'
                                });
                                setAddSchema({})
                                return;
                              }
                            }
                            addChildren(optionsData, val, newAdd);
                            setOptions(optionsData)
                            setAddSchema({})
                          }
                        })
                      } else if(portalMenuType==2){ //目录
                        let arr = [];
                        arr.push({ label:form.label, portalMenuType:2, icon: form.icon, badge: form.badge, value: 'u:' + guid()})
                        let optionsData = [...options];
                        addChildren(optionsData, val, arr);
                        setOptions(optionsData)
                        setAddSchema({})
                      } else if(portalMenuType==3){ //分组
                        let arr = [];
                        arr.push({ label:form.label, portalMenuType:3, value: 'u:' + guid()})
                        let optionsData = [...options];
                        addChildren(optionsData, val, arr);
                        setOptions(optionsData)
                        setAddSchema({})
                      }
                    } else {
                      //添加根节点
                      if(portalMenuType==1){ //页面
                        let correlationPage = form.correlationPage.split(',');
                        getCorrelationPage(props.data.type).then(res => {
                          let data = res.data.data
                          let arr = [];
                          //处理添加数据的格式
                          arr = dealAddPageData(data, correlationPage, form)
                          if(options.length ==0){
                            let lastData = [...arr];
                            setOptions(lastData)
                            setAddSchema({})
                            return;
                          }
                          let result = dealAddData(options, arr)
                          //新添加的页面完全存在
                          if(result.length > 0 && result.length == arr.length && result?.children?.length == 0){
                            toast.info('页面已存在', {
                              position: 'top-center'
                            });
                            setAddSchema({})
                            return;
                          } else {
                            //新添加的页面不完全存在
                            let newAdd:any = []
                            if(result.length == 0){ //新添加的页面，不存在菜单导航中
                              newAdd = arr;
                            } else {
                              // for(var i=0;i<result.length;i++){
                              //   newAdd = arr.filter(item => item.correlationId != result[i].correlationId)
                              // }
                              let resultCorrelationIds = new Set(result.map(item => item.correlationId));
                              // 过滤 arr，找出不在 result 中的元素
                              // newAdd = arr.filter(item => !resultCorrelationIds.has(item.correlationId));
                              newAdd = filterTreeData(arr, resultCorrelationIds);
                              if(newAdd.length == 0) {
                                toast.info('页面已存在', {
                                  position: 'top-center'
                                });
                                setAddSchema({})
                                return;
                              }
                            }
                            let lastData = [...options,...newAdd];
                            setOptions(lastData)
                            setAddSchema({})
                          }
                        })
                      } else if(portalMenuType==2){ //目录
                        let arr = [];
                        arr.push({ label:form.label, portalMenuType:2, icon: form.icon, badge: form.badge, value: 'u:' + guid()})
                        let lastData = [...options,...arr]; //options.concat(arr)
                        setOptions(lastData)
                        setAddSchema({})
                      } else if(portalMenuType==3){ //分组
                        let arr = [];
                        arr.push({ label:form.label, portalMenuType:3, value: 'u:' + guid()})
                        let lastData = [...options,...arr];
                        setOptions(lastData)
                        setAddSchema({})
                      } else if (portalMenuType==4) { //大屏
                        let correlationPage = form.correlationPage.split(',');
                        getCorrelationLarge().then(res => {
                          let data = res.data.data
                          data.forEach(i=>{
                            i.label = i.projectName
                            i.value = i.queryKey
                          })
                          let arr = [];
                          //处理添加数据的格式
                          arr = dealAddLargeData(data, correlationPage, form)
                          if(options.length ==0){
                            let lastData = [...arr];
                            setOptions(lastData)
                            setAddSchema({})
                            return;
                          }
                          let result = dealAddData(options, arr)
                          //新添加的页面完全存在
                          if(result.length > 0 && result.length == arr.length && result?.children?.length == 0){
                            toast.info('大屏已存在', {
                              position: 'top-center'
                            });
                            setAddSchema({})
                            return;
                          } else {
                            //新添加的页面不完全存在
                            let newAdd:any = []
                            if(result.length == 0){ //新添加的页面，不存在菜单导航中
                              newAdd = arr;
                            } else {
                              let resultCorrelationIds = new Set(result.map(item => item.correlationId));
                              // 过滤 arr，找出不在 result 中的元素
                              // newAdd = arr.filter(item => !resultCorrelationIds.has(item.correlationId));
                              newAdd = filterTreeData(arr, resultCorrelationIds);
                              if(newAdd.length == 0) {
                                toast.info('页面已存在', {
                                  position: 'top-center'
                                });
                                setAddSchema({})
                                return;
                              }
                            }
                            let lastData = [...options,...newAdd];
                            setOptions(lastData)
                            setAddSchema({})
                          }
                        })
                      }
                    }
                  },10)
                },
              }
            ]
          },
          'cancel': {
            "actions": [
              {
                "actionType": "custom",
                "script": async function () {
                  setAddSchema({})
                }
              }
            ]
          },
        },
        "body": [{
          "type": "form",
          "id": "new_menu",
          "body": [{
            "type": "select",
            "name": "portalMenuType",
            "label": "菜单类型",
            "required": true,
            "options": [
              {
                "label": "页面",
                "value": 1,
                "hidden": noLargeScreen
              },
              {
                "label": "目录",
                "value": 2,
                "hidden": noLargeScreen ? noLargeScreen : isApp
              },
              {
                "label": "分组",
                "value": 3,
                "hidden": noLargeScreen ? noLargeScreen : groupShow
              },
              {
                "label": "大屏",
                "value": 4,
                "hidden": largeScreen
              }
            ]
          },
          {
            "label": "关联大屏",
            "type": "tree-select",
            "name": "correlationPage",
            "required": true,
            "selectMode": "chained",
            "multiple": true,
            "clearable": true,
            "visibleOn": "this.portalMenuType == 4",
            "labelField": "projectName",
            "valueField": "queryKey",
            "source": {
              "method": "get",
              "url": useDevBaseUrl("/api/goview/project/getListData"),
              adaptor: function (payload: any) {
                  return {
                      ...payload,
                      status: payload.code,
                      data: { ...payload.data, options: payload.data }
                  };
              },
            }
          },
          {
            "label": "关联页面",
            "type": "tree-select",
            "name": "correlationPage",
            "required": true,
            "selectMode": "chained",
            "multiple": true,
            "clearable": true,
            "visibleOn": "this.portalMenuType == 1",
            "source": {
              "method": "get",
              "url": useDevBaseUrl("/app/portal/getAssociatePage?type="+props.data.type),
              adaptor: function (payload: any) {
                if(isApp) {
                  payload.data = payload.data.filter(i=>i.sourceType == 'page')
                }
                return {
                  ...payload,
                  status: payload.code,
                  data: { ...payload.data, options: payload.data }
                };
              },
            },
            "onEvent": {
              "change": {
                "actions": [
                  {
                    "actionType": "custom",
                    script: function (_, doAction, event) {
                      addPageSetValData = [];
                      const correlationPage = event.data.correlationPage;
                      if(correlationPage.split(',').length == 1){
                        const options = event.data.items
                        let data = dealAddPageSetVal(options, correlationPage)
                        // let data = options.filter(item=>item.value == correlationPage)
                        setTimeout(() => {
                          iconVal = data[0].icon ? data[0].icon : '';
                          doAction({
                            actionType: "setValue",
                            componentId: "menuName",
                            "args": {
                                "value": data[0].menuName ? data[0].menuName : data[0].label,
                            }
                          });
                          doAction({
                            actionType: "setValue",
                            componentId: "menuBadge",
                            "args": {
                                "value": data[0].badge,
                            }
                          });
                        }, 300)
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            "type": "input-text",
            "name": "label",
            "label": "名称",
            "required": true,
            "placeholder": "请输入名称",
            "showCounter": true,
            "maxLength": 20,
            "visibleOn": "this.portalMenuType == 2",
          },
          {
            "type": "input-text",
            "name": "label",
            "label": "菜单名称",
            "id": "menuName",
            "placeholder": "请输入名称",
            "showCounter": true,
            "maxLength": 20,
            "visibleOn": "this.correlationPage.split(',').length==1 && this.portalMenuType != 4",
          },
          {
            "name": "icon",
            "label": "菜单图标",
            "id": "menuIcon",
            "asFormItem": true,
            "desc": "导航中的图标，默认在左侧。留空则折叠侧边栏时显示内容为空",
            "visibleOn": "this.portalMenuType == 2 || ((this.correlationPage.split(',')).length==1 && this.portalMenuType != 4)",
            "children": ({
              value,
              onChange,
              data
            }) => (
              <div>
                <IConSelect sendValueToFather={(item) => onChange(item)} value={iconVal} />
              </div>
            ),
          },
          {
            "type": "input-text",
            "name": "badge",
            "label": "菜单角标",
            "id": "menuBadge",
            "showCounter": true,
            "maxLength": 10,
            "placeholder": "请输入",
            "desc": "为空则不显示角标，需在菜单导航设置中启用角标后才生效",
            "visibleOn": "(this.portalMenuType == 2 && this.portalMenuType != 4) || ((this.correlationPage.split(',')).length==1 && this.portalMenuType !=4 )",
          },
          // {
          //   "type": "switch",
          //   "name": "homePage",
          //   "label": "设为首页",
          //   "id": "menuHomePage",
          //   "trueValue": 1,
          //   "falseValue": 0,
          //   "visibleOn": "this.correlationPage.split(',').length==1",
          // },
          {
            "type": "input-text",
            "name": "label",
            "label": "名称",
            "required": true,
            "placeholder": "请输入名称",
            "showCounter": true,
            "maxLength": 20,
            "visibleOn": "this.portalMenuType == 3",
          },]
        }
        ]
      }
    }
    setAddSchema(schema)
  }
  //处理删除时有id的数据
  const dealDeleteData = function(treeData:any, id:any ){
    for(var i = treeData.length ; i > 0 ; i--){
      if(treeData[i-1].id == id){
        treeData.splice(i-1,1);
      }else{
        if(treeData[i-1].children){
          dealDeleteData(treeData[i-1].children,id)
        }
      }
    }
  }
  //处理删除时没有id的数据，用label
  const dealDelData = function(treeData:any, value:any ){
    for(var i = treeData.length ; i > 0 ; i--){
      if(treeData[i-1].value == value){
        treeData.splice(i-1,1);
      }else{
        if(treeData[i-1].children){
          dealDelData(treeData[i-1].children,value)
        }
      }
    }
  }
  const onDelete = function(i){
    confirm("确认删除菜单「"+i.label+"」?", '删除菜单确认','确认','取消').then(async(res) =>{
      if(res){
        const listData = [...options];
        let id = i.id; //改成id 是因为分组和目录没有correlationId,页面有correlationId和id，所以统一用id
        if(id){
          dealDeleteData(listData, id)
          setOptions(listData)
        } else {
          //添加后直接删除，没有保存，所以没有id,用value
          dealDelData(listData, i.value)
          setOptions(listData)
        }
      }
    })
  };
  //编辑时，处理数据， 将编辑的那条数据用新的替换掉-页面、目录和分组情况
  const dealEditData = function(treeData:any, id:any, obj:any ){
    for(var i = treeData.length ; i > 0 ; i--){
      if((treeData[i-1].id && treeData[i-1].id == id) || (treeData[i-1].value && treeData[i-1].value == id) || (treeData[i-1].correlationId && treeData[i-1].correlationId == id)){
        treeData[i-1] = obj;
      }else{
        if(treeData[i-1]?.children){
          dealEditData(treeData[i-1].children,id,obj)
        }
      }
    }
  }
  //编辑菜单时，处理首页下其他页面
  const dealCorrelationPageData = function(data:any, correlationPage:any, arr:any, form:any){
    for(var i=0;i<data.length;i++){
      if(data[i].value == correlationPage) {
        // arr.push({correlationId: data[i].value, sourceType:  data[i].sourceType, label: form.label, type:1, homePage: form.homePage, icon: form.icon, badge: form.badge})

        if(data[i]?.children?.length > 0){
          arr.push({correlationId: data[i].value, sourceType:  data[i].sourceType, label: form.label ? form.label : data[i].label, portalMenuType:1, creatable: true, icon: form.icon, badge: form.badge})
        } else {
          arr.push({correlationId: data[i].value, sourceType:  data[i].sourceType, label: form.label ? form.label : data[i].label, portalMenuType:1, creatable: false, icon: form.icon, badge: form.badge})
        }
      } else {
        if(data[i].children){
          dealCorrelationPageData(data[i].children, correlationPage, arr, form)
        }
      }
    }
  }
   //编辑菜单时，处理首页下其他页面-大屏
  const dealCorrelationLargeData = function(data:any, correlationPage:any, arr:any, form:any){
    for(var i=0;i<data.length;i++){
      if(data[i].value == correlationPage) {
        if(data[i]?.children?.length > 0){
          arr.push({correlationId: data[i].value, sourceType: data[i].sourceType, label: form.label ? form.label : data[i].label, portalMenuType:4, creatable: true, icon: form.icon, badge: form.badge})
        } else {
          arr.push({correlationId: data[i].value, sourceType: data[i].sourceType, label: form.label ? form.label : data[i].label, portalMenuType:4, creatable: false, icon: form.icon, badge: form.badge})
        }
      } else {
        if(data[i]?.children){
          dealCorrelationLargeData(data[i].children, correlationPage, arr, form)
        }
      }
    }
  }
  //编辑菜单，关联页面， 有一个children:[],需过滤掉，不然组件选不中数据
  const dealNullChildren = function(data:any){
    for(var i=0;i<data.length;i++){
      if(data[i].children.length ==0) {
        delete data[i].children
      } else {
        if(data[i].children){
          dealNullChildren(data[i].children)
        }
      }
    }
  }
  const onEdit = function(value: any){
    editMenu(value)
  };
  const editMenu = (val:any) => {
    const schema = {
      "type": "page",
      "data": {
        "result": val
      },
      "body": {
        "type": "dialog",
        "show": true,
        "title": '编辑菜单',
        "size": "md",
        "onEvent": {
          "confirm": {
            "actions": [
              {
                "actionType": "custom",
                "script": async function (obj:any,doAction, event) {
                  doAction({
                    actionType: "validate", componentId: "edit_menu", "outputVar": "validateResult"
                  });
                  setTimeout(async() => {
                    let isTure = false
                    if (event.data.validateResult) {
                        if (event.data.validateResult.error == '') {
                            isTure = false
                        } else {
                            isTure = true
                        }
                    }
                    if (isTure) return
                    // let id = val.correlationId;
                    // let id = val.id ? val.id : val.value;
                    let id = ''
                    if (val.id) {
                      id = val.id
                    } else if (val.value) {
                      id = val.value
                    } else {
                      id = val.correlationId
                    }
                    let form = obj.props.store.form;
                    let portalMenuType = form.portalMenuType;
                    if(portalMenuType==1){ //页面
                      let correlationPage = form.correlationId;
                      let res = await getCorrelationPage(props.data.type);
                      let data = res.data.data.flat(Infinity)
                      let arr:any = [];
                      dealCorrelationPageData(data, correlationPage, arr,form)
                      if(form?.__super?.result?.children?.length > 0){
                        arr[0].children = form.__super.result.children;
                      }
                      let listData = [...options];
                      let result = dealAddData(listData, arr)
                      //新添加的页面完全存在
                      if(result.length > 0 && result.length == arr.length && result?.children?.length == 0){
                        toast.info('页面已存在', {
                          position: 'top-center'
                        });
                        setEditSchema({})
                        return;
                      } else {
                        dealEditData(listData, id, arr[0])
                        setOptions(listData)
                        setEditSchema({})
                      }
                    }else if(portalMenuType==2){ //目录
                      let arr = [];
                      arr.push({ label:form.label, portalMenuType:2, icon: form.icon, badge: form.badge})
                      if(form?.__super?.result?.children?.length > 0){
                        arr[0].children = form.__super.result.children;
                      }
                      const listData = [...options];
                      dealEditData(listData, id, arr[0])
                      setOptions(listData)
                      setEditSchema({})
                    } else if(portalMenuType==3){ //分组
                      let arr = [];
                      arr.push({ label:form.label, portalMenuType:3})
                      if(form?.__super?.result?.children?.length > 0){
                        arr[0].children = form.__super.result.children;
                      }
                      const listData = [...options];
                      dealEditData(listData, id, arr[0])
                      setOptions(listData)
                      setEditSchema({})
                    } else if (portalMenuType==4) { //大屏
                      let correlationPage = form.correlationId;
                      let res = await getCorrelationLarge();
                      let data = res.data.data.flat(Infinity)
                      data.forEach(i=>{
                        i.label = i.projectName
                        i.value = i.queryKey
                      })
                      let arr:any = [];
                      dealCorrelationLargeData(data, correlationPage, arr,form)
                      if(form?.__super?.result?.children?.length > 0){
                        arr[0].children = form.__super.result.children;
                      }
                      let listData = [...options];
                      dealEditData(listData, id, arr[0])
                      setOptions(listData)
                      setEditSchema({})
                    }
                  },10)

                },
              }
            ]
          },
          'cancel': {
            "actions": [
              {
                "actionType": "custom",
                "script": async function () {
                  setEditSchema({})
                }
              }
            ]
          },
        },
        "body": [{
          "type": "form",
          "id": "edit_menu",
          "body": [{
            "type": "select",
            "name": "portalMenuType",
            "label": "菜单类型",
            "required": true,
            "disabled": true,
            "options": [
              {
                "label": "页面",
                "value": 1
              },
              {
                "label": "目录",
                "value": 2
              },
              {
                "label": "分组",
                "value": 3
              },
              {
                "label": "大屏",
                "value": 4
              }
            ],
            "value": "${result.portalMenuType}"
          },
          {
            "label": "关联大屏",
            "type": "tree-select",
            "name": "correlationId",
            "required": true,
            "selectMode": "chained",
            "multiple": false,
            "clearable": true,
            "visibleOn": "this.portalMenuType == 4",
            "labelField": "projectName",
            "valueField": "queryKey",
            "source": {
              "method": "get",
              "url": useDevBaseUrl("/api/goview/project/getListData"),
              adaptor: function (payload: any) {
                  return {
                      ...payload,
                      status: payload.code,
                      data: { ...payload.data, options: payload.data }
                  };
              },
            },
            "value": "${result.correlationId}"
          },
          {
            "label": "关联页面",
            "type": "tree-select",
            "name": "correlationId",
            "required": true,
            "selectMode": "chained",
            "multiple": false,
            "clearable": true,
            "visibleOn": "this.portalMenuType == 1",
            "source": {
              "method": "get",
              "url": useDevBaseUrl("/app/portal/getAssociatePage?type="+props.data.type),
              adaptor: function (payload: any) {
                dealNullChildren(payload.data)
                if(isApp) {
                  payload.data = payload.data.filter(i=>i.sourceType == 'page')
                }
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, options: payload.data }
                };
              },
            },
            "value": "${result.correlationId}"
          },
          {
            "type": "input-text",
            "name": "label",
            "label": "名称",
            "required": true,
            "placeholder": "请输入名称",
            "showCounter": true,
            "maxLength": 20,
            "visibleOn": "this.portalMenuType == 2",
            "value": "${result.label}"
          },
          {
            "type": "input-text",
            "name": "label",
            "label": "菜单名称",
            "placeholder": "请输入名称",
            "showCounter": true,
            "maxLength": 20,
            "value": "${result.label}",
            "visibleOn": "this.portalMenuType == 1",
          },
          {
            "name": "icon",
            "label": "菜单图标",
            "asFormItem": true,
            "desc": "导航中的图标，默认在左侧。留空则折叠侧边栏时显示内容为空",
            "children": ({
              value,
              onChange,
              data
            }) => (
              <div>
                <IConSelect sendValueToFather={(item) => onChange(item)} value={value}/>
              </div>
            ),
            "value": "${result.icon}",
            "visibleOn": "this.portalMenuType == 1 || this.portalMenuType == 2",
          },
          {
            "type": "input-text",
            "name": "badge",
            "label": "菜单角标",
            "showCounter": true,
            "maxLength": 10,
            "placeholder": "请输入",
            "desc": "为空则不显示角标，需在菜单导航设置中启用角标后才生效",
            "value": "${result.badge}",
            "visibleOn": "this.portalMenuType == 1 || this.portalMenuType == 2",
          },
          // {
          //   "type": "switch",
          //   "name": "homePage",
          //   "label": "设为首页",
          //   "trueValue": 1,
          //   "falseValue": 0,
          //   "value": "${result.homePage}",
          //   "visibleOn": "this.type == 1",
          // },
          {
            "type": "input-text",
            "name": "label",
            "label": "名称",
            "required": true,
            "placeholder": "请输入名称",
            "showCounter": true,
            "maxLength": 20,
            "visibleOn": "this.portalMenuType == 3",
            "value": "${result.label}"
          }]
        }]
      }
    }
    setEditSchema(schema)
  }
  const dealMoveData = function(data:any, dragNode:any, node:any, position:any){
    let dragNodeId = dragNode.id; // 移动的
    let nodeId = node.id; //目标的
    //删除掉的
    let delItem = {}
    const dealMovedData = (data) =>{
      for(var i=0; i< data.length; i++){
        if(dragNode.id && data[i].id == dragNodeId){
          delItem = data[i]
          data.splice(i,1)
        } else if(dragNode.value && data[i].value == dragNode.value){
          delItem = data[i]
          data.splice(i,1)
        } else {
          if(data[i]?.children?.length > 0){
            dealMovedData(data[i].children)
          }
        }
      }
    }
    dealMovedData(data)
    //添加的
    const addMovedData = (data) =>{
      for(var i=0; i< data.length; i++){
        if(node.id && data[i].id == nodeId){
          if(position == 'bottom'){
            data.splice(i+1, 0, delItem);
          } else {
            data.splice(i, 0, delItem);
          }
          return
        } else if(node.value && data[i].value == node.value){
          if(position == 'bottom'){
            data.splice(i+1, 0, delItem);
          } else {
            data.splice(i, 0, delItem);
          }
          return
        } else {
          if(data[i]?.children?.length > 0){
            addMovedData(data[i].children)
          }
        }
      }
    }
    addMovedData(data)
  }
  const onMove = function(dropInfo:any){
    let dragNode = dropInfo.dragNode; //移动的节点
    let node = dropInfo.node; //目标节点
    let position = dropInfo.position;
    let listAllData = [...options];
    dealMoveData(listAllData, dragNode, node, position)
    setOptions(listAllData)
  };
  const onClearAll = function(){
    confirm("确认删除当前所有菜单?", '删除菜单确认','确认','取消').then(async(res) =>{
      if(res){
        setOptions([])
      }
    })
  }
  const onSet = function(){
    setSetting(true)
  };
  const setMenu = () => {
    const schema = {
      "type": "page",
      "body": {
        "type": "dialog",
        "title": '更多设置',
        "onEvent": {
          "confirm": {
            "actions": [
              {
                "actionType": "custom",
                "script": async function (obj:any) {
                  let form = obj.props.store.form;
                  let enableBadge = form.enableBadge;
                  let badgeCategory = form.badgeCategory;
                  let badgePosition = form.badgePosition;
                  let badgeSIze = form.badgeSIze;
                  let badgeTheme = form.badgeTheme;
                  let badgeOffsetX = form.badgeOffsetX;
                  let badgeOffsetY = form.badgeOffsetY;
                  let maxNum = form.maxNum;
                  let commonBadge = {}
                  if(badgeCategory == 1 || badgeCategory == 3){
                    commonBadge = {
                      enableBadge: enableBadge,
                      badgeCategory: badgeCategory,
                      badgePosition: badgePosition,
                      badgeSIze: badgeSIze,
                      badgeTheme: badgeTheme,
                      badgeOffsetX: badgeOffsetX,
                      badgeOffsetY: badgeOffsetY,
                    }
                  } else if(badgeCategory == 2){
                    commonBadge = {
                      enableBadge: enableBadge,
                      badgeCategory: badgeCategory,
                      badgePosition: badgePosition,
                      maxNum: maxNum,
                      badgeSIze: badgeSIze,
                      badgeTheme: badgeTheme,
                      badgeOffsetX: badgeOffsetX,
                      badgeOffsetY: badgeOffsetY,
                    }
                  }
                  let arr = [];
                  arr.push({ commonBadge:commonBadge})
                  let lastData = [...options,...arr];
                  // setOptions(lastData)
                  setSetting(false)
                },
              }
            ]
          },
          'cancel': {
            "actions": [
              {
                "actionType": "custom",
                "script": async function () {
                  setSetting(false)
                }
              }
            ]
          },
        },
        "body": [{
          "type": "form",
          "body": [
          {
            "type": "switch",
            "name": "enableBadge",
            "label": "启用角标",
            "trueValue": 1,
            "falseValue": 0
          },
          {
            "name": "badgeCategory",
            "type": "radios",
            "label": "角标类型",
            "required": true,
            "visibleOn": "this.enableBadge == 1",
            "selectFirst": true,
            "options": [
              {
                "label": "点",
                "value": "1"
              },
              {
                "label": "文字",
                "value": "2"
              },
              {
                "label": "绸缎",
                "value": "3"
              },
            ]
          },
          {
            "type": "input-text",
            "name": "maxNum",
            "label": "封顶数字",
            "required": true,
            "placeholder": "请输入名称",
            "visibleOn": "this.badgeCategory == 2",
            "value": 99,
          },
          {
            "type": "input-text",
            "name": "badgeSize",
            "label": "角标大小",
            "required": true,
            "placeholder": "请输入名称",
            "suffix": "px",
            "visibleOn": "this.enableBadge == 1",
          },
          {
            "type": "select",
            "name": "badgeTheme",
            "label": "角标主题",
            "required": true,
            "visibleOn": "this.enableBadge == 1",
            "value": 1,
            "options": [
              {
                "label": "危险",
                "value": 1
              },
              {
                "label": "提示",
                "value": 2
              },
            ]
          },
          {
            "type": "select",
            "name": "badgePosition",
            "label": "角标位置",
            "visibleOn": "this.enableBadge == 1",
            "required": true,
            "value": 1,
            "options": [
              {
                "label": "右上脚",
                "value": 1
              },
              {
                "label": "右下角",
                "value": 2
              },
              {
                "label": "左上脚",
                "value": 3
              },
              {
                "label": "左下角",
                "value": 4
              },
            ]
          },
          {
            "type": "container",
            "className": "portal_badge",
            "body": [
              {
                "type": "input-text",
                "name": "badgeOffsetX",
                "label": "偏移量",
                "visibleOn": "this.enableBadge == 1",
                "addOn": {
                    "type": "button",
                    "label": "X",
                    "position": "left"
                },
                "required": true,
                "value": 0,
            },
            {
              "type": "input-text",
              "name": "badgeOffsetY",
              "visibleOn": "this.enableBadge == 1",
              "label": "",
              "className": "portal_badge_Y",
              "addOn": {
                  "type": "button",
                  "label": "Y",
                  "position": "left"
              },
              "required": true,
              "value": 0,
            }]
          }]
        }]
      }
    }
    return (
      <div style={{ height: '88vh' }}>
        {amisRender(schema,{}, {
          fetcher: service,
          theme: amisEnv.theme
        })}
      </div>
    )
  }
  const onChange = function(){}
  return (
      <>
      <div>
        <div className='menu'>
          <div className = 'menu_title'>
            <span className = 'menu_title_left'>菜单</span>
            <div className = 'menu_set'>
              <a onClick={onAdd}>添加</a>
              <a onClick={onClearAll}>清空</a>
              {/* <a onClick={onSet}>设置</a> */}
            </div>
          </div>
          {
            options?.length > 0 &&
            <TreeSelector
              className = "menu_tree"
              options = {options}
              draggable = {true}
              createTip = {'新增菜单'}
              creatable = {true}
              rootCreatable = {false}
              removable = {true}
              editable = {true}
              onAdd = {onAdd}
              onDelete = {onDelete}
              onEdit = {onEdit}
              onMove = {onMove}
              onChange = {onChange}
            />
          }
          {
            options?.length == 0 && <div>
              <div className="menuList_null_info">暂无菜单，<a onClick={onAdd}>立即创建</a></div>
            </div>
          }
        </div>
        <span className="menuList_info">菜单为空将使用应用菜单</span>
        <div>
          {amisRender(addSchema,{}, {
            fetcher: service,
            theme: amisEnv.theme
          })}
        </div>
        <div>
          {amisRender(editSchema,{}, {
            fetcher: service,
            theme: amisEnv.theme
          })}
        </div>
        {
          setting ? setMenu() :  null
        }
      </div>
      </>
  )
}

export default MenuList;

