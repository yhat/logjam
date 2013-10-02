var fs = require('fs')
  , f4js = require('fuse4js')
  , path = require('path')
  , walk = require('./walk')
  , ansi = require('ansi-to-html')()
  , srcRoot = '/'
  , obj = {}
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

  obj = walk(srcRoot);
  console.log(obj);
  console.log($("diskutil unmount " + mountPoint));

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
   * Given the name space represented by the object 'root', locate
   * the sub-object corresponding to the specified path
   */
  function lookup(root, fpath) {
    var cur = null, previous = null, name = '';
    if (fpath === '/') {
      return { node:root, parent:null, name:'' };
    }
    comps = fpath.split('/');
    for (i = 0; i < comps.length; ++i) {
      previous = cur;
      if (i == 0) {
        cur = root;
      } else if (cur !== undefined ){
        name = comps[i];
        cur = cur[name];
        if (cur === undefined) {
          break;
        }
      }
    }
    return {node:cur, parent:previous, name:name};
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the getattr() system call.
   * fpath: the fpath to the file
   * cb: a callback of the form cb(err, stat), where err is the Posix return code
   *     and stat is the result in the form of a stat structure (when err === 0)
   */
  function getattr(fpath, cb) {  
    var stat = {};
    var err = 0; // assume success
    var info = lookup(obj, fpath);
    var node = info.node;

    switch (typeof node) {
    case 'undefined':
      err = -2; // -ENOENT
      break;
      
    case 'object': // directory
      stat.size = 4096;   // standard size of a directory
      stat.mode = 040777; // directory with 777 permissions
      break;
    
    case 'string': // file
      stat.size = node.length;
      stat.mode = 0100666; // file with 666 permissions
      break;
      
    default:
      break;
    }
    cb( err, stat );
  };

  //---------------------------------------------------------------------------

  /*
   * Handler for the readdir() system call.
   * path: the path to the file
   * cb: a callback of the form cb(err, names), where err is the Posix return code
   *     and names is the result in the form of an array of file names (when err === 0).
   */
  function readdir(fpath, cb) {
    var names = [];
    var err = 0; // assume success
    var info = lookup(obj, fpath);

    switch (typeof info.node) {
    case 'undefined':
      err = -2; // -ENOENT
      break;
      
    case 'string': // file
      err = -22; // -EINVAL
      break;
    
    case 'object': // directory
      var i = 0;
      for (key in info.node)
        names[i++] = key;
      break;
      
    default:
      break;
    }
    cb( err, names );
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
   *     read(), write(), and release() calls.
   */
  function open(fpath, flags, cb) {
    var err = 0; // assume success
    var info = lookup(obj, fpath);
    
    if (typeof info.node === 'undefined') {
      err = -2; // -ENOENT
    }
    cb(err); // we don't return a file handle, so fuse4js will initialize it to 0
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
  function write(path, offset, len, buf, fh, cb) {
    var err = 0; // assume success
    var info = lookup(obj, path);
    var file = info.node;
    var name = info.name;
    var parent = info.parent;
    var beginning, blank = '', data, ending='', numBlankChars;
    
    switch (typeof file) {
    case 'undefined':
      err = -2; // -ENOENT
      break;

    case 'object': // directory
      err = -1; // -EPERM
      break;
        
    case 'string': // a string treated as ASCII characters
      data = buf.toString('ascii'); // read the new data
      if (offset < file.length) {
        beginning = file.substring(0, offset);
        if (offset + data.length < file.length) {
          ending = file.substring(offset + data.length, file.length)
        }
      } else {
        beginning = file;
        numBlankChars = offset - file.length;
        while (numBlankChars--) blank += ' ';
      }
      delete parent[name];
      /* write to the object and to the stream; need to adjust the 
         data.length that is sent back vs. what is actually read
      */
      parent[name] = (beginning + blank + data + ending).slice(-10);
      console.log(parent[name])
      if (stream!=undefined) {
        stream.sockets.send(htmlifyAnsi(buf.toString()));
      }
      err = data.length;
      break;
    
    default:
      break;
    }
    cb(err);
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
    var err = 0; // assume success
    var info = lookup(obj, fpath);

    switch (typeof info.node) {
    case 'undefined':
      if (info.parent !== null) {
        info.parent[info.name] = '';
      } else {
        err = -2; // -ENOENT      
      }
      break;

    case 'string': // existing file
    case 'object': // existing directory
      err = -17; // -EEXIST
      break;
        
    default:
      break;
    }
    cb(err);
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the unlink() system call.
   * path: the path to the file
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function unlink(fpath, cb) {
    var err = 0; // assume success
    var info = lookup(obj, fpath);
    
    switch (typeof info.node) {
    case 'undefined':
      err = -2; // -ENOENT      
      break;

    case 'object': // existing directory
      err = -1; // -EPERM
      break;

    case 'string': // existing file
      delete info.parent[info.name];
      break;
      
    default:
      break;
    }
    cb(err);
  }


  //---------------------------------------------------------------------------

  /*
   * Handler for the rename() system call.
   * src: the path of the file or directory to rename
   * dst: the new path
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function rename(src, dst, cb) {
    var err = -2; // -ENOENT assume failure
    var source = lookup(obj, src), dest;
    
    if (typeof source.node !== 'undefined') { // existing file or directory
      dest = lookup(obj, dst);
      if (typeof dest.node === 'undefined' && dest.parent !== null) {
        dest.parent[dest.name] = source.node;
        delete source.parent[source.name];
        err = 0;
      } else {
        err = -17; // -EEXIST
      }
    }   
    cb(err);
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the mkdir() system call.
   * path: the path of the new directory
   * mode: the desired permissions of the new directory
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function mkdir(fpath, mode, cb) {
    var err = -2; // -ENOENT assume failure
    var dst = lookup(obj, fpath), dest;
    if (typeof dst.node === 'undefined' && dst.parent != null) {
      dst.parent[dst.name] = {};
      err = 0;
    }
    cb(err);
  }

  //---------------------------------------------------------------------------

  /*
   * Handler for the rmdir() system call.
   * path: the path of the directory to remove
   * cb: a callback of the form cb(err), where err is the Posix return code.
   */
  function rmdir(fpath, cb) {
    var err = -2; // -ENOENT assume failure
    var dst = lookup(obj, fpath), dest;
    if (typeof dst.node === 'object' && dst.parent != null) {
      delete dst.parent[dst.name];
      err = 0;
    }
    cb(err);
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
