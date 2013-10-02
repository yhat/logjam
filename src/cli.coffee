fs = require 'fs'
path = require 'path'
package_json = JSON.parse fs.readFileSync path.join(__dirname, '../package.json')
server = require './server'
doc = """

Usage:
    tailor [options] <logdir> <mountdir> [<port>] 

Options:
    --help
    --version

Description:
    #{package_json.description}

Example:
	tailor 9999 /path/to/your/logs /path/to/mount

"""
{docopt} = require 'docopt', version: package_json.version
options = docopt doc

logdir = options['<logdir>'] || "/Users/glamp/repos/yhat/enterprise/logs"
mountdir = options['<mountdir>'] || "/tmp/tutorial/mnt"
port = options['<port>'] || 3000

server logdir, mountdir, port

