# logjam
Jam all of your logs into an even-stream.

## What is it?
`logjam` turns your logfiles into a stream of events that you can access 
over HTTP. It hijacks your file system commands using [`FUSE`]() and redirects
them into an event-stream.

*<gif goes here>*

## Installation
### Install FUSE
Linux:
* Fuse4js has been tested on Ubuntu 10.04, Ubuntu 12.04  and CentOS 5.x (all 32-bit).
* GNU Compiler toolchain, including gcc and g++
    * On Ubuntu: `sudo apt-get install g++`
* FUSE library and header files.
    * On Ubuntu: `sudo apt-get install libfuse-dev`
    * On CentOS / RedHat: `yum install fuse-devel`
* pkg-config tool (typically included out-of-the-box with the OS)
* node.js 0.8.7 or later

OSX:
* install [osxfuse](http://osxfuse.github.com/)

### Install logjam
```bash
$ npm install --save logjam
$ jam --help
Usage:
    jam tail <host> <port>
    jam up <logdir> [<port>]

Options:
    --help
    --version

Description:
    Jam all of your logs into an event-stream

Example:
    jam up /path/to/your/logs
    jam tail localhost 3000 
```

## Quickstart
### Run it
```bash
# serve up some logs
$ jam up /path/to/logs 3000
# connect the logs
$ jam tail localhost 3000
$ curl localhost:3000/events
$ curl localhost:3000/events?raw=true
$ curl localhost:3000/events?html=true
```

### Open http://localhost:3000/
*<picture goes here>*

### Put stuff in your logs
*<picture goes here>*


## Usage
### `jam up`
Jamming your friends up isn't cool, but jamming up your logs is. `jam up` 
hijacks a directory's file operations and puts them all into an event stream.

For example, let's say you have 3 apps running on upstart jobs. Their logfiles
will show up in `/var/log/upstart/app1.log`, `/var/log/upstart/app2.log`, and
`/var/log/upstart/app3.log`.

![var upstart logs](http://placehold.it/200x200)

That's fine and all but it's a little annoying to keep track of. *Especially if 
you even want to get into the business of dynamically adding jobs*.

![logs of job logs](http://placehold.it/200x200)

So instead you can use `jam up` to redirect all of those logs into a stream! 
You can take that stream anywhere. And it's easy to access via curl or any other
 HTTP client.

![curl jam](http://placehold.it/200x200)

<img src="./public/images/mac-basketball.png" height="200px">

*Jamming your friends up isn't cool*

### `jam tail`
Super simple, almost unneccessary. `jam tail` hooks up with a `jam up` stream 
and then writes any data back to `stdout`.


## Things you should know
- can't really run it twice...
- `fusermount -u /path/to/stuff/`
- `FUSE` kind of sucks

## Bugs
- `echo "abcd" > /tmp/logdir/filename` doesn't work

