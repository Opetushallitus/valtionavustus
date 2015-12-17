#!./pouta-venv/bin/python
import sys

def main(args):
  f = open('va-hosts.json', 'r')
  for line in f:
    print line

if __name__ == "__main__":
    main(sys.argv)
