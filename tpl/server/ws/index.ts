import db from '../database';
export default function(wss: any) {
  let onlinePeople = [];
  return {
    msg(info: any) {
      wss.clients.forEach(item => {
        console.log(item.uid);
      });
      return info;
    },
    connect(info: any) {
      console.log(info.fromUid + ' connected');
      onlinePeople.push(info.uid);
      return info;
    },
    close(this: any) {
      console.log(this.uid + ' disconnected');
      onlinePeople.splice(onlinePeople.indexOf(this.uid), 1);
    },
  };
}
