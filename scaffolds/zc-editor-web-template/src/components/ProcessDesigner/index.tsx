import React, {useEffect, useState} from 'react';
import {Provider} from 'react-redux';
import {store} from '@/redux/store/store';
import ProcessDesigner from './ProcessDesigner';

const ProcessModel: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  // console.log(params,'paramsparamsparamsparamsparamsparamsparams')
  // console.log(params.get('bpmnXml'),"params.get('xml')params.get('xml')params.get('xml')params.get('xml')")
  // const bpmnXml = JSON.parse(params.get('xml'))
  // const bpmnXml = JSON.parse(localStorage.getItem('bpmnXml'))
  const bpmnXml = {
    modelKey: params.get('modelKey'),
    modelId: params.get('modelId')
  };
  console.log(bpmnXml, 'xml的三个数据');
  const [visible, setVisible] = useState<boolean>(
    document.documentElement.clientWidth > 1080
  );

  useEffect(() => {
    watchClientWidth();
    window.addEventListener('resize', watchClientWidth);
  }, []);

  function watchClientWidth() {
    let clientWidth = document.documentElement.clientWidth;
    if (clientWidth < 1080) {
      if (visible) {
        setVisible(false);
        console.log('请保证您的窗口宽带大于1080');
        // message.warning('请保证您的窗口宽带大于1080').then(() => {});
      }
    } else {
      setVisible(true);
    }
  }

  return (
    <Provider store={store}>
      <ProcessDesigner bpmnXml={bpmnXml} />
    </Provider>
  );
};
export default ProcessModel;
