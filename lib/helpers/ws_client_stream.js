const websocket = require('websocket-stream');

function setup(obj) {
  let port = obj.hasOwnProperty("port")
    ? `:${obj.port}`
    : "";
  return websocket(`${obj.protocol}://${obj.host}${port}`, {
    perMessageDeflate: false
  });
}

module.exports = setup;
