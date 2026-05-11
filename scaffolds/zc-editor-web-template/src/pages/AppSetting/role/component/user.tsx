import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Tree, Col, Row, Table, Pagination, ConfigProvider,} from 'antd';
import { listSimpleDeptApi, getUserPageApi, } from "@/api/backlogCenter"
import { handleTree } from '@/utils/tree'
import zh_CN from 'antd/es/locale/zh_CN';
// import zhCN from "antd/locale/zh_cn"
// import { ConfigProvider } from "antd";
const { Search } = Input;
const User: React.FC = (props) => {
  const [treeData, setTreeData] = useState([]);
  const [searchTreeData, setSearchTreeData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [total, setTotal] = useState();
  const deptId = useRef();
  const pageNum = useRef(1)
  const pageSizeNum = useRef(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const userTableRef = React.useRef();
  const [initSelected, setInitSelected] = useState([]);
  //将选择的用户都放一个单独的数组中
  const modelUser = useRef<any>([]);
  const initData = async() => {
    await getTreeSelect();
    await getList();
    if(props.data.selectUser){
      let selectedRowKeys = props.data.selectUser.map(item=>item.id);
      setSelectedRowKeys(selectedRowKeys);
      let params = {
        userIdList: selectedRowKeys
      }
      setInitSelected(selectedRowKeys)
      props?.sendValueToFather(params);
    }
  };
  //初始化
  useEffect(()=>{
    initData()
  },[])
  //将数据转成antd tree 的格式
  function mapTreeData(data) {
    return data.map((item, index) => {
      return {
        title: item.name,
        key: item.id,
        children:
          item.children == null || item.children.length <= 0
            ? []
            : mapTreeData(item.children)
      };
    });
  }
  const getTreeSelect = async () => {
    setTreeData([]);
    const res = await listSimpleDeptApi();
    let treeData = handleTree(res.data.data);
    let treeDataCfg = mapTreeData(treeData);
    // let searchTreeData = JSON.parse(JSON.stringify(treeDataCfg))
    setSearchTreeData(res.data.data)
    setTreeData(treeDataCfg)
  };
  const handleDeptNodeClick = async (row:any) => {
    deptId.current = row[0]
    await getList();
  };
  const pageSizeChange = async(page:any, pageSize:any)=>{
    //pageNumber 第几页
    pageNum.current = page;
    pageSizeNum.current = pageSize;
    await getList();
  };
  const getList = async () => {
    let params = {
      deptId: deptId.current,
      pageNo: pageNum.current,
      pageSize: pageSizeNum.current
    }
    let res = await getUserPageApi(params);
    //加key的目的是因为antd 组件 需要一个唯一值key
    res.data.data.list.map((item:any)=>item.key = item.id)
    setUserList(res.data.data.list)
    setTotal(res.data.data.total)
  };

  const columns= [
    {
      title: '用户名',
      dataIndex: 'nickname',
    },
    {
      title: '账号',
      dataIndex: 'username',
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
    },
    {
      title: '部门',
      dataIndex: 'dept',
      render: (row:any) => <span>{row && row.name}</span>,
    },
  ];
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: []) => {
      let allData = new Set([...modelUser.current]);
      let params = {
        userIdList: Array.from(allData)
      }
      setSelectedRowKeys(Array.from(allData));
      props?.sendValueToFather(params);
    },
    onSelect: (record, selected, selectedRows, nativeEvent) =>{
      if(selected == false){ //去勾选
        let userLists = initSelected.filter(item1 => {
          return record.id != item1;
        });
        setInitSelected(userLists)
        modelUser.current = userLists;
      } else { //勾选时
        let data = initSelected.concat(record.id)
        modelUser.current.push(...data)
      }
    },
    onSelectAll: (selected, selectedRows, changeRows) =>{
      if(selected == false){ //去勾选
        let id = changeRows.map(item=>item.id)
        id.map((i, index)=>{
          if(i == modelUser.current[i]){
            modelUser.current.splice(index, 1)
          }
        })
      } else { //勾选时
        let data = changeRows.map(i=>i.id)
        modelUser.current = initSelected.concat(data)
      }
    },
  };
  //部门列表-树过滤
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if(value ==''){
      let data2 = handleTree(searchTreeData)
      let treeDataCfg = mapTreeData(data2);
      setTreeData(treeDataCfg)
    } else {
      let copySearchData = JSON.parse(JSON.stringify(searchTreeData))
      setTreeData([]);
      let data = copySearchData.filter(item=>item.name.includes(value))
      let zData = [...data]
      let newArr:any = [];
      let obj = {};
      //去重zData 的 parentId
      for (var i = 0; i < zData.length; i++) {
        if (!obj[zData[i].parentId]) {
          newArr.push(zData[i])
          obj[zData[i].parentId] = true
        }
      }
      let fData = []
      for(var i=0;i<newArr.length;i++){
        if(newArr[i].parentId != 0){
          fData.push(copySearchData.filter(item=>item.id == newArr[i].parentId))
        }
      }
      //去重fData 的 parentId
      let ffData = [].concat.apply([], fData)
      let newFFArr:any = [];
      let objFF = {};
      for (var i = 0; i < ffData.length; i++) {
        if (!objFF[ffData[i].parentId]) {
          newFFArr.push(ffData[i])
          objFF[ffData[i].parentId] = true
        }
      }
      let yData = []
      for(var i=0;i<newFFArr.length;i++){
        if(newFFArr[i].parentId != 0){
          yData.push(copySearchData.filter(item=>item.id == newFFArr[i].parentId))
        }
      }
      let allData =[].concat.apply([], yData).concat([].concat.apply([], fData)).concat(data)
      let data2 = handleTree(allData)
      let treeDataCfg = mapTreeData(data2);
      setTreeData(treeDataCfg)
    }
  };
  return (
    // <ConfigProvider locale={zhCN}>
      <div style={{ border: '1px solid white'}}>
        {/* {contextHolder} */}
        <div>
          <Row>
            <Col span={6}>
              <Card style={{height:'500px',overflow:"auto"}}>
                <div>
                  <span>部门列表</span>
                </div>
                <div className="head-container">
                  <Search placeholder="请输入部门名称" allowClear prefix-icon="el-icon-search" onChange={onInputChange}/>
                  {treeData.length > 0 && <Tree
                    defaultExpandAll={true}
                    treeData={treeData}
                    onSelect={handleDeptNodeClick}
                  />}
                </div>
              </Card>
            </Col>
            <Col span={17}>
              <Card style={{height:'500px',overflow:"auto"}}>
                <Table
                  rowSelection={{
                    type: 'checkbox',
                    ...rowSelection,
                  }}
                  columns={columns}
                  dataSource={userList}
                  pagination={false}
                  ref={userTableRef}
              />
                <ConfigProvider locale={zh_CN}>
                  <Pagination
                    total={total}
                    showSizeChanger
                    showQuickJumper
                    // showTotal={(total) => `共 ${total} 条`}
                    style={{paddingTop:'10px',paddingLeft:'20px'}}
                    onChange={pageSizeChange}
                  />
                </ConfigProvider>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    // </ConfigProvider>
  )
}
export default User;
