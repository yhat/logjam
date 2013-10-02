
# What is it?

# How do I use it?
- Install fuse
------------
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

- Run it
	./bin/tailor ./path/to/logs /path/to/mount/location 3000


