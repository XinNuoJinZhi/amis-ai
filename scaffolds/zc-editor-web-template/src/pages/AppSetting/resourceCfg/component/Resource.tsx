import React, {useState, useEffect, useRef} from 'react';
import {
  getRoleList,
  getRoleListApp,
  getResourceList,
  getResourceDetail,
  getResourceDetailApp,
  saveResourcePermissions,
  saveResourcePermissionsApp
} from '@/api/acl';
import {Spin} from 'antd';
import {toast, confirm, render as amisRender} from 'amis';
import ResourceDetail from './ResourceDetail';
import { isAppEnd, isEditorialEnd } from '@/utils/index'
import permStore from "@/store/permission"
import { service } from "@/utils/request"
import {env as amisEnv} from '@/hooks/amis';
const Resource: React.FC = props => {
  const [resourceNum, setResourceNum] = useState(0); // 当前第几行被选中
  const [resourceId, setResourceId] = useState(1); //当前被选中资源列表的id 保存的时候使用
  const [resourceType, setResourceType] = useState('Page'); //当前被选中资源列表的type
  const [roleNum, setRoleNum] = useState(0); // 当前第几行被选中
  const [roleId, setRoleId] = useState(); // 当前被选中角色列表的id
  const [roleCode, setRoleCode] = useState(); // 当前被选中角色列表的code
  const [roleListData, setRoleListData] = useState([]); //角色列表数据
  const [resourceListData, setResourceListData] = useState([]); //资源列表数据
  const [resourceListDetailData, setResourceListDetailData] = useState([]); //资源详情数据
  const roleIdVal = useRef();
  const resourceIdVal = useRef();
  const roleCodeVal = useRef();
  const resourceTypeVal = useRef('');
  const allUserIdVal = useRef();
  const [loading, setLoading] = useState(true);
  const [isChangeData, setIsChangeData] = useState(false);
  const everyData = useRef(); //当前获得的所有资源详情的数据
  const lastData = useRef(); //当前获得的资源详情的数据-为了对比数据
  //保存按钮是否显示
  const [saveBtn, setSaveBtn] = useState(false);
  //新建自定义按钮是否显示
  const [newCBtn, setNewCBtn] = useState(false);
  //更新自定义按钮是否显示
  const [updateCBtn, setUpdateCBtn] = useState(false);
  //删除自定义按钮是否显示
  const [delCBtn, setDelCBtn] = useState(false);
  //查询权限
  const [query, setQuery] = useState(false);
  let allQueryKey: any = []; //todo 需要清空
  let backData: any = []; //todo 需要清空
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
            if (sessionKeys[i].includes('-')) {
              sessionStorage.removeItem(sessionKeys[i]);
            }
          }
          setIsChangeData(false);
          await resourceDetail(item.type, roleId, roleCodeVal.current);
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
      resourceDetail(item.type, roleId, roleCodeVal.current);
    }
  };
  // 获取所有的已选择
  const getAllChecked = e => {
    e.forEach(element => {
      if(element.acl.value.length>0){
        sessionStorage.setItem(roleIdVal.current +'-'+ element.value, element.acl.value);
      }
      if (element.children) {
        getAllChecked(element.children);
      }
    });
  };
  // 角色列表点击
  const changeRoleList = (item: any, index: any) => {
    var sessionKeys = Object.keys(sessionStorage);
    if (isChangeData) {
      confirm(
        '您当前有未保存的修改，切换后数据会丢失，是否切换？',
        '系统消息',
        '确认',
        '取消'
      ).then(async res => {
        if (res) {
          for (var i = 0; i < sessionKeys.length; i++) {
            if (sessionKeys[i].includes('-')) {
              sessionStorage.removeItem(sessionKeys[i]);
            }
          }
          setIsChangeData(false);
          await resourceDetail(resourceTypeVal.current, item.id, item.code);
          setRoleNum(index);
          setRoleId(item.id);
          setRoleCode(item.code);
          //点击确认，就是到下个角色上，需清空缓存等
          allQueryKey = [];
        }
      });
    } else {
      setRoleNum(index);
      setRoleId(item.id);
      setRoleCode(item.code);
      resourceDetail(resourceType, item.id, item.code);
    }
  };
  //获取角色列表数据
  const roleList = async () => {
    let res = {}
    if(isAppEnd()){
      res = await getRoleListApp();
    } else {
      res = await getRoleList();
    }
    if(res.data.code != 0) {
      toast.error(res.data.msg, {
        position: 'top-right'
      });
      return
    }
    if(res.data.data?.length > 0){
      let allUserId = res.data.data.filter(item=>item.code == 'all_users')[0].id;
      allUserIdVal.current = allUserId
      setRoleId(res.data.data[0].id);
      setRoleCode(res.data.data[0].code);
      setRoleListData(res.data.data);
    }
  };
  //获取资源列表数据
  const resourceList = async () => {
    let res = await getResourceList();
    if(res.data.code != 0) {
      toast.error(res.data.msg, {
        position: 'top-right'
      });
      return
    }
    setResourceListData(res.data.data);
    if(res.data.data && res.data.data[0].type){
      setResourceType(res.data.data[0].type);
    }
  };
  //获取所有用户的页面数据-由于嵌套，所以递归
  const allUserPageData = (data)=>{
    for(var i=0;i<data.length;i++){
      if(data[i].acl.value.length > 0){
        sessionStorage.setItem('$'+allUserIdVal.current+'-'+data[i].value,data[i].acl.value)
      }
      if(data[i].children.length > 0){
        allUserPageData(data[i].children)
      }
    }
  }
  //获取资源详情数据
  const resourceDetail = async (type: any, id: any, code: any) => {
    setLoading(true);
    //除超级管理员外查询所有用户对应的资源详情
    if(code !="super_admin" && code !="tenant_admin" && code !="all_users"){
      let AllRes = {};
      if(allUserIdVal.current) {
        if(isAppEnd()){
          AllRes = await getResourceDetailApp(allUserIdVal.current);
        } else {
          AllRes = await getResourceDetail(type, allUserIdVal.current);
        }
        if(AllRes.data.code != 0) {
          toast.error(AllRes.data.msg, {
            position: 'top-right'
          });
          setLoading(false);
          setResourceListDetailData([]);
          setQuery(false)
          return
        }
        var sessionKeys = Object.keys(sessionStorage);
        for (var i = 0; i < sessionKeys.length; i++) {
          if (sessionKeys[i].includes('$'+allUserIdVal.current+'-')) {
            sessionStorage.removeItem(sessionKeys[i]);
          }
        }
        if(type !='Page'){
          let data = AllRes.data.data;
          for(var i=0;i<data.length;i++){
            if(data[i].acl.value.length !=0){
              sessionStorage.setItem('$'+allUserIdVal.current+'-'+data[i].value,data[i].acl.value)
            }
          }
        } else {
          //页面数据格式不一致,单独处理
          let data = AllRes.data.data;
          allUserPageData(data)
        }
      }
    }
    let res = {};
    if(id) {
      if(isAppEnd()){
        res = await getResourceDetailApp(id);
      } else {
        res = await getResourceDetail(type, id);
      }
      if(res.data.code != 0) {
        toast.error(res.data.msg, {
          position: 'top-right'
        });
        setLoading(false);
        setResourceListDetailData([]);
        setQuery(false)
        return
      }
      lastData.current = JSON.parse(JSON.stringify(res.data.data))
      if(res.data.data && res.data.data.length > 0){
        getAllChecked(res.data.data);
      }
      everyData.current = res.data.data;
      if(roleCodeVal.current != 'all_users' && roleCodeVal.current != 'super_admin' && roleCodeVal.current != 'tenant_admin'){
        //处理将所有用户勾选的数据加disabled:true，替换到其他资源详情上
        let allData = dealDetailData(everyData.current, roleIdVal.current);
        let selectedDis = []; //所有用户被勾选项的数据['1-ddwlr3z27wu9', '1-ddxo8zau84qp']
        let selectedDisVal = []; //所有用户被勾选项的value ['write', 'read,write']
        for (var i = 0; i < allData?.length; i++) {
          if(sessionStorage.getItem('$'+allUserIdVal.current+'-'+allData[i].split('-')[1])){
            selectedDis.push(roleIdVal.current + '-' + allData[i].split('-')[1])
            selectedDisVal.push(sessionStorage.getItem('$'+allUserIdVal.current+'-'+allData[i].split('-')[1]))
          }
        }
        dealSelectedData(res.data.data, selectedDis, selectedDisVal)
      }
      setResourceListDetailData(res.data.data);
    }
    setLoading(false);
  };
  //处理所有用户被勾选的数据
  const dealSelectedData = (detailData: any, selectedDis:any, selectedDisVal:any) => {
    for (var i = 0; i < detailData?.length; i++) {
      for(var j=0;j<selectedDis.length;j++){
        if(detailData[i].value == selectedDis[j].split('-')[1]){
          for(var m =0;m< detailData[i].acl.options.length;m++){
            if(resourceTypeVal.current == 'Page'){ //所有用户对应的资源列表是页面时单独处理，因为页面的资源详情格式与其他不一致
              for(var n =0;n< detailData[i].acl.options[m].children.length;n++){
                if(selectedDisVal[j].split(',').includes(detailData[i].acl.options[m].children[n].value)){
                  detailData[i].acl.options[m].children[n].disabled = true;
                  detailData[i].acl.disabled = true;
                  detailData[i].acl.value.push(detailData[i].acl.options[m].children[n].value)
                }
              }
            } else { ///所有用户对应的资源列表是非页面的情况
              if(selectedDisVal[j].split(',').includes(detailData[i].acl.options[m].value)){
                detailData[i].acl.options[m].disabled = true;
                detailData[i].acl.disabled = true;
                detailData[i].acl.value.push(detailData[i].acl.options[m].value)
              }
            }
          }
        }
      }
      //处理数据被勾选-因为页面有children，所以得递归
      if(detailData[i]?.children?.length > 0){
        dealSelectedData(detailData[i]?.children, selectedDis, selectedDisVal)
      }
    }
    return detailData;
  };
  //处理详情数据-为保存使用
  const dealDetailData = (detailData: any, roleIdVal: any) => {
    for (var i = 0; i < detailData?.length; i++) {
      allQueryKey.push(roleIdVal + '-' + detailData[i].value);
      if (detailData[i].children) {
        dealDetailData(detailData[i].children, roleIdVal);
      }
    }
    return allQueryKey;
  };
  //比较删除之前，处理接口的返回值
  //判断下所有用户被勾选的值，是不是当前账号已经存在的值了，是的话，不删除，不是的话，需删除
  const dealInterfaceData = (data)=>{
    for(var m=0;m<data.length;m++){
      backData[roleIdVal.current+'-'+data[m].value] = data[m].acl.value
      if(data[m]?.children?.length > 0){
        dealInterfaceData(data[m].children)
      }
    }
    return backData
  }
  //页面最终的保存配置
  const saveResourceCfg = async () => {
    //everyData.current 当前获得的所有资源详情的数据 roleIdVal.current 当前角色的value
    let allData = dealDetailData(everyData.current, roleIdVal.current);
    let interData = dealInterfaceData(lastData.current)
    let paramCfg = [];
    // allData 当前获得的所有资源详情的数据 的格式处理为 ['1-ddwlr3z27wu9', '1-ddxo8zau84qp']
    for (var i = 0; i < allData.length; i++) {
      if (sessionStorage.getItem(allData[i])) {
        let selectedVal = sessionStorage.getItem('$'+allUserIdVal.current+'-'+allData[i].split('-')[1]) //所有用户被勾选值
        //所有值删除被勾选值
        let allVal = sessionStorage.getItem(allData[i])?.split(',');
        let selectedValArr = selectedVal?.split(',')
        if( roleCodeVal.current != "all_users"){ //只有当不是所有用户时,才需要过滤被勾选的数据
          for(var j=0;j<allVal.length;j++){
            for(var k=0;k<selectedValArr?.length;k++){
              //判断下所有用户被勾选的值，是不是当前账号已经存在的值了，是的话，不删除，不是的话，需删除
              //方案：selectedValArr 和 接口返回值lastData.current比较一下
              let delFlag = backData[allData[i]]?.includes(selectedValArr[k])
              if(!delFlag && allVal[j] == selectedValArr[k]){
                allVal?.splice(j,1)
              }
            }
          }
        }

        let params = {
          roleId: roleIdVal.current,
          resourceType: resourceIdVal.current,
          correlationId: allData[i].split('-')[1],
          aclType: allVal
        };
        paramCfg.push(params);
      } else {
        let params = {
          roleId: roleIdVal.current,
          resourceType: resourceIdVal.current,
          correlationId: allData[i].split('-')[1],
          aclType: []
        };
        paramCfg.push(params);
      }
    }
    setLoading(true);
    let res;
    if(isAppEnd()){
      res = await saveResourcePermissionsApp(paramCfg);
    } else {
      res = await saveResourcePermissions(paramCfg);
    }
    if (res.data.code == 0) {
      //保存成功
      toast.success('保存成功', {
        position: 'top-center'
      });
      setIsChangeData(false);
      allQueryKey = [];
      backData = {};
      await resourceDetail(resourceTypeVal.current, roleIdVal.current, roleCodeVal.current);
      setLoading(false);
    } else {
      toast.error(res.data.msg, {
        position: 'top-right'
      });
      setLoading(false);
      return
    }
  };

  useEffect(() => {
    roleIdVal.current = roleId;
  }, [roleId]);
  useEffect(() => {
    resourceIdVal.current = resourceId;
  }, [resourceId]);

  useEffect(() => {
    roleCodeVal.current = roleCode;
  }, [roleCode]);

  useEffect(() => {
    resourceTypeVal.current = resourceType;
  }, [resourceType]);

  useEffect(() => {
    const initData = async() => {
      await roleList();
      let $$permissionsData = permStore.getState().permData;
      if(isEditorialEnd()){
        // await resourceList();
        let filterQuery = $$permissionsData.filter(item => item == 'devApp:resourcePermission:query')
        const queryFlag = filterQuery.length > 0 ? true : false; //查询
        setQuery(queryFlag)
        let filterUpdate = $$permissionsData.filter(item => item == 'devApp:resourcePermission:update')
        const updateFlag = filterUpdate.length > 0 ? true : false; //保存
        setSaveBtn(updateFlag)
        let filterNew = $$permissionsData.filter(item => item == 'devApp:customPermission:create')
        const newFlag = filterNew.length > 0 ? true : false; //新增自定义
        setNewCBtn(newFlag)
        let filterUpdateC = $$permissionsData.filter(item => item == 'devApp:customPermission:update')
        const updateCFlag = filterUpdateC.length > 0 ? true : false; //更新自定义
        setUpdateCBtn(updateCFlag)
        let filterDelC = $$permissionsData.filter(item => item == 'devApp:customPermission:delete')
        const delCFlag = filterDelC.length > 0 ? true : false; //删除自定义
        setDelCBtn(delCFlag)
      } else {
        let filterQuery = $$permissionsData.filter(item => item == 'app:resourcePermission:query')
        const queryFlag = filterQuery.length > 0 ? true : false; //查询
        setQuery(queryFlag)
        let filterUpdate = $$permissionsData.filter(item => item == 'app:resourcePermission:update')
        const updateFlag = filterUpdate.length > 0 ? true : false; //保存
        setSaveBtn(updateFlag)
        let filterNew = $$permissionsData.filter(item => item == 'app:customPermission:create')
        const newFlag = filterNew.length > 0 ? true : false; //新增自定义
        setNewCBtn(newFlag)
        let filterUpdateC = $$permissionsData.filter(item => item == 'app:resourcePermission:update')
        const updateCFlag = filterUpdateC.length > 0 ? true : false; //更新自定义
        setUpdateCBtn(updateCFlag)
        let filterDelC = $$permissionsData.filter(item => item == 'app:customPermission:delete')
        const delCFlag = filterDelC.length > 0 ? true : false; //删除自定义
        setDelCBtn(delCFlag)
      }
      await resourceDetail(resourceTypeVal.current, roleIdVal.current, 'super_admin');
      setLoading(false);
    }
    initData()
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
                "script": async function () {
                  saveResourceCfg();
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
            <div className="role_list">
              <div className="role_list_title">角色列表</div>
              {roleListData &&
                roleListData.map((item, index) => {
                  return (
                    <div
                      key={index}
                      onClick={() => changeRoleList(item, index)}
                      className={`role_list_listitem ${
                        index == roleNum ? 'isActive' : ''
                      }`}
                      title={item.roleName}
                    >
                      {item.roleName}
                    </div>
                  );
                })}
            </div>
            {false &&
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
            }


            <div className="resource_detail">
              <div className="role_list_title">{isEditorialEnd() ? '资源详情' : '页面列表'}</div>
              <ResourceDetail
                detailData={resourceListDetailData}
                roleId={roleId}
                roleCode={roleCodeVal.current}
                resourceType={resourceType}
                setResourceListDetailData={setResourceListDetailData}
                resourceDetail={resourceDetail}
                childChange={valueChange}
                new={newCBtn}
                edit={updateCBtn}
                del={delCBtn}
                query={query}
              />
            </div>
          </div>
          <div className="ResourceAcl_Config_Save">
            {/* {saveBtn && <button onClick={() => saveResourceCfg()}>保存</button>} */}
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
