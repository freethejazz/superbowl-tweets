'use strict';

let MongoClient = require('mongodb').MongoClient;
let nconf = require('nconf');

// Do the config thing
nconf.argv()
  .env()
  .file('config.json')
  .file('prod', '/etc/twitter-to-rabbit/config.json');

nconf.required([
  'mongo_host'
]);

const mongoUrl = `mongodb://${nconf.get('mongo_host')}:27017/superTweets`;

// Connect to mongo
var onMongo = new Promise((resolve, reject) => {
  MongoClient.connect(mongoUrl, (err, db) => {
    if(err) {
      reject(err);
    }

    else resolve(db.collection('sentiment'));
  });
});

onMongo.catch((err) => {
  console.error(err);
});

let q = function(fn) {
  return new Promise((resolve, reject) => {
    onMongo.then((coll) => {
      fn(coll).then(resolve).catch(reject);
    });
  });
};

let agg = function(pipeline) {
  return q((coll) => {
    return new Promise((resolve, reject) => {
      coll.aggregate(pipeline, (err, result) => {
        if(err) {
          reject(err);
        } else {
          resolve(result)
        }
      });
    })
  })
};

let count = function() {
  return q((coll) => coll.count());
};

let teamCounts = function() {
  return agg([
    { $group: {
      _id: "$affiliation",
      count: { $sum: 1 }
    }},
    { $project: {
      _id: 0,
      affiliation: "$_id",
      count: 1
    }}
  ]);
};

module.exports = {
  count,
  teamCounts
}
