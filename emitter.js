const colors = require('colors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const es = require('event-stream');
const low = require('lowdb');
const twitterStream = require('twitter-stream-api');
const websocket = require('websocket-stream')
const fs = require('fs');

const geocode = require('./src/geocoders');
const locationUtils = require('./src/locationUtils');
const FileSync = require('lowdb/adapters/FileSync');
const config = require('./config.json');

const adapter = new FileSync('data/notFoundLocations.json');
const db = low(adapter);
db.defaults({ "locations": [] }).write();

const WS_URL = 'ws://localhost:9000'
var ws = websocket(WS_URL);

const TRACK = process.argv[2] || "FelizJueves";
const client = new twitterStream(config.twitter_credentials, true);

const csvWriter = createCsvWriter({
    path: 'data/tweets.csv',
    header: [
        {id: 'username', title: 'Username'},
        {id: 'screename', title: 'Screename'},
        {id: 'text', title: 'Text'},
        {id: 'profile_image_url_https', title: 'Avatar'},
        {id: 'geo', title: 'Geo'},
        {id: 'location', title: 'Location'},
        {id: 'created_at', title: 'Created_at'},
        {id: 'id_str', title: 'ID_str'},
        {id: 'reply_count', title: 'Reply_count'},
        {id: 'retweet_count', title: 'Retweet_count'},
        {id: 'favorite_count', title: 'Favorite_count'},
        {id: 'tweet_url', title: 'Tweet_URL'},
        {id: 'lat', title: 'lat'},
        {id: 'lon', title: 'lon'}
    ],
    append:true
});

function mapTweet(tweet, callback) {
    var data = {
        'username': tweet.user.name,
        'screename': tweet.user.screen_name,
        'text': tweet.text,
        'profile_image_url_https': tweet.user.profile_image_url_https,
        'geo': tweet.geo,
        'location': tweet.user.location,
        'created_at': tweet.created_at,
        'id_str': tweet.id_str,
        'reply_count': tweet.reply_count,
        'retweet_count': tweet.retweet_count,
        'favorite_count': tweet.favorite_count,
        'tweet_url' : tweet.retweeted_status
            ? `https://twitter.com/${tweet.retweeted_status.user.screen_name}/status/${tweet.retweeted_status.id_str}`
            : `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
    };

    location = data.geo? data.geo : data.location;
    geocode.find(location).then((coordinates) => {
      console.log(`Marcado para enviar`);
      wsTweetData = virtualLocTweet(data, coordinates);
      saveCsv(wsTweetData);
      callback(null,new Buffer.from(JSON.stringify(wsTweetData)));
    }).catch(function(err){
      callback(null, new Buffer.from(JSON.stringify({ error: true })));
    })

}

function saveCsv(tdata) {
  csvWriter.writeRecords([tdata]).then(() => {
      // console.log('The CSV file was written successfully'.yellow);
  });
}

function virtualLocTweet (t, cords) {
  let virtualLocation = locationUtils.randomize(cords);
  return {...t, lat: virtualLocation.lat, lon: virtualLocation.lon};
}


function saveUnlocated (t) {
  fs.appendFile('data/unlocated.js', JSON.stringify(t, null, 4), function (err) {
    if (err) throw err;
    // console.log('Non-localizable tweet saved at data/unlocated.js'.yellow);
  });
}

function isGeoTweet(t) {
  let unlocated = !t.geo && !t.user.location;
  if (unlocated) {
    saveUnlocated(t);
  }
  // Si unlocated es false , es que tiene info para geolocalizar y tiramos pa'lante
  return !unlocated;
}
function filterEmptyTweets(o){
    let d = JSON.parse(new Buffer.from(o).toString('utf8'));
    return !d.hasOwnProperty("error");
}

client.stream('statuses/filter', {track: TRACK});

client.on('connection success', function (uri) {
    console.log('connection success', uri);
});

client.on('connection aborted', function () {
    console.log('connection aborted');
});

client.on('connection error network', function () {
    console.log('connection error network');
});

client.on('connection error stall', function () {
    console.log('connection error stall');
});

client.on('connection error http', function () {
    console.log('connection error http');
});

client.on('connection rate limit', function () {
    console.log('connection rate limit');
});

client.on('connection error unknown', function () {
    console.log('connection error unknown');
});

client.on('data keep-alive', function () {
    console.log('data keep-alive');
});

client.on('data error', function () {
    console.log('data error');
});


client
  .pipe(es.filterSync(isGeoTweet))
  .pipe(es.map(mapTweet))
  .pipe(es.filterSync(filterEmptyTweets))
  .pipe(ws)
