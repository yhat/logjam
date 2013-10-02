fs = require 'fs'
path = require 'path'
package_json = JSON.parse fs.readFileSync path.join(__dirname, '../package.json')
server = require './server'
doc = """

Usage:
    tailor [options] <port> <logdir>

Options:
    --help
    --version

Description:
    #{package_json.description}

Example:
	tailor 9999 /path/to/your/logs

"""
{docopt} = require 'docopt', version: package_json.version
options = docopt doc

port = options['<port>']
logdir = options['<logdir>']

server port, logdir
