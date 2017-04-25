#!/bin/bash

if [ "$TRAVIS_BRANCH" == "master" ]; then
  #deploy to production (kipswarehouse.com)
  echo "deploying to production"

  sshpass -p $pass scp -Crp -o StrictHostKeyChecking=no -P $port /home/travis/build/buie/KipsWarehouse/* $username@$server_url:/var/www/production

  sshpass -p $pass ssh -p $port $username@$server_url "cd /var/www/production; npm install; webpack; pm2 restart all"

elif [ "$TRAVIS_BRANCH" == "staging" ]; then
  #deploy to staging (staging.kipswarehouse.com)
  echo "deploying to staging"

  sshpass -p $pass scp -Crp -o StrictHostKeyChecking=no -P $port /home/travis/build/buie/KipsWarehouse/* $username@$server_url:/var/www/staging

  sshpass -p $pass ssh -p $port $username@$server_url "cd /var/www/staging; npm install; webpack; pm2 restart all"

elif [ "$TRAVIS_BRANCH" == "development" ]; then
  #deploy to development (dev.kipswarehouse.com)
  echo "deploying to development"

  sshpass -p $pass scp -Crp -o StrictHostKeyChecking=no -P $port /home/travis/build/buie/KipsWarehouse/* $username@$server_url:/var/www/development

  sshpass -p $pass ssh -p $port $username@$server_url "cd /var/www/development; npm install; webpack; pm2 restart all"

fi
