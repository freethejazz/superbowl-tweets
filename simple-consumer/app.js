'use strict';

let nconf = require('nconf');
let amqplib = require('amqplib');
let mongo = require('mongodb')

// Do the config thing
nconf.argv()
  .env()
  .file({file: '../config.json'});

let ex = nconf.get('rabbit_exchange');
let qName = nconf.get('simple_queue');

// Connect to mongo

// Connect to Rabbit and start consuming
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
          console.log(" [x] %s", msg.content.toString());
        }, {noAck: true});
      });
    });
});
