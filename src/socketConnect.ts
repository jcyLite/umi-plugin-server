const uuid = require('node-uuid');
function isJSON(data: any) {
    try {
        JSON.parse(data);
        return true;
    } catch (e) {
        return false;
    }
}
function closeHandle(fromUid: string, wss: any) {
    wss.clients.forEach((item: any, index: any) => {
        if (item.uid == fromUid) {
            item.send(JSON.stringify({
                type:'close'
            }));
        }
    })
}

export default function socketConnect(wss: any) {
    if (!process.env.socketInit) {
        wss.onlinePeople = [];
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
        wss.on('connection', function (ws: any) {
            process.env.socketInit = 'ok';
            ws.on('message', function (this: any, jsonStr: any, flags: any) {
                jsonStr = jsonStr || '{}';
                if (!isJSON(jsonStr)) {
                    return console.error('数据不是json格式');
                }
                var info = eval('(' + jsonStr + ')');
                info.date = new Date().getTime();//消息创建时间
                info.mid = uuid.v1();//消息设置id
                if (info.type == 'connect') {
                    //被迫下线机制
                    closeHandle(info.fromUid, wss)
                    this.uid = info.fromUid;//初始化绑定uid
                }
                wss.methods = wss.methods || {};
                if(wss.methods[info.type]){
                    let d=wss.methods[info.type].call(this, info);
                    wss.broadcast(d)
                }
               
                
            });
            ws.on('close', function (this: any) {
                wss.methods['close']?.call(this)
            });
        });
    }

}