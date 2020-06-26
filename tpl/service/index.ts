import { extend } from 'umi-request';
import { notification, message } from 'antd';
// import {useSelector} from 'dva'
// let uid: any = useSelector((state: any) => {
//     return state.user.uid;
//   });
const codeMessage: any = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序
 */
const errorHandler = (error: any) => {
  const { response } = error;
  if (response?.status == 403) {
    location.href = response.headers.get('redirect');
  } else if (response?.status == 500) {
    notification.error({
      message: `请求错误 500`,
      description: '服務器出錯',
    });
  }
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    notification.error({
      message: `请求错误 ${status},网关超时`,
      description: url,
    });
  }

  return response;
};

const request = extend({
  timeout: 300000,
  errorHandler,
  // 默认错误处理
  credentials: 'include', // 默认请求是否带上cookie
});

// request拦截器, 改变url 或 options.
request.interceptors.request.use((url: any, options: any) => {
  // if(process.env.NODE_ENV=='development'){
  //   notification.info({
  //     message: `客户端发出请求 ${url}`,
  //     description: '发送一条服务器请求',
  //   });
  // }
  let headers = {
    'x-requested-with': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (location.search && location.search.slice(1)) {
    var pre = '';
    location.search
      .slice(1)
      .split('&')
      .forEach((item: string) => {
        if (item.includes('token_prefix')) {
          pre = item.split('=')[1];
        }
      });

    location.search
      .slice(1)
      .split('&')
      .forEach((item: string) => {
        if (item.includes('access_token') || item.includes('refresh_token')) {
          if (pre != '') {
            document.cookie = pre + '_' + item + '; path=/;';
          } else {
            document.cookie = item + '; path=/;';
          }
        }
      });
    location.href = location.origin + location.pathname;
  }

  // options.params.access_token=access_token;
  return {
    url: url,
    options: { ...options, headers },
  };
});

// response拦截器, 处理response
request.interceptors.response.use((response: any, options) => {
  return response;
});

request.use(function(ctx, next: any) {
  return next().then(function() {
    if (ctx.res.code != 0) {
      console.log(ctx.req);
      notification.error({
        message: `请求错误 code ${ctx.res.code}`,
        description: `服务器抛出code不为0的异常 请求url为：${ctx.req.url}`,
      });
      ctx.res = Object.assign(ctx.res, []);
    } else {
      ctx.res = ctx.res;
    }
  });
});

export default request;
