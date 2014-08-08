fs = require 'fs'
path = require 'path'
package_json = JSON.parse fs.readFileSync path.join(__dirname, '../package.json')
server = require './server'
tailstream = require './tailstream'

doc = """
Usage:
    jam tail [--host=localhost] [--port=3000] [--raw] [--html]
    jam up --logdir=<dirname> [--port=3000]

Options:
    --help
    --version

Description:
    #{package_json.description}

Example:
	jam /path/to/your/logs 

"""
{docopt} = require 'docopt', version: package_json.version
options = docopt doc

if options['tail']
  host = options['--host'] || "localhost"
  port = options['--port'] || 3000
  tailstream host, port, options['--raw'], options['--html']
else if options['up']
  logdir = options['--logdir']
  port = options['--port'] || 3000
  server logdir, port
else
  console.log doc
