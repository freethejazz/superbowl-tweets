# Superbowl Sentiment

To see if times of touchdowns and scoring team can be derived from twitter data. A work in progress.

## Prerequisites

1. `docker-compose` 1.6 or greater, which requires docker engine 1.10.0 or greater. I'm using
[docker machine](https://docs.docker.com/machine/install-machine/).

2. A twitter developer account, app, and related keys.

3. A config file in each application directory (can be a copy):
```
{
  "rabbit_exchange": "tweets",
  "simple_queue": "simple_queue",
  "sentiment_queue": "sentiment_queue",
  "rabbit_host": "<your-docker-machine-ip>",
  "mongo_host": "<your-docker-machine-ip>",
  "consumer_key": "<your-consumer-key>",
  "consumer_secret": "<your-consumer-secret>",
  "access_token": "<your-access-token>",
  "access_token_secret": "<your-access-token-secret>"
}
```

## Running the app

After you've upped you're docker-machine (`docker-machine up <your-machine-name>`), simply run
`docker-compose up`.

Right now, the API is incomplete, and there is no front end.

## API

#### Counts
GET: `http://<your-docker-machine-ip>:8000/counts`
Returns:
```
{
  "status": 200,
  "data": {
    "count": 83
  }
}
```

#### Counts By Team Affiliation
GET: `http://<your-docker-machine-ip>:8000/countsByTeam`
Returns:
```
{
  "status": 200,
  "data": [
    {
      "affiliation": "Broncos",
      "count": 7
    },
    {
      "affiliation":"Panthers",
      "count":17
    },
    {
      "affiliation": "Unaffiliated",
      "count":53
    }
  ]
}
```

#### Histogram by minute
GET: `http://<your-docker-machine-ip>:8000/histogram/minute`
Returns:
```
{
  "status": 200,
  "data": [
    {
      "averageSentiment": 1.283185840708,
      "time": {
        "minute": 48,
        "hour": 3
      }
    },
    {
      "averageSentiment": 0.88034188034188,
      "time": {
        "minute": 47,
        "hour": 3
      }
    },
    {
      "averageSentiment": 1.5421686746988,
      "time": {
        "minute": 52,
        "hour": 2
      }
    }
  ]
}
```

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
