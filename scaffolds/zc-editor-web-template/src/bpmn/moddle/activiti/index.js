/*
 * @author igdianov
 * address https://github.com/igdianov/activiti-bpmn-moddle
 * */

// module.exports = {
//   __init__: ['ActivitiModdleExtension'],
//   activitiExtension: ['type', require('./activitiExtension')],
// };
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
  __init__: ['ActivitiModdleExtension'],
  activitiExtension: ['type', './activitiExtension'],
};
}
else {
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return {
  __init__: ['ActivitiModdleExtension'],
  activitiExtension: ['type', './activitiExtension'],
};
    });
  }
  else {
    window.PolyBezier = {
  __init__: ['ActivitiModdleExtension'],
  activitiExtension: ['type', './activitiExtension'],
};
  }
}