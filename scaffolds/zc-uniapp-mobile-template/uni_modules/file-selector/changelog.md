## 1.0.5（2025-08-09）
- 修复ios报错问题
一些机型可能不支持new DataTransfer
## 1.0.4（2025-08-04）
- app 和 h5 内部 fetch 改为 xhr
- uploadFile 增加 onprogress 回调
- 新增 abort 中断上传

```js
import {
  chooseFile,
  uploadFile,
  clear,
  abort, // 中断上传
} from "@/uni_modules/file-selector/index.js";

const result = await uploadFile({
  file, // 传入file对象即可，内部出做处理
  url: `http://127.0.0.1:3000/index/uploadFile`,
  headers: {
    "x-token": "123",
  },
  onprogress(e) {
    // 上传进度，可以通过abort(file)中断
    // const p = (e.loaded / e.total * 100).toFixed(2)
    // const p = e.progress
  },
});
```

## 1.0.3（2025-08-04）
- app 和 h5 内部 fetch 改为 xhr
- uploadFile 增加 onprogress 回调
- 新增 abort 中断上传

```js
import {
  chooseFile,
  uploadFile,
  clear,
  abort, // 中断上传
} from "@/uni_modules/file-selector/index.js";

const result = await uploadFile({
  file, // 传入file对象即可，内部出做处理
  url: `http://127.0.0.1:3000/index/uploadFile`,
  headers: {
    "x-token": "123",
  },
  onprogress(e) {
    // 上传进度，可以通过abort(file)中断
    // const p = (e.loaded / e.total * 100).toFixed(2)
    // const p = e.progress
  },
});
```

## 1.0.2（2025-08-03）
- 增加权限请求示例。

```js
// 权限请求
import {
  usePhotoLibraryPermission,
  useAppPermission,
} from "@/uni_modules/cc-uniuse/index.js";
const { hasPermission } = usePhotoLibraryPermission();
const { goSettings } = useAppPermission();

const seleFile = async () => {
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

  // 选择文件
  const files = await chooseFile();
};
```

## 1.0.1（2025-08-01）
#### 统一处理上传错误

```js
try {
  const result = await uploadFile({
    name: "file",
    file, // 传入file对象即可，内部出做处理
    url: `http://127.0.0.1:3000/index/uploadFile`,
    // url: `http://192.168.1.8:3000/index/uploadFile`,
    headers: {
      "x-token": "123",
    },
  });
  url.value = result.data.url;
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
```

## 1.0.0（2025-07-31）
first commit
