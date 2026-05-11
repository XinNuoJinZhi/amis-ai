'use strict';

// module.exports = {
//   __init__: ['CamundaModdleExtension'],
//   camundaExtension: ['type', require('./camundaExtension')],
// };
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    __init__: ['CamundaModdleExtension'],
    camundaExtension: ['type', './camundaExtension'],
  }
}
else {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return {
        __init__: ['CamundaModdleExtension'],
        camundaExtension: ['type', './camundaExtension'],
      };
    });
  }
  else {
    window.PolyBezier = {
      __init__: ['CamundaModdleExtension'],
      camundaExtension: ['type', './camundaExtension'],
    };
  }
}