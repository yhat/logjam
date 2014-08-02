# logjam
Jam all of your logs into an even-stream.

## What is it?
`logjam` turns your logfiles into a stream of events that you can access 
over HTTP. It hijacks your file system commands using [`FUSE`]() and redirects
them into an event-stream.


*<gif goes here>*

## How do I use it?
### Install fuse
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
```

### Run it
```bash
$ ./bin/jam ./path/to/logs 3000
```

### Open http://localhost:3000/
*<picture goes here>*

### Put stuff in your logs
*<picture goes here>*


## Things you should know
- `FUSE` kind of sucks

## Bugs
- `echo "abcd" > /tmp/logdir/filename` doesn't work

