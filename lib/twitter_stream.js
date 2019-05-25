const twitterStream = require('twitter-stream-api');
function setup(obj) {
  let client = new twitterStream(obj.credentials, true);
  client
    .on('connection success', function (uri) {
        console.log('connection success', uri);
      })
    .on('connection aborted', function () {
      console.log('connection aborted');
    })
    .on('connection error network', function () {
      console.log('connection error network');
    })
    .on('connection error stall', function () {
      console.log('connection error stall');
    })
    .on('connection error http', function () {
      console.log('connection error http');
    })
    .on('connection rate limit', function () {
      console.log('connection rate limit');
    })
    .on('connection error unknown', function () {
      console.log('connection error unknown');
    })
    .on('data keep-alive', function () {
      console.log('data keep-alive');
    })
    .on('data error', function () {
      console.log('data error');
    });
  client.stream('statuses/filter', {track: obj.track});
  return client;

}

module.exports = setup;
