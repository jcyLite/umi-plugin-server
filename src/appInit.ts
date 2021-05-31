import http from 'http'
import express,{Response,Request,NextFunction} from 'express';
import bodyParser from "body-parser";
import ws from 'ws'
type Extended<T,B> = T&B
type ExpressExtend= ReturnType<typeof express> & {
    mtd:{
        [k:string]:(req:Request,res:Response)=>void
    }
}
const app= express() as ExpressExtend;


export default function () {
    const server = http.createServer(app);
    const wss = new ws.Server({
        server,
        clientTracking: true,
        verifyClient(info,callback) {
            let ids:string[] = [];
            wss.clients&&wss.clients.forEach((item, index) => {
                if (ids.indexOf((item as any).uid) != -1) {
                    delete wss.clients[ids.indexOf((item as any).uid)];
                } else {
                    ids.push((item as any).uid)
                }
            })
            return true; //否则拒绝
        }
    });
    app.mtd = {}
    app.use(function (req, res, next) {
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
        function (req, res, next) {
            let keys = [];
            let urls = [];
            let methods = [];
            let urlsMtds = [];
            let funcs = [];
            for (var key in app.mtd) {
                let i = key.split(' ')
                urls.push(i[1] || i[0])
                if (i.length == 2) {
                    methods.push(i[0])
                    urls.push(i[1])
                    urlsMtds.push(i[0].toLowerCase()+' '+i[1])
                } else if (i.length == 1) {
                    methods.push('all')
                    urls.push(i[0])
                    urlsMtds.push(i[0])
                }
                keys.push(key)
                funcs.push(app.mtd[key])
            }
            let url = req.url.split('?')[0];
            let index = urlsMtds.lastIndexOf(req.method.toLowerCase()+' '+url);
            if(index==-1){ //如果没找到试试 是不是methods是all
                index = urlsMtds.lastIndexOf(url);
            }   
            if (methods[index] == 'all' || (methods[index] &&methods[index].toLowerCase() == req.method.toLowerCase())) {
                funcs[index] && funcs[index](req, res);
            } else {
                if(methods[index]){
                    res.json({
                        code: 100,
                        message: `请求类型只接受${methods[index]}`
                    })
                }else{
                    res.json({
                        code: 404,
                        message: `无此方法`
                    })
                }
                
            }
        },
    );
    return { wss, server, app };
}
