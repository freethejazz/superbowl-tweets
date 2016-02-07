'use strict';

const db = require('./db');
const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();

server.connection({
  port: 8000
});

// Count
server.route({
  method: 'GET',
  path:'/count',
  handler: function (request, reply) {
    db.count().then((num) => {
      reply({
        status: 200,
        data: {
          count: num
        }
      });
    });
  }
});

// Team Counts
server.route({
  method: 'GET',
  path:'/countByTeam',
  handler: function (request, reply) {
    db.teamCounts().then((doc) => {
      reply({
        status: 200,
        data: doc
      });
    });
  }
});

// Start the server
server.start((err) => {

  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
