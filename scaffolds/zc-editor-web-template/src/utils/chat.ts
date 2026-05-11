import bus from '@/utils/bus';

// 注册chat事件
export const registerChatEvent = (events: any[], fun: (val: any) => void): any => {
  return {
    actionType: "custom",
    script: function(_: any, doAction: any, event: any) {
      events && events.forEach(eventName => {
        bus.on(eventName, (val) => {
          fun({
            busValue: val,
            event,
            eventName,
            doAction
          })
        });
      })
    }
  }
}