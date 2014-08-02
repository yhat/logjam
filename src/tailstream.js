var request = require('request')

module.exports = function(host, port, raw, html) {
  raw = raw || true;
  html = html || false;

  var url = [ "http://", host, ":", port, "/events?" ];
  if (raw==true) {
    url.push("raw=true");
  }
  if (html==true) {
    url.push("html=true");
  }
  url = url.join("");
  request.get(url)
    .pipe(process.stdout)
};
