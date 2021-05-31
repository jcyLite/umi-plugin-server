// ref:
// - https://umijs.org/plugins/api
import { IApi } from '@umijs/types' ;
import chokidar from 'chokidar';
import path from 'path'
import signale from 'signale';
import prod from './prod'
import socketConnect from './socketConnect';
import createApp from './appInit'
import jcyFs from 'jcy-fs'
import chalk from 'chalk'
const { synchronizeSwagger } = require('./synchronizeSwagger.js')
const { exec } = require('child_process');
var inquirer = require("inquirer");
const fatherBuild = require('father-build')
const fs = require('fs')

function chooseTpl(cwd:any){
    inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: "choose a type of template replace?",
        choices: [
          { name: "空模板", value: "a", checked: true },
          { name: "根据swagger创建,使用在项目中使用mockjs", value: "b" },
          { name: "根据swagger创建,使用mockjs生成好数据", value: "c" }
        ]
      }
    ])
    .then((answers:any) => {
      if(answers.type=='a'){
        jcyFs.copyDir(path.resolve(__dirname,'../tpl/server'),path.resolve(cwd, './server'))
        signale.success('build tpl success')
      }else if(answers.type=='b'||(answers.type=='c')){
        let log=console.log;
        console.log(chalk.yellow('读取配置中...'));
        function create(){
          let data=require(path.join(cwd, 'swagger.config.js'))
          jcyFs.copyDir(path.resolve(__dirname,'../tpl/server'),path.resolve(cwd, './server'))

          synchronizeSwagger.init(data,answers.type).then((item:any) => {
            log(chalk.yellow('0%'))
            if (item.state === 'success') {
              log(chalk.green('100%'))
              log(chalk.green('生成mock成功！'))
            }
          }).catch((err:any) => {
            log(chalk.red('生成mock失败！'))
            console.log(err)
          })
        }
        if(! fs.existsSync(path.resolve(cwd, 'swagger.config.js'))){//无此文件则动态创建一个
          inquirer.prompt([
            {
              type:'input',
              name:'url',
              message:'input your swagger url',
            }
          ]).then((d:any)=>{
            fs.writeFileSync(path.resolve(cwd, 'swagger.config.js'),`
              module.exports = {
                url: '${d.url}', // swagger-api的文档地址（可以在network中找到）
              };
            `)
            create();
          })
          return;
        }else{
          create();
        }
        
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
  //监听文件修改 清除该文件换成重新引入
  function watchedFile(arr:Array<string>){
    return arr.map((item:string)=>path.resolve(api.cwd,item))
  }
  function chokidarWatch(app:any,wss:any){
    chokidar.watch(watchedFile(['./server'].concat(api.config.server.watch||[])), {
      ignoreInitial: true
    }).on('all', (event: any, file2: string) => {
      cleanRequireCache(file2,api.cwd);
      handle(api.cwd,app,wss)
      signale.success(`${file2} changed and ./server/src/index.ts has rebuilded`);
    })
  }
  function run(watch?:any){
    api.babelRegister.setOnlyMap({
      key: 'server',
      value: [path.resolve(api.cwd)]
    });
    api.config.server.port=api.config.server.port||3333
    const {app,wss,server} = createApp();
    handle(api.cwd,app,wss)
    socketConnect(wss);
    server.listen(api.config.server.port);
    if(watch){
      chokidarWatch(app,wss)
    }
    console.log(`  - socket:   ${api.utils.chalk.cyan(`ws://localhost:${api.config.server.port}`)}`)
    console.log(` - node server:   ${api.utils.chalk.cyan(`http://localhost:${api.config.server.port}`)}`)
  }
  api.registerCommand({
    name:'server',
    alias:'s',
    fn({args}){
      if(args._[0]=='g'){
        if(args._[1]=='server'){
          chooseTpl(api.cwd)
        }else if(args._[1]=='service'){
          jcyFs.copyDir(path.resolve(__dirname,'../tpl/service'),path.resolve(api.cwd, './src/service'))
        }
      }
      if(args._[0]=='run'){//生成环境命令
        run(args.watch)
      }
      if(args._[0]=='build'){//打包为node服务
        fatherBuild.default({
          cwd:path.resolve(api.cwd,'./server'),
          buildArgs:{
            target: 'node',
            file:'./server-dist',
            entry:'./index',
            cjs: {lazy:false},
            disableTypeCheck: true,
            extraBabelPlugins: [
              [
                'babel-plugin-import',
                { libraryName: 'antd', libraryDirectory: 'es', style: true },
                'antd',
              ],
            ],
          }
        }).then((d:any)=>{
          //完成后需要将prod拷贝到dist中
          let res=prod(args.port||api.config.server.port||3333)
          //写入对应文件中
          fs.writeFile(path.resolve(api.cwd,'./server/dist/index.js'),res,()=>{});
          fs.copyFile(path.resolve(__dirname,'./appInit.js'),path.resolve(api.cwd,'./server/dist/appInit.js'),()=>{})
        })

      }
    }
  })
  api.onDevCompileDone(({isFirstCompile}:any)=>{
    //开发环境的回调
    if(api.config.server&&isFirstCompile){
      run(true)
    }
  })
}
