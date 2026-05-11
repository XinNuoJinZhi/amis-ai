# 文件选择器

此插件是一个跨平台文件选择器兼上传功能。支持微信小程序、h5、app。
其中微信小程序选择文件是：uni.chooseMessageFile
h5 和 app（这里是 render.js）是 input 标签 type=[file]

#### 方法及参数说明

```js
/**
 * File
 * @typedef {Object} File
 * @property {String} id 唯一id
 * @property {String} name 文件名
 * @property {Number} size 文件大小
 * @property {String} ext 文件后缀 如：png、zip
 */

/**
 * 选择文件
 * @param {Object} options
 * app：使用后缀名（比如.txt）过滤会导致无法选择文件（小米15是只有相机选项了）.有效值类似：image/*、video/*、audio/*，但是最后选择的东西可能需要手动过滤一下
 * 微信小程序:只有type是image或video时，accept才会生效，有效值类似：".png,.jpg"（多个以逗号分隔）
 * @param {String} options.accept 文件类型,默认不限制。
 * @param {String} options.type 文件类型,微信小程序专属，有效值：all、image、video
 * @param {Number} options.count 文件数量,微信小程序专属，与multiple使用一个即可
 * @param {Boolean} options.multiple 是否多选，默认为 false。
 * @returns {Promise<Array<File>>}
 */
const chooseFile = async (options = {}) => {};

/**
 * 上传文件,小程序是uni.uploadFile,app和h5使用的fetch
 * @param {Object} options
 * @param {String} options.url 上传地址
 * @param {String} options.name FormData的key值，默认是：file
 * @param {Object} options.headers header,主要放鉴权token等数据
 * @param {File} options.file chooseFile得到的文件对象，内部主要使用File.id属性
 * @param {Function} options.onprogress 上传进度回调
 * @returns {Promise}
 */
const uploadFile = async (options = {}) => {};


/**
 * 中断上传
 * @param {File} chooseFile得到的文件对象，file 可选属性参数。如果同时只有一个文件上传可以忽略
 */
const abort = (file)=>{}


/**
 * 清理内部资源和事件，组件内在页面销毁自动自行，也可以手动执行
 */
const clear = () => {};
```

#### 使用方法

1. 启动 /其他/upload 下的 nodejs 服务(npm run start)，就可以测试上传文件了

```html
<template>
  <view class="content">
    <FileSelector />
    <button @click="seleFile">文件选择</button>
  </view>
</template>
```

```js
import { onUnmounted } from "vue";
import {
  chooseFile,
  uploadFile,
  clear,
  abort, // 中断上传
} from "@/uni_modules/file-selector/index.js";
import FileSelector from "@/uni_modules/file-selector/components/file-selector/file-selector.vue";

// 权限请求
import {
  usePhotoLibraryPermission,
  useAppPermission,
} from "@/uni_modules/cc-uniuse/index.js";
const { hasPermission } = usePhotoLibraryPermission();
const { goSettings } = useAppPermission();

onUnmounted(() => {
  clear();
});

const seleFile = async () => {
  // #ifdef APP-PLUS
  // 可以先请求权限
  // const [ok, status] = await hasPermission(true) // 只请求读取权限
  const [ok, status] = await hasPermission(); // 默认读取写入权限，此时已经包括读取
  if (status == -1) {
    // 永久拒绝或者，点击了蒙版
    uni.showModal({
      title: "温馨提示",
      content: "检查到您目前没有权限继续操作，是否前往设置界面授权？",
      success(res) {
        res.confirm && goSettings();
      },
    });
    return;
  }
  if (!ok) return;

  // #endif

  // 选择文件
  const files = await chooseFile();
  if (!files.length) {
    uni.showToast({
      icon: "none",
      title: "取消选择",
    });
    return;
  }
  const [file] = files;
  try {
    const result = await uploadFile({
      // name: "file",
      file, // 传入file对象即可，内部出做处理
      url: `http://127.0.0.1:3000/index/uploadFile`,
      // url: `http://192.168.1.8:3000/index/uploadFile`,
      headers: {
        "x-token": "123",
      },
      onprogress(e) { // 上传进度，可以通过abort(file)中断
        // const p = (e.loaded / e.total * 100).toFixed(2)
        // const p = e.progress
      },
    });
    console.log("result", result);
  } catch (error) {
    // 大多数情况是不需要处理错误的
    // 401,500,404，跨域、未知错误等
    if (error instanceof Error) {
      uni.showToast({
        icon: "none",
        title: error.message,
      });
      console.log("Error：", error);
      return;
    }

    if (error?.statusCode) {
      uni.showToast({
        icon: "none",
        title: String(error.statusCode),
      });
      console.log("statusCode error:", error);
    }
  }
};

```
