import {fetchContext} from "@/utils/dataLoader";
import {useEffect, useState, Suspense} from "react";
import { Spin } from 'antd';
import {RootContextProvider, RootContextType} from '@/hooks/rootContext';

export function WithSystemContext({ children }: any) {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<RootContextType>({});
  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        const contextData =  await fetchContext()
        console.log(contextData,'contextData---fetchData')
        contextData && setContext(contextData)
      } catch (err) {
        console.error('请求失败', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData().then(r => {});
  }, []);

  if (loading) {
    return <Spin />;
  }

  return (
    <RootContextProvider value={context}>
      <Suspense fallback={<Spin />}>
        {children}
      </Suspense>
    </RootContextProvider>
  )
}
