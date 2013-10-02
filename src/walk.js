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
