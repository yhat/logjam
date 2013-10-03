/*
 * Really simple script for synchronously traversing a directory
 * and returning a nested file structure
 *
 * {
 *  "file1": "",
 *  "file2:" "",
 *  "dir1": {
 *      "file3": "",
 *      "file4": ""
 *    }
 * }
 */

var fs = require("fs")
  , path = require("path");

$ = require('shellscript').globalize();

walk = function(dir) {
  var tree = {}
  var blobs = $("ls", dir).trim().split('\n');
  blobs.forEach(function(blob) {
    if (fs.statSync(path.join(dir, blob)).isDirectory()) {
      tree[blob] = walk(path.join(dir, blob));
    } else {
      tree[blob] = "";
    }
  })
  return tree;
}

module.exports = walk;
