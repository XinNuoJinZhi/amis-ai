import React, { useState } from 'react';
import { Modal, message } from 'antd';

// 引入代码高亮插件和样式
import SyntaxHighlighter from 'react-syntax-highlighter';
import { obsidian } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// import { xml2jsons } from '@/bpmn/util/xmlUtil';
import { XmlNode, XmlNodeType, parseXmlString } from 'steady-xml'

// 样式
import './index.css';

interface IProps {
  modeler: any;
  type: 'xml' | 'json';
}

/**
 * 流程预览
 * @param props
 * @constructor
 */
export default function Previewer(props: IProps) {
  // props
  const { modeler, type } = props;
  // states
  const [xml, setXml] = useState<string>('');
  const [open, setOpen] = useState(false);

  const showModal = async () => {
    setOpen(true);
    let result = await modeler.saveXML({ format: true });
    const { xml } = result;
    if (type == 'xml') {
      setXml(xml);
    } else {
      const rootNodes = new XmlNode(XmlNodeType.Root, parseXmlString(xml))
      const jsonStr: string = rootNodes.parent?.toJSON() as unknown as string
      setXml(JSON.stringify(jsonStr,null,2));
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleCopy = () => {
    if (navigator) {
      // navigator clipboard 需要https等安全上下文
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(xml).then((r) => message.info('已复制到剪贴板'));
    } else {
        // 创建text area
        let textArea = document.createElement("textarea");
        textArea.value = xml;
        // 使text area不在viewport，同时设置不可见
        textArea.style.position = "absolute";
        textArea.style.opacity = 0;
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            // 执行复制命令并移除文本框
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
            message.info('已复制到剪贴板')
        });
    }
    }
  };

  return (
    <>
      <a type="primary" onClick={showModal}>
        {'预览' + type.toUpperCase()}
      </a>
      <Modal
        width={1200}
        bodyStyle={{ maxHeight: '50%' }}
        title="预览"
        open={open}
        okText={'复制'}
        cancelText={'关闭'}
        onOk={handleCopy}
        onCancel={handleCancel}
      >
        <div
          // className={styles.codePreWrap}
          style={{ maxHeight: 600, overflowY: 'scroll', maxWidth: 1200 }}
        >
          <SyntaxHighlighter language={type} style={obsidian}>
            {xml}
          </SyntaxHighlighter>
        </div>
      </Modal>
    </>
  );
}
