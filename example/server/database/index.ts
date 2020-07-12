const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./database/db.db', (err:any) => {
  db.run(
    'create table if not exists user (username TEXT,password TEXT,uid TEXT)',
    (err:any) => {
      if (err) throw err;
    },
  );
});
export default db;
