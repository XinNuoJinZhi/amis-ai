import React, {memo} from 'react';
import Frame, { useFrame } from 'react-frame-component';
import {render} from 'amis';
import './styles.scss';

export interface MobilePreviewProps {
  env: any;
  data?: any;
  /** 应用语言类型 */
  appLocale?: string;
  schema: any;
  rootRenderProps?: any;
}

export default class MobilePreview extends React.Component<MobilePreviewProps> {
  initialContent: string = '';
  dialogMountRef: React.RefObject<HTMLDivElement> = React.createRef();
  iframeRef: HTMLIFrameElement | null = null;

  constructor(props: MobilePreviewProps) {
    super(props);
    this.iframeRefFunc = this.iframeRefFunc.bind(this);
    this.isMobile = this.isMobile.bind(this);
    this.getModalContainer = this.getModalContainer.bind(this);
    this.iframeContentDidMount = this.iframeContentDidMount.bind(this);
    this.getDialogMountRef = this.getDialogMountRef.bind(this);

    const styles = [].slice
      .call(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el: any) => {
        return el.outerHTML;
      });
    styles.push(
      `<style>body {height:auto !important;min-height:100%;overflow-y:auto !important;display: flex;flex-direction: column;}</style>`
    );

    styles.push(
      `<style>.tox-toolbar__overflow {max-width: 335px !important;left: 10px !important;}.tox-menu{left: 10px !important;}</style>`
    );

    // Monaco environment script for iframe - 使用 iframe 自己的 window
    const monacoEnvironmentScript = `
      <script>
        (function() {
          function getWorkerBootstrapLibUrl(workerUrl) {
            var blob = new Blob(
              ['importScripts("' + workerUrl + '");'],
              { type: 'text/javascript' }
            );
            return URL.createObjectURL(blob);
          }

          // 检查是否在 iframe 中
          var isInIframe = window.self !== window.top;

          window.MonacoEnvironment = {
            getWorkerUrl: function (moduleId, label) {
              var workerUrl = null;

              // 在 iframe 中直接使用相对路径
              var url = '/pkg/editor.worker.js';
              if (label === 'json') {
                url = '/pkg/json.worker.js';
              } else if (label === 'css') {
                url = '/pkg/css.worker.js';
              } else if (label === 'html') {
                url = '/pkg/html.worker.js';
              } else if (label === 'typescript' || label === 'javascript') {
                url = '/pkg/ts.worker.js';
              }

              return getWorkerBootstrapLibUrl(url);
            }
          };

        })();
      </script>

      <script>
        // 预加载 Monaco 在 iframe 中
        (function() {
          var isInIframe = window.self !== window.top;
          if (isInIframe && !window.__monaco_loaded__) {
            window.__monaco_loaded__ = true;

            // 监听 DOM 加载完成
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  var event = new CustomEvent('iframe-monaco-ready');
                  window.parent.dispatchEvent(event);
                }, 100);
              });
            } else {
              setTimeout(function() {
                var event = new CustomEvent('iframe-monaco-ready');
                window.parent.dispatchEvent(event);
              }, 100);
            }
          }
        })();
      </script>
    `;

    this.initialContent = `<!DOCTYPE html><html><head>${styles.join(
      ''
    )}${monacoEnvironmentScript}</head><body><div class="ae-IFramePreview AMISCSSWrapper"></div></body></html>`;
  }

  iframeRefFunc(iframe: any) {
    if (iframe) {
      this.iframeRef = iframe;
    }
  }

  getDialogMountRef() {
    return this.dialogMountRef.current;
  }

  iframeContentDidMount() {
    this.iframeRef?.contentWindow?.document.body.classList.add(`is-modalOpened`);
  }

  getModalContainer() {
    const iframe: any = document.querySelector('.previewIFrame');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    return iframeDoc.querySelector('.is-modalOpened');
  }

  isMobile() {
    return true;
  }

  render() {
    const {schema, env, rootRenderProps} = this.props;
    console.log(env,'env');
    return (
      <div className={'root-preview-body'}>
        <div className={'mobile-preview-body is-mobile'}>
          <div className={'Preview-inner'}>
            <Frame
              className={'previewIFrame'}
              initialContent={this.initialContent}
              ref={this.iframeRefFunc}
              contentDidMount={this.iframeContentDidMount}
            >
              <InnerComponent />
              <div ref={this.dialogMountRef} className="ae-Dialog-preview-mount-node">
                {render(
                  schema,
                  {
                    ...rootRenderProps,
                    key: 'preview-mode',
                    theme: env.theme,
                    editorDialogMountNode: this.getDialogMountRef
                  },
                  {
                    ...env,
                    session: `${env.session}-iframe-preview`,
                    useMobileUI: true,
                    isMobile: this.isMobile,
                    getModalContainer: this.getModalContainer,
                  }
                )}
                <InnerSvgSpirit />
              </div>
            </Frame>
          </div>
        </div>
      </div>
    );
  }
}

function InnerComponent() {
  // Hook returns iframe's window and document instances from Frame context
  const { document: doc } = useFrame();

  React.useEffect(() => {
    const layer = doc?.querySelector('.frame-content') as HTMLElement;

    layer!.addEventListener('mousedown', (e) => {
      const isMonacoArea = (e.target as HTMLElement)?.closest('.view-lines');

      if (isMonacoArea) {
        e.preventDefault();
        e.stopPropagation();

        setTimeout(() => {
          const allTextareas = doc?.querySelectorAll('textarea');
          if (allTextareas && allTextareas.length > 0) {
            allTextareas[0].focus();
          }
        }, 0);
      }
    }, true);

    // 同步 Monaco Editor 动态添加的样式到 iframe
    const syncMonacoStyles = () => {
      const parentStyles = document.querySelectorAll('style[data-vite-dev-id*="monaco-editor"], style[media="screen"].monaco-colors');
      const iframeHead = doc?.querySelector('head');
      const existingStyleContents = new Set<string>();

      // 获取 iframe 中已有的样式内容
      iframeHead?.querySelectorAll('style').forEach((s) => {
        if (s.textContent) {
          existingStyleContents.add(s.textContent);
        }
      });

      if (iframeHead) {
        parentStyles.forEach((style) => {
          // 跳过已同步的样式
          if (style.textContent && existingStyleContents.has(style.textContent)) {
            return;
          }

          if (style.textContent) {
            const newStyle = doc!.createElement('style');
            newStyle.textContent = style.textContent;

            const viteId = (style as HTMLStyleElement).getAttribute('data-vite-dev-id');
            if (viteId) {
              newStyle.setAttribute('data-vite-dev-id', viteId);
            }
            if (style.className) {
              newStyle.className = style.className;
            }
            if ((style as HTMLStyleElement).media) {
              newStyle.media = (style as HTMLStyleElement).media;
            }
            iframeHead.appendChild(newStyle);
            existingStyleContents.add(style.textContent);
          }
        });
      }
    };

    // 初始同步
    syncMonacoStyles();

    // 监听主窗口样式变化
    const observer = new MutationObserver(() => {
      syncMonacoStyles();
    });
    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [doc]);

  return null;
}

const InnerSvgSpirit = memo(() => {
  const [svgSprite, setSvgSprite] = React.useState('');

  React.useEffect(() => {
    // @ts-ignore 这里取的是平台的变量
    let spiriteIcons = window.spiriteIcons;

    if (!spiriteIcons && typeof document !== 'undefined') {
      // 尝试从页面中获取 svg sprite
      const svgs = document.querySelectorAll('body > svg');
      let currentSvgSprite = '';

      // 查找包含 symbol 的 svg
      for (let i = 0; i < svgs.length; i++) {
        const svg = svgs[i];
        if (svg.querySelector('symbol')) {
          currentSvgSprite += svg.outerHTML;
        }
      }

      // 如果 body 直属下没找到，尝试找一下常见的隐藏容器
      if (!currentSvgSprite) {
        const divSvgs = document.querySelectorAll('body > div > svg');
        for (let i = 0; i < divSvgs.length; i++) {
          const svg = divSvgs[i];
          if (svg.querySelector('symbol')) {
            currentSvgSprite += svg.outerHTML;
          }
        }
      }

      if (currentSvgSprite) {
        spiriteIcons = currentSvgSprite;
      }
    }

    if (spiriteIcons) {
      setSvgSprite(spiriteIcons);
    }
  }, []);

  if (svgSprite) {
    return (
      <div
        id="amis-icon-manage-mount-node"
        style={{display: 'none'}}
        dangerouslySetInnerHTML={{__html: svgSprite}}
      ></div>
    );
  } else {
    // 如果没有找到 spiriteIcons，也尝试渲染一个空的 div，以便后续可能会有动态注入
    return (
      <div
        id="amis-icon-manage-mount-node"
        style={{display: 'none'}}
      ></div>
    );
  }
});