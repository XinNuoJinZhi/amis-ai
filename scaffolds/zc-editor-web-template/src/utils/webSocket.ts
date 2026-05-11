import bus from '@/utils/bus'
import { getAccessToken } from '@/utils/auth'
import { socketUrl } from '@/utils/env'
const io = (window as any).io
const SOCKET_URL = socketUrl
const SocketioClient = {
  createNew: (url: string) => {
    const client: any = {}
    client.socket = io(
      `${url}?accessToken=${getAccessToken()}` /*, {'force new connection': true, transports: ['websocket'] }*/
    )
    client.socket.on('connect', () => {
      console.log(client.socket.id) // 'G5p5...'
    })
    client.socket.on('connect', () => {
      console.log('连接成功')
    })
    client.socket.on('connect_error', (error: string) => {
      console.error('连接错误' + error)
    })
    client.socket.on('connect_timeout', () => {
      console.log('连接超时')
    })
    client.socket.on('error', () => {
      //错误发生无法被其它事件类型处理
      // ...
    })
    client.socket.on('disconnect', () => {
      console.log('关闭连接')
    })
    client.socket.on('reconnect', () => {
      console.log('重新连接')
    })
    client.socket.on('reconnect_error', () => {
      console.log('连接错误')
      // ...
    })
    client.socket.on('reconnect_failed', () => {
      console.log('连接失败')
      // ...
    })
    client.socket.on('ping', () => {
      // console.log("向服务器端发送数据包");
    })
    client.socket.on('pong', () => {
      // console.log("接收服务器数据包");
    })
    // 向服务端发送消息
    client.send = function (event: any, msg: string, callback: any) {
      if (callback) {
        client.socket.emit(event, msg, () => callback)
      } else {
        client.socket.emit(event, msg)
      }
    }
    // 接收服务端消息
    client.receive = function (event: any, callback: any) {
      client.socket.on(event, callback)
    }
    //移除事件监听
    client.removeListener = function (event: any, callback: any) {
      if (callback) {
        client.socket.off(event, callback)
        console.log('callback事件：' + event + '关闭监听')
      } else {
        client.socket.off(event)
        console.log('event事件：' + event + '关闭监听')
      }
    }
    return client
  }
}
let fullSocket = null
export const openSocket = ()=>{
  const url = SOCKET_URL
  fullSocket = SocketioClient.createNew(url)
  fullSocket.receive('action', async (data: any) => {
    const resMsg = JSON.parse(data)
    switch (resMsg.type) {
      case 'refresh':
        bus.emit('refresh', resMsg.target)
        break
      case 'refreshCache':
        bus.emit('refreshCache', resMsg.target)
        break
      case 'reload':
        bus.emit('reload', resMsg.target)
        break
    }
  })
}
