#!/bin/bash

pkill -n node;		# kill prior server instance
bin/www &			# start new server
# if on local 
if [ -z ${stage} ] || [ ${stage} == "nottravis" ]; then
	sleep 1;		# sleep 1 sec
	node node_modules/mocha/bin/mocha;	# start tests
else
	sleep 10;		# on Travis sleep 10 sec
fi;
pkill -n node;		# kill server instance