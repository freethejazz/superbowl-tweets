'use strict';

let nconf = require('nconf');
let Twit = require('twit');
let amqplib = require('amqplib');

const tracking = 'superbowl'

// Do the config thing
nconf.argv()
  .env()
  .file({file: '../config.json'});

let ex = nconf.get('rabbit_exchange');

// Establish connection to twitter streaming API
var T = new Twit({
  'consumer_key': nconf.get('consumer_key'),
  'consumer_secret': nconf.get('consumer_secret'),
  'access_token': nconf.get('access_token'),
  'access_token_secret': nconf.get('access_token_secret')
});
var stream = T.stream('statuses/filter', {track: tracking});

// Connect to RabbitMQ
let open = amqplib.connect(`amqp://${nconf.get('rabbit_host')}`);
open.then((conn) => {
  conn.createChannel()
    .then((ch) => {
      ch.assertExchange(ex, 'fanout', {durable: false});
      console.log('Connected to Exchange');

      // Connect to twitter streaming
      stream.on('tweet', (tweet) => {
        ch.publish(ex, '', new Buffer(JSON.stringify(tweet)));
        console.log(` [x] Sent ${tweet.id}`);
      });
    });
});

