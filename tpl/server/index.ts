import api from './api';
import ws from './ws';
export default function (wss: any, app: any) {
  return {
    ws: ws(wss),
    api,
  };
}
