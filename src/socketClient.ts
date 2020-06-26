
function setQueue(this:any,key:string,type:string,fn:Function){
  if(this.queue[key][type]){
    //判断fn是否同源
    let index=this.queue[key][type].map((item:Function)=>item.toString()).indexOf(fn.toString())
    if(index==-1){
      this.queue[key][type].push(fn)
    }else{
      this.queue[key][type].splice(index,1,fn)
    }
  }else{
    this.queue[key][type] = [fn]
  }
}
const config={
  voice:{

  }
}
export class createWs{  //当多个客户端在一个url地址时使用此方法可构造多个socket
  private ows: any;
  private queue:{other:any,mine:any};
  private config: { voice: any }
  public isInit:Boolean;
  constructor(src:string|void,uid:string|void){
    this.ows=null;
    this.isInit=false;
    this.config={
      voice:{
        
      }
    }
    this.queue={
      other:{},
      mine:{}
    }
    if(src){
      this.init(src,uid);
    }
  }
  public close(){
    this.ows.close();
    this.isInit=false;
    this.ows=null;
  }
  public emit(type: string, data?: any) {
    this.queue['mine'][type]?.forEach((item: any) => {
      item(data);
    });
  }
  public send(data: any) {
    if(this.ows){
      this.ows.send(JSON.stringify(data));
    }else{
      console.error('ws没有初始化')
    }
  }
  public set({voice}:any){
    config.voice=voice;
  }
  init(src: string, uid: string|void) {
    if(this.isInit){
      return console.info('该id已经初始化')
    };
    let msg='';
    if(uid){
      msg='?uid='+uid
    }
    this.ows = new WebSocket(src+msg);
    this.ows.onopen = ()=>{
      //发出ws连接消息
      this.isInit = true;
      this.queue.mine['wsopen']?.forEach((item:Function)=>{
        item();
      })
      this.ows.send(
        JSON.stringify({
          type: 'connect',
          toUid:'all',
          fromUid:uid
        }),
      );
    };
    this.ows.onerror =()=>{
        this.queue.mine['wserror']?.forEach((item:Function)=>{
          item();
        })
        console.log("socket连接错误!");
        this.isInit=false;
        this.ows=null;
    };
    this.ows.onclose=()=>{
      console.log('close')
      this.queue.mine['wsclose']?.forEach((item:Function)=>{
        item();
      })
      this.isInit = false;
      this.ows=null;
    }
    this.ows.onmessage = (d: any)=>{
      let data = JSON.parse(d.data);
      this.queue.other[data.type]?.forEach((item:Function)=>{
        if(this.config.voice[data.type]){//消息声音设置
          var audio = document.createElement("audio");
          audio.src = this.config.voice[data.type];
          audio.play();
        }

        item(data);
      }) 
    };
  }
  on(this:any,type: string, fn: Function){
    setQueue.call(this,'mine',type,fn)//自己的消息队列
  }
  onMessage(this:any,type: string, fn: Function) {
    setQueue.call(this,'other',type,fn)//别人的消息队列
  }
}
interface wsType{
  isInit:Boolean;
  send:Function;
  emit:Function;
  init:Function;
  onMessage:Function;
  on:Function;
  set:Function;
  close:Function;
}
export let ws:wsType = new createWs();//当客户端仅有一个的时候使用此方法比较方便