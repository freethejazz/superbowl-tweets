#!/usr/bin/env bash

# wait for db to come up before starting tests, as shown in https://github.com/docker/compose/issues/374#issuecomment-126312313
# uses bash instead of netcat, because netcat is less likely to be installed
# strategy from http://superuser.com/a/806331/98716
set -e

echoerr() { echo "$@" 1>&2; }

echoerr wait-for-rabbit: waiting for rabbit:5672
echoerr wait-for-mongo: waiting for mongo:27017:

timeout 15 bash <<EOT
while ! (echo > /dev/tcp/rabbit/5672) >/dev/null 2>&1;
    do sleep 1;
done;
EOT
RESULT=$?

if [ $RESULT -eq 0 ]; then
  # sleep another second for so that we don't get a "the database system is starting up" error
  sleep 1
  echoerr wait-for-rabbit: done
else
  echoerr wait-for-rabbit: timeout out after 15 seconds waiting for rabbit:5672
fi

# Wait for Mongo
timeout 15 bash <<EOT
while ! (echo > /dev/tcp/mongo/27017) >/dev/null 2>&1;
    do sleep 1;
done;
EOT
RESULT=$?

if [ $RESULT -eq 0 ]; then
  # sleep another second for so that we don't get a "the database system is starting up" error
  sleep 1
  echoerr wait-for-mongo: done
else
  echoerr wait-for-mongo: timeout out after 15 seconds waiting for mongo:27017
fi

exec "$@"
