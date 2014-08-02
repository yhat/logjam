var request = require('request')

module.exports = function(host, port) {
  var url = [
    "http://", host, ":", port, "/events?raw=true"].join("");
  request.get(url)
    .pipe(process.stdout)
};
