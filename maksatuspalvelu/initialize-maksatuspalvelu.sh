#!/bin/bash

mkdir -p /home/demo/from_handi/va
mkdir -p /home/demo/to_handi/va

chown --recursive 1001:100 /home/demo/from_handi
chown --recursive 1001:100 /home/demo/to_handi
