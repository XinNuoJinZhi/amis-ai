import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox} from 'antd';
import {resetSize} from './utils/util';
import {aesEncrypt} from './utils/ase';
import {useAdminBaseUrl} from '@/utils/util';
import {service} from '@/utils/request';
import {render as amisRender, toast} from 'amis';
import {
  getCodeApi,
  reqCheckApi,
} from '@/api/entitymanage';
import './style.css'; // 假设你有一个CSS文件来定义样式
const VerificationCode = forwardRef(function VerificationCode(props: any, ref) {
  // console.log(props, 'propspropsprops');
  const {mode, captchaType, type, blockSize, explain} = props;
  // const { proxy } = getCurrentInstance()
  const secretKey = useRef(''), //后端返回的ase加密秘钥
    // const [secretKey, setSecretKey] = useState(''), //后端返回的ase加密秘钥
    [passFlag, setPassFlag] = useState(''), //是否通过的标识
    [backImgBase, setBackImgBase] = useState(''), //验证码背景图片
    [blockBackImgBase, setBlockBackImgBase] = useState(''), //验证滑块的背景图片
    backToken = useRef(''), //后端返回的唯一token值
    // [backToken, setBackToken] = useState(''), //后端返回的唯一token值
    [startMoveTime, setStartMoveTime] = useState(''), //移动开始的时间
    [endMovetime, setEndMovetime] = useState(''), //移动结束的时间
    [tipWords, setTipWords] = useState(''),
    [text, setText] = useState(''),
    [finishText, setFinishText] = useState(''),
    [setSize, setSetSize] = useState({
      imgHeight: 0,
      imgWidth: 0,
      barHeight: 0,
      barWidth: 0
    }),
    setSizeData = useRef({
      imgHeight: 0,
      imgWidth: 0,
      barHeight: 0,
      barWidth: 0
    }),
    [moveBlockLeft, setMoveBlockLeft] = useState(undefined),
    moveBlockLefts = useRef(undefined),
    [leftBarWidth, setLeftBarWidth] = useState(undefined),
    // 移动中样式
    [moveBlockBackgroundColor, setMoveBlockBackgroundColor] =
      useState(undefined),
    [leftBarBorderColor, setLeftBarBorderColor] = useState('#ddd'),
    [iconColor, setIconColor] = useState(undefined),
    [iconClass, setIconClass] = useState('icon-right'),
    status = useRef(false),
    // [status, setStatus] = useState(false), //鼠标状态
    isEnd = useRef(false), //是够验证完成
    // [isEnd, setIsEnd] = useState(false), //是够验证完成
    [showRefresh, setShowRefresh] = useState(true),
    [transitionLeft, setTransitionLeft] = useState(''),
    [transitionWidth, setTransitionWidth] = useState(''),
    startLeft = useRef(0),
    // [startLeft, setStartLeft] = useState(0);
    captchaVerification = useRef(''),
    [showObject, setShowObject] = useState(false);

  // const barArea = computed(() => {
  //   return proxy.$el.querySelector('.verify-bar-area')
  // })
  const barAreaRef = useRef(null); // 创建一个ref对象
  // 使用useRef来创建一个可变的对象，用于存储查询的结果
  const barArea = useRef(null);
  useEffect(() => {
    // 在组件挂载后查找DOM元素
    // if (barAreaRef.current) {
    console.log(
      document.querySelector('.verify-bar-area'),
      'querySelectorquerySelectorquerySelector'
    );
    barArea.current = document.querySelector('.verify-bar-area');
  }, [barAreaRef]); // 依赖项列表中包含barAreaRef
  const init = async () => {
    captchaVerification.current = '';
    setShowObject(false);
    console.log(explain, 'explain');
    setText('向右滑动完成验证');
    await getPictrue();
    let {imgHeight, imgWidth, barHeight, barWidth} = resetSize(props);
    console.log(
      {
        ...setSize,
        imgHeight: imgHeight,
        imgWidth: imgWidth,
        barHeight: barHeight,
        barWidth: barWidth
      },
      '向右滑动完成验证'
    );
    setSetSize({
      ...setSize,
      imgHeight: imgHeight,
      imgWidth: imgWidth,
      barHeight: barHeight,
      barWidth: barWidth
    });
    setSizeData.current = {
      ...setSize,
      imgHeight: imgHeight,
      imgWidth: imgWidth,
      barHeight: barHeight,
      barWidth: barWidth
    };

    window.removeEventListener('touchmove', function (e) {
      move(e);
    });
    window.removeEventListener('mousemove', function (e) {
      move(e);
    });

    //鼠标松开
    window.removeEventListener('touchend', function () {
      end();
    });
    window.removeEventListener('mouseup', function () {
      end();
    });

    window.addEventListener('touchmove', function (e) {
      move(e);
    });
    window.addEventListener('mousemove', function (e) {
      move(e);
    });

    //鼠标松开
    window.addEventListener('touchend', function () {
      end();
    });
    window.addEventListener('mouseup', function () {
      end();
    });
  };
  // useEffect(() => {
  //   init();
  // }, [type]);
  useEffect(() => {
    // 禁止拖拽
    init();
    // proxy.$el.onselectstart = function () {
    //   return false;
    // };
  }, []);
  //鼠标按下
  const start = e => {
    console.log(e, '鼠标按下');
    e = e || window.event;
    let x = 0;
    if (!e.touches) {
      //兼容PC端
      x = e.clientX;
    } else {
      //兼容移动端
      x = e.touches[0].pageX;
    }
    startLeft.current = Math.floor(
      x - barArea.current.getBoundingClientRect().left
    );
    setStartMoveTime(startMoveTime + new Date()); //开始滑动的时间
    console.log(isEnd.current, 'isEnd鼠标按下');
    if (isEnd.current == false) {
      setText('');
      setMoveBlockBackgroundColor('#337ab7');
      setLeftBarBorderColor('#337AB7');
      setIconColor('#fff');
      e.stopPropagation();
      status.current = true;
      // setStatus(true);
    }
  };
  //鼠标移动
  const move = e => {
    e = e || window.event;
    if (status.current && isEnd.current == false) {
      // console.log(e,'鼠标移动')
      let x = 0;
      if (!e.touches) {
        //兼容PC端
        x = e.clientX;
      } else {
        //兼容移动端
        x = e.touches[0].pageX;
      }
      // console.log(barArea.current, 'barArea.current');
      var bar_area_left = barArea.current.getBoundingClientRect().left;
      // console.log(bar_area_left, 'bar_area_left');
      var move_block_left = x - bar_area_left; //小方块相对于父元素的left值
      if (
        move_block_left >=
        barArea.current.offsetWidth - parseInt(parseInt('50px') / 2) - 2
        // barArea.current.offsetWidth - parseInt(parseInt(blockSize.width) / 2) - 2
      ) {
        move_block_left =
          barArea.current.offsetWidth - parseInt(parseInt('50px') / 2) - 2;
      }
      if (move_block_left <= 0) {
        move_block_left = parseInt(parseInt('50px') / 2);
      }
      //拖动后小方块的left值
      setMoveBlockLeft(move_block_left - startLeft.current + 'px');
      moveBlockLefts.current = move_block_left - startLeft.current + 'px';
      setLeftBarWidth(move_block_left - startLeft.current + 'px');
    }
  };

  //鼠标松开
  const end = () => {
    console.log('鼠标松开');
    setEndMovetime(endMovetime + new Date());
    //判断是否重合
    if (status.current && isEnd.current == false) {
      console.log(setSize, 'setSizesetSizesetSize');
      console.log(setSizeData.current, 'setSizeData');
      console.log(moveBlockLefts.current, 'moveBlockLefts.current');
      let moveLeftDistance = parseInt(
        (moveBlockLefts.current || '0').replace('px', '')
      );
      console.log(
        moveLeftDistance,
        'moveLeftDistancemoveLeftDistancemoveLeftDistancemoveLeftDistance'
      );
      moveLeftDistance =
        (moveLeftDistance * 310) / parseInt(setSizeData.current.imgWidth);
      // (moveLeftDistance * 310) / parseInt(setSize.imgWidth);
      console.log(moveLeftDistance, 'moveLeftDistancemoveLeftDistance');
      // (moveLeftDistance * 310) / parseInt(setSize.current.imgWidth);
      let data = {
        captchaType: 'blockPuzzle',
        pointJson: secretKey.current
          ? aesEncrypt(
              JSON.stringify({x: moveLeftDistance, y: 5.0}),
              secretKey.current
            )
          : JSON.stringify({x: moveLeftDistance, y: 5.0}),
        token: backToken.current
      };
      console.log(data, 'datadatadatadata');
      reqCheckApi(data).then(res => {
        console.log(res, 'resresresresres');
        if (res.data.repCode == '0000') {
          setMoveBlockBackgroundColor('#5cb85c');
          setLeftBarBorderColor('#5cb85c');
          setIconColor('#fff');
          setIconClass('icon-check');
          setShowRefresh(false);
          isEnd.current = true;
          // setIsEnd(true);
          if (mode == 'pop') {
            setTimeout(() => {
              // proxy.$parent.clickShow = false;
              refresh();
            }, 2000);
          }
          setPassFlag(true);
          setTipWords(
            `${((endMovetime - startMoveTime) / 1000).toFixed(2)}s验证成功`
          );
          captchaVerification.current = secretKey.current
            ? aesEncrypt(
                backToken.current +
                  '---' +
                  JSON.stringify({x: moveLeftDistance, y: 5.0}),
                secretKey.current
              )
            : backToken.current +
              '---' +
              JSON.stringify({x: moveLeftDistance, y: 5.0});
          setTimeout(() => {
            setTipWords('');
            setShowObject(true);
          }, 1000);
          props.onSuccess({
            captchaVerification: captchaVerification.current
          })
        } else {
          setMoveBlockBackgroundColor('#d9534f');
          setLeftBarBorderColor('#d9534f');
          setIconColor('#fff');
          setIconClass('icon-closes');
          setPassFlag(false);
          setTimeout(function () {
            refresh();
          }, 1000);
          // proxy.$parent.$emit('error', proxy);
          setTipWords('验证失败');
          setTimeout(() => {
            setTipWords('');
          }, 1000);
        }
      });
      status.current = false;
      // setStatus(false);
    }
  };

  const refresh = async () => {
    setShowRefresh(true);
    setFinishText('');
    setTransitionLeft('left .3s');
    setMoveBlockLeft(0);
    moveBlockLefts.current = 0;

    setLeftBarWidth(undefined);
    setTransitionWidth('width .3s');

    setLeftBarBorderColor('#ddd');
    setMoveBlockBackgroundColor('#fff');
    setIconColor('#000');
    setIconClass('icon-right');
    isEnd.current = false;
    // setIsEnd(false);
    await getPictrue();
    setTimeout(() => {
      setTransitionWidth('');
      setTransitionLeft('');
      setText(explain);
    }, 300);
  };

  // 请求背景图片和验证图片
  const getPictrue = async () => {
    let data = {
      captchaType: 'blockPuzzle'
    };
    const res = await getCodeApi(data);
    console.log(res, 'resresresresres');
    if (res.data.repCode == '0000') {
      setBackImgBase(res.data.repData.originalImageBase64);
      setBlockBackImgBase(res.data.repData.jigsawImageBase64);
      backToken.current = res.data.repData.token;
      secretKey.current = res.data.repData.secretKey;
    } else {
      setTipWords(res.data.repMsg);
    }
  };

  return (
    <>
      <div className="verifybox-bottom" style={{position: 'relative'}}>
        <div
          style={{height: parseInt(setSize.imgHeight) + 5 + 'px'}}
          className="verify-img-out"
        >
          <div
            style={{
              width: setSize.imgWidth,
              height: setSize.imgHeight
            }}
            className="verify-img-panel"
          >
            <img
              src={'data:image/png;base64,' + backImgBase}
              alt=""
              style={{display: 'block', width: '100%', height: '100%'}}
            />
            {showRefresh && (
              <div className="verify-refresh" onClick={refresh}>
                <i className="iconfont icon-refresh"></i>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            width: setSize.imgWidth,
            height: '30px',
            lineHeight: '30px'
          }}
          className="verify-bar-area"
        >
          <span className="verify-msg">{text}</span>
          <div
            style={{
              width: leftBarWidth !== undefined ? leftBarWidth : '30px',
              height: '30px',
              borderColor: leftBarBorderColor,
              transaction: transitionWidth
            }}
            className="verify-left-bar"
          >
            <span className="verify-msg">{finishText}</span>
            <div
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: moveBlockBackgroundColor,
                left: moveBlockLeft,
                transition: transitionLeft
              }}
              className="verify-move-block"
              onMouseDown={start}
              onTouchStart={start}
            >
              <i
                className={`verify-icon iconfont ${iconClass}`}
                style={{color: iconColor}}
              ></i>
              <div
                style={{
                  width:
                    Math.floor(
                      (parseInt(setSize.imgWidth) * 47) / 310
                    ) + 'px',
                  height: setSize.imgHeight,
                  top: '-' + (parseInt(setSize.imgHeight) + 5) + 'px',
                  backgroundSize: setSize.imgWidth + ' ' + setSize.imgHeight
                }}
                className="verify-sub-block"
              >
                <img
                  src={'data:image/png;base64,' + blockBackImgBase}
                  alt=""
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    WebkitUserDrag: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
export default VerificationCode;
