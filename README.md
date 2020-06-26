# umi-plugin-server
[![NPM version](https://img.shields.io/npm/v/socket-mock.svg?style=flat)](https://npmjs.org/package/socket-mock)
[![NPM downloads](http://img.shields.io/npm/dm/socket-mock.svg?style=flat)](https://npmjs.org/package/socket-mock)

这个模块是对mock的一次升级，主要弥补mock占用的时开发服务实例化的app，而这种方式是另外开启一个端口作为模拟服务器，使用proxy代理可以代理改服务，打包时会把整个的node服务打包成一个server-dist
另外umi-plugin-server 可以模拟ws服务在生成的server文件夹模板中进行server接口及ws服务的编码，保存后即可热更新。

## Install

```bash
yarn add umi-plugin-server
```

## Usage

Configure in `.umirc.ts`,

```js
//umi配置模拟ws服务
export default {
  server: { 
    port: 3333, //监听端口号
    watch: []  //监听的文件进行重新加载
  }
}
```
```js
//客户端方法引用
import {ws} from 'umi'
ws.init(`socket地址`,`uid=${me.uid}`)
ws.onMessage('msg',(data)=>{
  console.log(data)
  //the client witch uid==data.toUid will be send,it will show {type:'msg',data:'abc'}
})
ws.send({
  type:'msg',
  toUid:[to.uid],
  data:'abc'
})
```

## Options

TODO

## LICENSE

MIT
