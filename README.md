# umi-plugin-server
这个模块是对mock的一次升级，主要弥补mock占用的时开发服务实例化的app，而这种方式是另外开启一个端口作为模拟服务器，使用proxy代理可以代理改服务，打包时会把整个的node服务打包成一个server-dist
另外umi-plugin-server 可以模拟ws服务在生成的server文件夹模板中进行server接口及ws服务的编码，保存后即可热更新。

## Install

```bash
yarn add umi-plugin-server
```

## Usage

Configure in `.umirc.ts`,

```js
//开发时
//umi配置模拟ws服务
export default {
  server: { 
    port: 3333, //监听端口号
    watch: []  //监听的文件进行重新加载
  }
}
//创建项目模板
umi server g server
选择三种模式
1、空模板
2、根据swagger创建,使用在项目中使用mockjs
3、根据swagger创建,使用mockjs生成好数据

//创建service模板
umi server g service

//运行时
运行命令 umi server run即可
运行命令 umi server run --watch 可以监听文件修改即时修改缓存内容
运行命令 umi server run --port=3003 可以指定运行端口好为3003

//打包为node服务
运行命令 umi server build即可
生产的产物约定为server目录下的dist文件夹
然后  node server/dist 即可运行服务
```
```js
//客户端socket调用；
import {ws} from 'umi'
ws.init(`socket地址`,`uid=${me.uid}`)
//服务端消息交互
ws.onMessage('msg',(data)=>{ //收到一条来自服务端的消息
  console.log(data)
  //the client witch uid==data.toUid will be send,it will show {type:'msg',data:'abc'}
})
ws.send({
  type:'msg',
  toUid:[to.uid],
  data:'abc'
})
//本地消息交互
ws.on('msg',(data)=>{//收到一条来自本地服务的消息
  console.log(data)
})
ws.emit('msg',{
  ...data
})
//服务端重定义广播规则
//在server文件的入口文件index中 重定义此方法，即可改变广播规则，默认规则如下：
wss.broadcast = function (info: any) {
    this.clients.forEach(function (this: any, client: any) {
        if (info.toUid == 'all') {//发送给所有人
            client.send(JSON.stringify(info));
        } else if (info.toUid == 'exceptMe') {
            if (client.uid != info.fromUid) {
                client.send(JSON.stringify(info));
            }
        } else if (typeof (info.toUid) == 'string') {//发送给指定人
            if (client.uid == info.toUid) {
                client.send(
                    JSON.stringify(info),
                );
            }
        } else if (info.toUid.length) {//群发
            info.toUid.forEach((item: any) => {
                if (client.uid == item) {
                    client.send(
                        JSON.stringify(info),
                    );
                }
            })
        }
    });
};
```




## Options

TODO

## LICENSE

MIT
