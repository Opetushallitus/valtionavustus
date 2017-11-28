#!/usr/bin/env bash
cd /home/ec2-user/va-payments-ui/
lein clean
lein production
./run_docker.sh
