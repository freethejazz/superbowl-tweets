# Superbowl Sentiment

To see if times of touchdowns and scoring team can be derived from twitter data.

## Basic Architecture

```

                               +
                               |
                               | Twitter Streaming API
                               |
                               |
                               |
                         +-----v-------------+
                         |                   |
                         | twitter-to-rabbit |
                         |                   |
                         +-----+-------------+
                               |
                               v
                         +-----+-------------+
                         |                   |
                         | RabbitMQ          |
                         |                   |
                         +-----+-------------+
                               |
                               v
                          +----+-------+
                          | Exchange   |
                          +---+------+-+
                              |      |
                              v      v
                             +++    +++
                             |_|    |_|
                 Simple      |_|    |_| Sentiment
                 Persistence |_|    |_| Analysis
                 Queue       | |    | | Queue
                  +-----+----+++    +++----+---+
                  |     |     |      |     |   |
                +-v+  +-v+  +-v+    +v-+ +-v+ +v-+
simple-consumer |  |  |  |  |  |    |  | |  | |  | sentiment-consumer
                +--+  +--+  +--+    +--+ +--+ +--+

                              -------
                            +----------
                            +---------+
                            |  -----  |
                            |         |
                            | Mongo   |
                            |         |
                            |         |
                            +---------+

```
