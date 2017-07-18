const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://nam:password@ds149382.mlab.com:49382/fiveipoffices';

let db;
async function getDb() {
  if (!db) {
    db = await MongoClient.connect(url);
  }
  return db;
}

module.exports = getDb;
