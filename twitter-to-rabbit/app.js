'use strict';

let nconf = require('nconf');
let Twit = require('twit');
let amqplib = require('amqplib');

const tracking = ['superbowl', 'panther', 'bronco'];

// Do the config thing
nconf.argv()
  .env()
  .file('config.json')
  .file('prod', '/etc/twitter-to-rabbit/config.json');

nconf.required([
  'consumer_key',
  'consumer_secret',
  'access_token',
  'access_token_secret',
  'rabbit_host',
  'rabbit_exchange'
]);

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
        if(tweet.lang === 'en') {
          ch.publish(ex, '', new Buffer(JSON.stringify(tweet)));
          console.log(` [x] Sent ${tweet.id}`);
        }
      });
    });
});

open.catch((err) => {
  console.warn(`Error connecting to rabbit at ${nconf.get('rabbit_host')}`);
  process.exit(1);
});

process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(0);
});
