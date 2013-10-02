var fs = require('fs')
  , f4js = require('fuse4js')
  , path = require('path')
  , ansi= require('ansi-to-html')()
  , srcRoot = '/'
  , options = {};

require("shellscript").globalize();

htmlifyAnsi = function(line) {
  line = line.trim();
  if (! /<p>/.test(line)) {
    line = "<p>" + line + "</p>";
  }
  return line;
}

module.exports = function(srcRoot, mountPoint, stream) {

  console.log($("diskutil unmount /tmp/tutorial/mnt"));

  // needs to be defined globally
  srcRoot = srcRoot;

  //---------------------------------------------------------------------------

  /*
   * Convert a node.js file system exception to a numerical errno value.
   * This is necessary because node's exc.errno property appears to have wrong
   * values based on experiments.
   * On the other hand, the exc.code string seems like a correct representation
   * of the error, so we use that instead.
   */

  var errnoMap = {
      EPERM: 1,
      ENOENT: 2,
      EACCES: 13,    
      EINVAL: 22,
      ENOTEMPTY: 39
  };

  function excToErrno(exc) {
    var errno = errnoMap[exc.code];
    if (!errno)
      errno = errnoMap.EPERM; // default to EPERM
    return errno;
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the getattr() system call.
   * path: the path to the file
   * cb: a callback of the form cb(err, stat), where err is the Posix return code
   *     and stat is the result in the form of a stat structure (when err === 0)
   */
  function getattr(fpath, cb) {	  
    var fpath = path.join(srcRoot, fpath);
    return fs.lstat(fpath, function lstatCb(err, stats) {
      if (err)      
        return cb(-excToErrno(err));
      return cb(0, stats);
    });
  };

  //---------------------------------------------------------------------------

  /*
   * Handler for the readdir() system call.
   * path: the path to the file
   * cb: a callback of the form cb(err, names), where err is the Posix return code
   *     and names is the result in the form of an array of file names (when err === 0).
   */
  function readdir(fpath, cb) {
    var fpath = path.join(srcRoot, fpath);
    return fs.readdir(fpath, function readdirCb(err, files) {
      if (err)      
        return cb(-excToErrno(err));
      return cb(0, files);
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the readlink() system call.
   * path: the path to the file
   * cb: a callback of the form cb(err, name), where err is the Posix return code
   *     and name is symlink target (when err === 0).
   */
  function readlink(fpath, cb) {
    var fpath = path.join(srcRoot, fpath);
    return fs.readlink(fpath, function readlinkCb(err, name) {
      if (err)      
        return cb(-excToErrno(err));
      return cb(0, name);
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the chmod() system call.
   * path: the path to the file
   * mode: the desired permissions
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function chmod(fpath, mode, cb) {
    var fpath = path.join(srcRoot, fpath);
    return fs.chmod(fpath, mode, function chmodCb(err) {
      if (err)
        return cb(-excToErrno(err));
      return cb(0);
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Converts numerical open() flags to node.js fs.open() 'flags' string.
   */
  function convertOpenFlags(openFlags) {
    switch (openFlags & 3) {
    case 0:                    
      return 'r';              // O_RDONLY
    case 1:
      return 'w';              // O_WRONLY
    case 2:
      return 'r+';             // O_RDWR
    }
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the open() system call.
   * path: the path to the file
   * flags: requested access flags as documented in open(2)
   * cb: a callback of the form cb(err, [fh]), where err is the Posix return code
   *     and fh is an optional numerical file handle, which is passed to subsequent
   *     read(), write(), and release() calls (set to 0 if fh is unspecified)
   */
  function open(fpath, flags, cb) {
    var fpath = path.join(srcRoot, fpath);
    var flags = convertOpenFlags(flags);
    cb(0, "");
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the read() system call.
   * path: the path to the file
   * offset: the file offset to read from
   * len: the number of bytes to read
   * buf: the Buffer to write the data to
   * fh:  the optional file handle originally returned by open(), or 0 if it wasn't
   * cb: a callback of the form cb(err), where err is the Posix return code.
   *     A positive value represents the number of bytes actually read.
   */
  function read(fpath, offset, len, buf, fh, cb) {
    // currently defaults to returning nothing
    cb(0);
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the write() system call.
   * path: the path to the file
   * offset: the file offset to write to
   * len: the number of bytes to write
   * buf: the Buffer to read data from
   * fh:  the optional file handle originally returned by open(), or 0 if it wasn't
   * cb: a callback of the form cb(err), where err is the Posix return code.
   *     A positive value represents the number of bytes actually written.
   */
  function write(fpath, offset, len, buf, fh, cb) {
    if (stream!=undefined) {
      stream.sockets.send(htmlifyAnsi(buf.toString()));
    }
    cb(len);
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the release() system call.
   * path: the path to the file
   * fh:  the optional file handle originally returned by open(), or 0 if it wasn't
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function release(fpath, fh, cb) {
    cb(0);
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the create() system call.
   * path: the path of the new file
   * mode: the desired permissions of the new file
   * cb: a callback of the form cb(err, [fh]), where err is the Posix return code
   *     and fh is an optional numerical file handle, which is passed to subsequent
   *     read(), write(), and release() calls (it's set to 0 if fh is unspecified)
   */
  function create (fpath, mode, cb) {
    var fpath = path.join(srcRoot, fpath);
    fs.open(fpath, 'w', mode, function openCb(err, fd) {
      if (err)      
        return cb(-excToErrno(err));
      cb(0, fd);    
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the unlink() system call.
   * path: the path to the file
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function unlink(fpath, cb) {
    var fpath = path.join(srcRoot, fpath);
    fs.unlink(fpath, function unlinkCb(err) {
      if (err)      
        return cb(-excToErrno(err));
      cb(0);
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the rename() system call.
   * src: the path of the file or directory to rename
   * dst: the new path
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function rename(src, dst, cb) {
    src = path.join(srcRoot, src);
    dst = path.join(srcRoot, dst);
    fs.rename(src, dst, function renameCb(err) {
      if (err)      
        return cb(-excToErrno(err));
      cb(0);
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the mkdir() system call.
   * path: the path of the new directory
   * mode: the desired permissions of the new directory
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function mkdir(fpath, mode, cb) {
    var fpath = path.join(srcRoot, fpath);
    fs.mkdir(fpath, mode, function mkdirCb(err) {
      if (err)      
        return cb(-excToErrno(err));
      cb(0);
    });
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the rmdir() system call.
   * path: the path of the directory to remove
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function rmdir(fpath, cb) {
    var fpath = path.join(srcRoot, fpath);
    fs.rmdir(fpath, function rmdirCb(err) {
      if (err)      
        return cb(-excToErrno(err));
      cb(0);
    });

  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the init() FUSE hook. You can initialize your file system here.
   * cb: a callback to call when you're done initializing. It takes no arguments.
   */
  var init = function (cb) {
    console.log("File system started at " + mountPoint);
    console.log("To stop it, type this in another shell: diskutil unmount " + mountPoint);
    cb();
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the destroy() FUSE hook. You can perform clean up tasks here.
   * cb: a callback to call when you're done. It takes no arguments.
   */
  var destroy = function (cb) {
    if (options.outJson) {
      try {
        fs.writeFileSync(options.outJson, JSON.stringify(obj, null, '  '), 'utf8');
      } catch (e) {
        console.log("Exception when writing file: " + e);
      }
    }
    console.log("File system stopped");      
    cb();
  }

  //---------------------------------------------------------------------------

  var handlers = {
    getattr: getattr,
    readdir: readdir,
    readlink: readlink,
    chmod: chmod,
    open: open,
    read: read,
    write: write,
    release: release,
    create: create,
    unlink: unlink,
    rename: rename,
    mkdir: mkdir,
    rmdir: rmdir,
    init: init,
    destroy: destroy
  };

  f4js.start(mountPoint, handlers, undefined);
  
}
