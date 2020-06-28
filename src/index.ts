// ref:
// - https://umijs.org/plugins/api
import { IApi } from '@umijs/types';
import chokidar from 'chokidar';
import path from 'path'
import signale from 'signale';
import socketConnect from './socketConnect';
import createApp from './appInit'
import jcyFs from 'jcy-fs'
var inquirer = require("inquirer");
const fs = require('fs')

function chooseTpl(cwd:any){
    inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: "choose a type of template replace?",
        choices: [
          { name: "IM from CSM", value: "a", checked: true },
          { name: "no change", value: "b" }
        ]
      }
    ])
    .then((answers:any) => {
      if(answers.type=='a'){
        jcyFs.copyDir(path.resolve(__dirname,'../tpl/server'),path.resolve(cwd, './server'))
        signale.success('build tpl success')
      }else if(answers.type=='b'){
        console.log('did not generate directory')
      }
    });
}
function handle(cwd:string,app:any,wss:any) {
  let out=require(path.resolve(cwd, './server/index.ts'));
  let a=out.default(wss,app);
  wss.methods=a.ws;
  app.mtd=a.api;
}
function cleanRequireCache(file2: string,cwd:string) {
  Object.keys(require.cache).forEach(file => {
    if(file.indexOf(path.resolve(cwd, './server'))==0){
      delete require.cache[file];
    }
  });
}
export default function (api: IApi) {
  if(!fs.existsSync(path.resolve(api.cwd, './server'))){
    signale.info('your project did not exists direction server , it will create a tpl from umi-plugin-server')
    jcyFs.copyDir(path.resolve(__dirname,'../tpl/server'),path.resolve(api.cwd, './server'))
  }
  api.describe({
    key: 'server',
    config:{
      schema(joi:any) {
        return joi.object();
      },
    },
    enableBy:api.EnableBy.config
  });
  api.addUmiExports(() => [
      {
        exportAll: true,
        source: 'umi-plugin-server/lib/socketClient',
      }
  ])
  api.onStart(()=>{
    if(api.env=='development'){
      if(api.config.server){
        api.babelRegister.setOnlyMap({
          
          key: 'server',
          value: [path.resolve(api.cwd)]
        });
        api.config.server.port=api.config.server.port||3333
      }else{
        api.logger.info('if you want to use umi-plugin-server , you should register server in umi config like server:{port:3333}');
      }
    }
  })
  api.registerCommand({
    name:'server',
    alias:'s',
    fn({args}){
      console.log(args)
      if(args._[0]=='g'){
        if(args._[1]=='server'){
          chooseTpl(api.cwd)
        }else if(args._[1]=='service'){
          jcyFs.copyDir(path.resolve(__dirname,'../tpl/service'),path.resolve(api.cwd, './src/service'))
        }
      }
    }
  })
  api.onDevCompileDone(({isFirstCompile}:any)=>{
    //开发环境的回调
    if(api.config.server&&isFirstCompile){
      const {app,wss,server} = createApp();
      handle(api.cwd,app,wss)
      socketConnect(wss);
      //监听文件修改 清除该文件换成重新引入
      function watchedFile(arr:Array<string>){
        return arr.map((item:string)=>path.resolve(api.cwd,item))
      }
      
      server.listen(api.config.server.port);
      console.log(`  - socket:   ${api.utils.chalk.cyan(`ws://localhost:${api.config.server.port}`)}`)
      console.log(` - node server:   ${api.utils.chalk.cyan(`http://localhost:${api.config.server.port}`)}`)
      chokidar.watch(watchedFile(['./server'].concat(api.config.server.watch||[])), {
        ignoreInitial: true
      }).on('all', (event: any, file2: string) => {
        cleanRequireCache(file2,api.cwd);
        handle(api.cwd,app,wss)
        signale.success(`${file2} changed and ./server/index.ts has rebuilded`);
      })
    }
  })
}
