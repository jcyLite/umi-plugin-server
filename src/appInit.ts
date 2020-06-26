const http = require('http');
const express = require('express');
const bodyParser = require("body-parser");
const app = express()
const WebSocketServer = require('ws').Server;

export default function () {
    const server = http.createServer(app);
    const wss = new WebSocketServer({
        server,
        clientTracking: true,
        verifyClient(info: any) {
            //解析uid
        
            let ids: any = [];
            let a = true;
            let uid = info.req.url.split('?')[1].split('=')[1];
            wss.clients?.forEach((item: any, index: any) => {
                if (ids.indexOf(item.uid) != -1) {
                    delete wss.clients[ids.indexOf(item.uid)];
                } else {
                    ids.push(item.uid)
                }
            })
            return true; //否则拒绝
        }
    });
    app.mtd = {}
    app.use(function (req: any, res: any, next: any) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", ' 3.2.1');
        res.header("Content-Type", "application/json;charset=utf-8");
        next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true  }))
    app.all(
        '*',
        function (req: any, res: any, next: any) {
            let keys: any = [];
            let urls: any = [];
            let methods: any = [];
            let funcs: any = [];
            for (var key in app.mtd) {
                let i = key.split(' ')
                urls.push(i[1] || i[0])
                if (i.length == 2) {
                    methods.push(i[0])
                } else if (i.length == 1) {
                    methods.push('all')
                }
                keys.push(key)
                funcs.push(app.mtd[key])
            }
            let url = req.url.split('?')[0];
            let index = urls.indexOf(url);
            if (methods[index] == 'all' || (methods[index] ?.toLowerCase() == req.method.toLowerCase())) {
                funcs[index] && funcs[index](req, res);
            } else {
                res.json({
                    code: 100,
                    message: `请求类型只接受${methods[index]}`
                })
            }
        },
    );
    return { wss, server, app };
}
