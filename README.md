# logjam
Jam all of your logs into an even-stream.

*<gif goes here>*

## What is it?
`logjam` turns your logfiles into a stream of events that you can access 
over HTTP. It hijacks your file system commands using [`FUSE`](http://fuse.sourceforge.net/)
and redirects them into an event-stream. This means when you write files to 
a directory that's been logjammed, you're __actually writing to a stream__.

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
    jam tail <host> <port> [--raw] [--html]
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

### Open [http://localhost:3000/](http://localhost:3000/)
*<picture goes here>*

### Put stuff in your logs
*<picture goes here>*


## Usage
### `jam up`
Jamming your friends up isn't cool, but jamming up your logs is. `jam up` 
hijacks a directory's file operations and puts them all into an event stream.
It's sort of like a log pirate.

For example, let's say you have 3 apps running. Their logs will show up in 3
different places. For example:

    - `/var/log/app1.log`
    - `/var/log/app2.log`
    - `/var/log/app3.log`

![var logs](http://placehold.it/200x200)

That's fine and all but it's a little annoying to keep track of. *Especially if 
you even want to get into the business of dynamically adding jobs*.

![logs of job logs](http://placehold.it/200x200)

So instead you can use `jam up` to redirect all of those logs into a stream! 

So when you're apps/jobs write to any file in `/tmp/logs`, __`logjam` is 
actually turning this into a stream__. The file doesn't actually get written. 
It's a virtual file!

You can take that stream anywhere. And it's easy to access via curl or any other
 HTTP client.

![curl jam](http://placehold.it/200x200)

<img src="https://raw.githubusercontent.com/yhat/logjam/master/public/images/mac-basketball.png" height="200px">

*PROTIP: Jamming your friends up isn't cool*

### `jam tail`
Super simple, almost unneccessary. `jam tail` hooks up with a `jam up` stream 
and then writes any data back to `stdout`.

<img src="https://raw.githubusercontent.com/yhat/logjam/master/public/images/jam-tail-example.png" height="200px">

### `/events`
- __html__ (true/false): Flag for whether to send back HTML in stream.
- __raw__ (true/false): Flag for whether or not to use event-stream protocol.
- __pattern__ (glob): Pattern for matching a filename.

This is the main endpoint for the app. All of the logs will get streamed here. 

There are a few options for formatting and determining which files you want to
seein your logs. Since this is a one way street (you're not writing anything back
to the server), it's setup as an event stream and is compatible with
[`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource). 

What's great about this is that you can also just `CURL` the endpoint and it will
give you some nice looking output.


#### Basic usage with event stream format
```bash
$ curl http://localhost:3000/events

data: {"filename":"/hi.txt","content":"Hello!\n"}

data: {"filename":"/hi.txt","content":"My name is, Greg.\n"}
```

#### Escaping ANSI to HTML
```bash
$ curl http://localhost:3000/events?html=true

data: {"filename":"/hi.txt","content":"Hello!\n"}

data: {"filename":"/hi.txt","content":"My name is, Greg.\n"}

data: {"filename":"/hi.txt","content":"<span style=\"color:#0AA\"> My favorite color is BLUE\n</span>"}
```

#### Only sending raw data
```bash
$ curl http://localhost:3000/events?raw=true

/hi.txt> Hello!
/hi.txt> My name is, Greg.
```

#### Using a pattern
```bash
$ curl http://localhost:3000/events?pattern=*.txt

data: {"filename":"/hi.txt","content":"Hello!\n"}
```


#### It does colors
```bash
$ node demo/color-spitter.js >> /tmp/logs/colors.yay
```

<img src="https://raw.githubusercontent.com/yhat/logjam/master/public/images/it-does-colors.png" height="200px">

## Things you should know
- `fusermount -u /path/to/stuff/`
- `FUSE` kind of sucks

## Bugs
- `echo "abcd" > /tmp/logdir/filename` doesn't work

