'use strict';

let nconf = require('nconf');
let amqplib = require('amqplib');
var sentiment = require('sentiment');
let MongoClient = require('mongodb').MongoClient;

// Do the config thing
nconf.argv()
  .env()
  .file({file: '../config.json'});

const ex = nconf.get('rabbit_exchange');
const qName = nconf.get('sentiment_queue');
const mongoUrl = `mongodb://${nconf.get('mongo_host')}:27017/superTweets`;

const BRONCO_PATTERN = /(?!.*panther).*bronco.*/gi;
const PANTHER_PATTERN = /(?!.*bronco).*panther.*/gi;

let getAffiliation = (doc) => {
  let affiliation;

  if(doc.text.match(PANTHER_PATTERN)) {
    affiliation = 'Panthers';
  } else if (doc.text.match(BRONCO_PATTERN)) {
    affiliation = 'Broncos';
  } else {
    affiliation = 'Unaffiliated';
  }

  console.log(`Affiliation for "${doc.text}" \n ${affiliation}`);
};

let processDoc = function(doc) {
  return {
    id: doc.id,
    text: doc.text,
    sentiment: sentiment(doc.text),
    affiliation: getAffiliation(doc)
  };
};

let writeDoc = function(coll, doc) {
  coll.insert(doc, function(err, result) {
    if(err) {
      console.error(err);
    } else {
      console.log(`Wrote doc with id: ${doc.id} and sentiment ${doc.sentiment.score}`);
    }
  });
};

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

          let processed = processDoc(doc);
          writeDoc(coll, processed);
        }, {noAck: true});
      });
    });
  });
});