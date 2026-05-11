import React, {useState, useEffect, useRef} from 'react';
import { getResourceList, getResourceDetail, saveResourcePermissions } from '@/api/member';
import {Spin} from 'antd';
import {toast, confirm, render as amisRender} from 'amis';
import ResourceDetail from './ResourceDetail';
import permStore from "@/store/permission"
import { service } from "@/utils/request"
import {env as amisEnv} from '@/hooks/amis';
const Resource: React.FC = props => {
  const hide = props?.hide ? props?.hide : false
  const [resourceNum, setResourceNum] = useState(0); // 当前第几行被选中
  const [resourceId, setResourceId] = useState(1); //当前被选中资源列表的id 保存的时候使用
  const [resourceType, setResourceType] = useState('Page'); //当前被选中资源列表的type
  const [resourceListData, setResourceListData] = useState([]); //资源列表数据
  const [resourceListDetailData, setResourceListDetailData] = useState([]); //资源详情数据
  const resourceIdVal = useRef();
  const resourceTypeVal = useRef('');
  const [loading, setLoading] = useState(true);
  const [isChangeData, setIsChangeData] = useState(false);
  const everyData = useRef(); //当前获得的所有资源详情的数据
  //保存按钮是否显示
  const [saveBtn, setSaveBtn] = useState(false);
  //查询权限
  const [query, setQuery] = useState(false);
  let allQueryKey: any = []; //todo 需要清空
  // 子组件选择数据
  const valueChange = () => {
    setIsChangeData(true);
  };
  // 资源列表点击
  const changeResourceList = (item: any, index: any) => {
    var sessionKeys = Object.keys(sessionStorage);
    if (isChangeData) {
      confirm(
        '您当前有未保存的修改，切换后数据会丢失，是否切换？',
        '系统消息',
        '确认',
        '取消'
      ).then(async res => {
        if (res) {
          setResourceId(item.value);
          for (var i = 0; i < sessionKeys.length; i++) {
            if (!sessionKeys[i].includes('-')) {
              sessionStorage.removeItem(sessionKeys[i]);
            }
          }
          setIsChangeData(false);
          await resourceDetail(item.type, props.data.id);
          setResourceNum(index);
          setResourceType(item.type);
          //点击确认，就是到下个资源上，需清空缓存等
          allQueryKey = [];
        }
      });
    } else {
      setResourceId(item.value);
      setResourceNum(index);
      setResourceType(item.type);
      resourceDetail(item.type, props.data.id);
    }
  };
  //获取资源列表数据
  const resourceList = async () => {
    let res = await getResourceList();
    setResourceListData(res.data.data);
    if(res.data.data && res.data.data[0].type){
      setResourceType(res.data.data[0].type);
    }
  };
  //获取资源详情数据
  const resourceDetail = async (type: any, id: any) => {
    setLoading(true);
    let res = await getResourceDetail(type, id);
    if(res.data.code != 0) {
      toast.error(res.data.msg, {
        position: 'top-right'
      });
      setLoading(false);
      setResourceListDetailData([]);
      return
    }
    setResourceListDetailData(res.data.data);
    everyData.current = res.data.data;
    setLoading(false);
  };
  //处理详情数据-为保存使用
  const dealDetailData = (detailData: any) => {
    for (var i = 0; i < detailData?.length; i++) {
      allQueryKey.push(detailData[i].value);
      if (detailData[i].children) {
        dealDetailData(detailData[i].children);
      }
    }
    return allQueryKey;
  };

  // 工具函数：判断两个数组是否完全一致（长度+每一项都相同）
  const isArrayEqual = (arr1, arr2) => {
      // 先判断长度是否一致，不一致直接返回false
      if (arr1.length !== arr2.length) return false;
      // 遍历每一项，判断是否完全匹配
      return arr1.every((item, index) => item === arr2[index]);
  };

  // 核心逻辑：筛选出有变化的键值对
  const getChangedData = (originObj, newObj) => {
    const changedData = {};
    // 遍历newObj（save）的所有键
    Object.keys(newObj).forEach(key => {
        // 若originObj（result）中无该键，视为值变化（实际你的场景中键是一一对应的）
        const originVal = originObj[key] || [];
        const newVal = newObj[key];
        // 数组不一致则收集该键值对
        if (!isArrayEqual(originVal, newVal)) {
            changedData[key] = newVal;
        }
    });
    return changedData;
  };
  //页面最终的保存配置
  const saveResourceCfg = async () => {
    let allData = dealDetailData(everyData.current);
    let paramCfg = [];
    for (var i = 0; i < allData.length; i++) {
      if (sessionStorage.getItem(allData[i])){
        let allVal = sessionStorage.getItem(allData[i])?.split(',');
        let params = {
          "memberLevelId": props.data.id,
          "resourceType": resourceIdVal.current,
          "correlationId": allData[i],
          "aclType": allVal
        };
        paramCfg.push(params);
      } else {
        let params = {
          "memberLevelId": props.data.id,
          "resourceType": resourceIdVal.current,
          "correlationId": allData[i],
          "aclType": []
        };
        paramCfg.push(params);
      }
    }
    let saveArr = []
    for (var n=0;n<paramCfg.length;n++) {
      saveArr.push({
        [paramCfg[n].correlationId]: paramCfg[n]?.aclType
      })
    }
    const saveObj:any = {};
    saveArr.forEach(item => {
      const key = Object.keys(item)[0];
      saveObj[key] = item[key];
    });
    const resultObj = JSON.parse(sessionStorage.getItem('memberResResult')!)
    // 获取需要下发的变化数据
    const dataToSend = getChangedData(resultObj, saveObj);
    const objKeys = new Set(Object.keys(dataToSend));
    const filteredParamCfg = paramCfg.filter(item => objKeys.has(item.correlationId));
    setLoading(true);
    let res = await saveResourcePermissions(filteredParamCfg);
    if (res.data.code == 0) {
      //保存成功
      toast.success('保存成功', {
        position: 'top-center'
      });
      setIsChangeData(false);
      allQueryKey = [];
      // await resourceDetail(resourceTypeVal.current, props.data.id);
      // setLoading(false);
    }
  };

  useEffect(() => {
    resourceIdVal.current = resourceId;
  }, [resourceId]);

  useEffect(() => {
    resourceTypeVal.current = resourceType;
  }, [resourceType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let $$permissionsData = permStore.getState().permData;
        let filterQuery = $$permissionsData.filter(item => item == 'devApp:resourcePermission:query')
        const queryFlag = filterQuery.length > 0 ? true : false; //查询
        setQuery(queryFlag)
        let filterUpdate = $$permissionsData.filter(item => item == 'devApp:resourcePermission:update')
        const updateFlag = filterUpdate.length > 0 ? true : false; //保存
        setSaveBtn(updateFlag)
        await resourceList();
        await resourceDetail(resourceTypeVal.current, props.data.id);
        setLoading(false);
      } catch (error) {
        // 处理错误
        console.error('请求出错:', error);
      }
    };
    fetchData()
  }, []);
  const btn = () => {
    return {
      "type": "submit",
      "label": "提交",
      "level": "primary",
      "onEvent": {
        "click": {
          "actions": [
            {
              "actionType": "custom",
              "script": async function (context: any, doAction: any, event: any) {
                await saveResourceCfg();
                doAction({
                  actionType: "closeDialog",
                  componentId: "levelConfig",
                });
              }
            }
          ]
        }
      }
    }
  }
  return (
    <>
      <div>
        <Spin spinning={loading}>
          <div className="ResourceAcl_Config">
            <div className="resource_list">
              <div className="role_list_title">资源列表</div>
              {resourceListData &&
                resourceListData.map((item, index) => {
                  return (
                    <div
                      key={index}
                      onClick={() => changeResourceList(item, index)}
                      className={`role_list_listitem ${
                        index == resourceNum ? 'isActive' : ''
                      }`}
                    >
                      {item.label}
                    </div>
                  );
                })}
            </div>
            <div className="resource_detail">
              <div className="role_list_title"> 资源详情</div>
              <ResourceDetail
                detailData={resourceListDetailData}
                resourceType={resourceType}
                setResourceListDetailData={setResourceListDetailData}
                resourceDetail={resourceDetail}
                childChange={valueChange}
                query={query}
                hide={hide}
              />
            </div>
          </div>
          <div className="ResourceAcl_Config_Save">
            {saveBtn && amisRender(
                btn(),
                  {},
                  {
                    fetcher: service,
                    theme: amisEnv.theme
                  }
              )}
          </div>
        </Spin>
      </div>
    </>
  );
};

export default Resource;
