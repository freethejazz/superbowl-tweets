'use strict';

let nconf = require('nconf');
let amqplib = require('amqplib');
let MongoClient = require('mongodb').MongoClient;

// Do the config thing
nconf.argv()
  .env()
  .file('config.json')
  .file('prod', '/etc/twitter-to-rabbit/config.json');

nconf.required([
  'rabbit_host',
  'rabbit_exchange',
  'simple_queue',
  'mongo_host'
]);


const ex = nconf.get('rabbit_exchange');
const qName = nconf.get('simple_queue');
const mongoUrl = `mongodb://${nconf.get('mongo_host')}:27017/superTweets`;

let writeDoc = function(coll, doc) {
  coll.insertOne(doc, function(err, result) {
    if(err) {
      console.error(err);
    } else {
      console.log(`Wrote doc with id: ${doc.id}`);
    }
  });
};

// Connect to mongo
var onMongo = new Promise((resolve, reject) => {
  MongoClient.connect(mongoUrl, (err, db) => {
    if(err) {
      reject(err);
    }

    else resolve(db.collection('simple'));
  });
});

onMongo.catch((err) => {
  console.error(err);
});

// Connect to Rabbit and start consuming
onMongo.then((coll) => {
  let open = amqplib.connect(`amqp://${nconf.get('rabbit_host')}`);
  open.then((conn) => {
    conn.createChannel()
    .then((ch) => {
      console.log('Created Channel, asserting exchange');
      ch.assertExchange(ex, 'fanout', {durable: false});
      console.log('Created exchange, asserting queue');

      ch.assertQueue(qName, {})
      .then((q) => {
        console.log(` [*] Waiting for messages in ${q.queue}. To exit press CTRL+C`);
        ch.bindQueue(q.queue, ex, '');
        ch.consume(q.queue, (msg) => {
          let doc;
          try {
            doc = JSON.parse(msg.content.toString());
          } catch (e) {
            return console.warn('Could not parse message into JSON');
          }

          writeDoc(coll, doc);
        }, {noAck: true});
      });
    });
  });
});
