'use strict';

// module.exports = {
//   __init__: ['FlowableExtension'],
//   flowableExtension: ['type', require('./flowableExtension')],
// };
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    __init__: ['flowableExtension'],
    // 关键修复：通过 require 加载实际模块
    flowableExtension: ['type', require('./flowableExtension')],
  };
}
// AMD 和全局模式下同理，需要加载模块
else if (typeof define === 'function' && define.amd) {
  define(['./flowableExtension'], function (FlowableExtension) {
    return {
      __init__: ['FlowableExtension'],
      flowableExtension: ['type', FlowableExtension],
    };
  });
} else {
  // 全局模式下先加载 flowableExtension.js
  window.PolyBezier = {
    __init__: ['FlowableExtension'],
    flowableExtension: ['type', window.FlowableExtension], // 假设全局暴露了该模块
  };
}
