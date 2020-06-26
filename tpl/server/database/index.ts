const sqlite3 = require('sqlite3');
const express = require('express');
var db = new sqlite3.Database('./database/db.db', err => {
  db.run(
    'create table if not exists user (username TEXT,password TEXT,uid TEXT)',
    err => {
      if (err) throw err;
    },
  );
});
export default db;
