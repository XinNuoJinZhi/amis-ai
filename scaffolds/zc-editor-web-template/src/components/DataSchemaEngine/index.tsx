import React, {useEffect, useState} from 'react';
import {render as amisRender} from 'amis';
import {service} from "@/utils/request"
import {genSchema} from "@/engine/engine";
import {getContext} from "@/api/envVar"
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import {env} from '@/hooks/amis';
const DataSchemaEngine: React.FC = (props) => {
  const [envVar, setEnvVar] = useState({});
  const [zcAppVal, setZCAppVal] = useState({});
  const [zcCompanyVal, setZCCompanyVal] = useState({});
  const [zcUserVal, setZCUserVal] = useState({});
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState({type: "page"});
  let params = new URLSearchParams(window.location.search);
  let tableId = params.get('queryKey');
  const getContextVal = async () => {
    let res = await getContext();
    let envVar = res?.data?.data?.envVar;
    let zcApp = res?.data?.data?.zcApp;
    let zcCompany = res?.data?.data?.zcCompany;
    let zcUser = res?.data?.data?.zcUser;
    let obj = {};
    for (var i = 0; i < envVar?.length; i++) {
      obj[envVar[i].key] = envVar[i].value;
    }
    setEnvVar(obj)
    setZCAppVal(zcApp)
    setZCCompanyVal(zcCompany)
    setZCUserVal(zcUser)
  }
  useEffect(() => {
    getContextVal();
  }, []);
  useEffect(() => {
    let amisSchema = genSchema(props?.model, tableId);
    setSchema(amisSchema)
  }, [props.model, tableId]);
  useEffect(()=>{
    setLoading(false)
    setTimeout(()=>{
      setLoading(true)
    },1)
  },[props]);

  return (
    loading && (<div style={{border: '1px solid white'}}>
      {amisRender(
        schema,
        {
          context: {
            zcApp: zcAppVal,
            zcCompany: zcCompanyVal,
            zcUser: zcUserVal,
            app: initApiStore.getState().initApi,
            $$noPer: false,
            $$permissionsData: permStore.getState().permData,
            ...envVar
          }
        },
        {
          fetcher: service,
          theme: env.theme
        }
      )}
    </div>)
  )
}
export default DataSchemaEngine;
