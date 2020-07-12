export default function(port:number){
    return `
        const {app,wss,server} = require('./appInit').default();
        let out=require('./server-dist');
        let a=out(wss,app);
        wss.methods=a.ws;
        app.mtd=a.api;
        server.listen('${port}',()=>{
            console.log('server start at port ${port}')
        })
    `
}
