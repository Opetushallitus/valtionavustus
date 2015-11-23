#!/bin/bash
# Update the IP address when needed
`dirname $0`/ssh_to_va.bash 192.168.1.252 -L20876:localhost:10876 -L21322:localhost:11322 $@
