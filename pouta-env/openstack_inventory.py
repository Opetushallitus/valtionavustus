#!./pouta-venv/bin/python
################################################################################
# Dynamic inventory generation for Ansible
# Author lukas.pustina@codecentric.de
#
# This Python script generates a dynamic inventory based on OpenStack instances.
#
# The script is passed via -i <script name> to ansible-playbook. Ansible
# recognizes the execute bit of the file and executes the script. It then
# queries nova via the novaclient module and credentials passed via environment
# variables -- see below.
#
# The script iterates over all instances of the given tenant and checks if the
# instances' metadata have set keys OS_METADATA_KEY -- see below. These keys shall
# contain all Ansible host groups comma separated an instance shall be part of,
# e.g., u'ansible_host_groups': u'admin_v_infrastructure,apt_repos'.
# It is also possible to set Ansible host variables, e.g.,
# u'ansible_host_vars': u'dns_server_for_domains->domain1,domain2;key2->value2'
# Values with a comma will be transformed into a list.
#
# Metadata of an instance may be set during boot, e.g.,
# > nova boot --meta <key=value>
# , or to a running instance, e.g.,
# nova meta <instance name> set <key=value>
#
# *** Requirements ***
# * Python: novaclient module be installed which is part of the nova ubuntu
# package.
# * The environment variables OS_USERNAME, OS_PASSWORD, OS_TENANT_NAME,
# OS_AUTH_URL must be set according to nova.
#
# *** Short comings ***
# Currently, the name of the network is hardcoded in the global variable
# OS_NETWORK_NAME. This might be mitigated by another environment variable, but
# this might not interoperate well.
#
################################################################################

from __future__ import print_function
from novaclient import client
import os, sys, json

OS_METADATA_KEY = {
	'host_groups': 'ansible_host_groups',
	'host_vars': 'ansible_host_vars'
}

OS_NETWORK_NAME = 'tlp20296'

def main(args):
	credentials = getOsCredentialsFromEnvironment()
	nt = client.Client("1.1", credentials['USERNAME'], credentials['PASSWORD'], credentials['TENANT_NAME'], credentials['AUTH_URL'], service_type="compute")

	inventory = {}
	inventory['_meta'] = { 'hostvars': {} }

	for server in nt.servers.list():
		groups = getAnsibleHostGroupsFromServer(nt, server)
		if len(groups) > 0:
			for group in groups:
				addServerToHostGroup(group, server, inventory)
		else:
			addServerToHostGroup('unassigned-group', server, inventory)

		host_vars = getAnsibleHostVarsFromServer(nt, server)
		if host_vars:
			addServerHostVarsToHostVars(host_vars, server, inventory)

	dumpInventoryAsJson(inventory)

def getOsCredentialsFromEnvironment():
	credentials = {}
	try:
		credentials['USERNAME'] = os.environ['OS_USERNAME']
		credentials['PASSWORD'] = os.environ['OS_PASSWORD']
		credentials['TENANT_NAME'] = os.environ['OS_TENANT_NAME']
		credentials['AUTH_URL'] = os.environ['OS_AUTH_URL']
	except KeyError as e:
		print("ERROR: environment variable %s is not defined" % e, file=sys.stderr)
		sys.exit(-1)

	return credentials

def getAnsibleHostGroupsFromServer(novaClient, server):
	metadata = getMetaDataFromServer(novaClient, server, OS_METADATA_KEY['host_groups'])
	if metadata:
		return metadata.split(',')
	else:
		return []

def getMetaDataFromServer(novaClient, server, key):
	return novaClient.servers.get(server.id).metadata.get(key, None)

def getAnsibleHostVarsFromServer(novaClient, server):
	host_vars = {}
	privateIp = getPrivateIpFromServerForNetwork(server, OS_NETWORK_NAME)
	host_vars['ansible_all_ipv4_addresses'] = [privateIp]
	addr = {}
	addr['address'] = privateIp
	host_vars['ansible_default_ipv4'] = addr

	floatingIp = getFloatingIpFromServerForNetwork(server, OS_NETWORK_NAME)
	if floatingIp:
		host_vars['ansible_ssh_host'] = floatingIp
	else:
		host_vars['ansible_ssh_host'] = privateIp

	metadata = getMetaDataFromServer(novaClient, server, OS_METADATA_KEY['host_vars'])
	if metadata:
		for kv in metadata.split(';'):
			key, values = kv.split('->')
			values = values.split(',')
			if len(values) > 1:
				host_vars[key] = values
			else:
				host_vars[key] = values[0]

	return host_vars

def getFloatingIpFromServerForNetwork(server, network):
	for addr in server.addresses.get(network):
		if addr.get('OS-EXT-IPS:type') == 'floating':
			return addr['addr']
	return None

def getPrivateIpFromServerForNetwork(server, network):
	for addr in server.addresses.get(network):
		if addr.get('OS-EXT-IPS:type') == 'fixed':
			return addr['addr']
	return None

def addServerToHostGroup(group, server, inventory):
	host_group = inventory.get(group, {})
	hosts = host_group.get('hosts', [])
	hosts.append(server.name)
	host_group['hosts'] = hosts
	inventory[group] = host_group

def addServerHostVarsToHostVars(host_vars, server, inventory):
	inventory_host_vars = inventory['_meta']['hostvars'].get(server.name, {})
	inventory_host_vars.update(host_vars)
	inventory['_meta']['hostvars'][server.name] = inventory_host_vars

def dumpInventoryAsJson(inventory):
	print(json.dumps(inventory, indent=4))


if __name__ == "__main__":
    main(sys.argv)

