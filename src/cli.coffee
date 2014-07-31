fs = require 'fs'
path = require 'path'
package_json = JSON.parse fs.readFileSync path.join(__dirname, '../package.json')
server = require './server'
doc = """
Usage:
    tailor [options] <logdir> [<port>] 

Options:
    --help
    --version

Description:
    #{package_json.description}

Example:
	tailor /path/to/your/logs

"""
{docopt} = require 'docopt', version: package_json.version
options = docopt doc

logdir = options['<logdir>'] || "/Users/glamp/repos/yhat/enterprise/logs"
port = options['<port>'] || 3000

server logdir, port

