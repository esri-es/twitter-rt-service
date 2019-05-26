const colors = require('colors');
const fs = require('fs');
const es = require('event-stream');
const {createObjectCsvWriter} = require('csv-writer');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('data/tweets.json');
const db = low(adapter);
db.defaults({ "type": "FeatureCollection", features: [] }).write();

var geocoder,mapping_parties;
// **** BEGIN INTERNAL API ****
function _setGeocoder(geo) {
  geocoder = geo;
}
function _setMappingWords(str) {
  mapping_parties = require('./helpers/elections.js')(str);
}

function _isoDate(dateStr) {
  let date = new Date(dateStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

function _saveUnlocated (t) {
  fs.appendFile('data/unlocated.js', JSON.stringify(t, null, 4), function (err) {
    if (err) throw err;
    // console.log('Non-localizable tweet saved at data/unlocated.js'.yellow);
  });
}
function _saveCsv(tdata) {
  _csvWriter.writeRecords([tdata]).then(() => {
      // console.log('The CSV file was written successfully'.yellow);
  });
  db.get('features')
      .push(tdata)
      .write();
}

function _virtualLocTweet (t, coords) {
  let virtualLocation = geocoder.randomize(coords);
  return {...t,
    lat: virtualLocation.lat,
    lon: virtualLocation.lon,
    admin_level : coords.admin_level,
    geocoder : coords.geocoder,
    location : coords.location,
    match : coords.match,
    match_coords: {
      lon: (coords.coordinates.x)? coords.coordinates.x : coords.coordinates.lon,
      lat: (coords.coordinates.y)? coords.coordinates.y : coords.coordinates.lat
    },
    boundingbox : {
      xmin : parseFloat(coords.boundingbox.xmin),
      ymin : parseFloat(coords.boundingbox.ymin),
      xmax : parseFloat(coords.boundingbox.xmax),
      ymax : parseFloat(coords.boundingbox.ymax)
    }
  };
}

function _addCcaaTweet(t){
  let ccaa = geocoder.findCCAA(t)
  return {...t,
    ccaa: {...ccaa}
  }
}

const _csvWriter = createObjectCsvWriter({
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
        {id: 'IS_RT', title: 'Is_RT'},
        {id: 'lat', title: 'lat'},
        {id: 'lon', title: 'lon'}
    ],
    append:true
});

// **** END INTERNAL API ****

function isGeoTweet(t) {
  let unlocated = !t.geo && !t.user.location;
  //console.log(`unlocated : ${unlocated}`);
  if (unlocated) {
    _saveUnlocated(t);
  }
  // Si unlocated es false , es que tiene info para geolocalizar y tiramos pa'lante
  return !unlocated;
}

function mapTweet(tweet, callback) {
    var data = {
        'username': tweet.user.name,
        'screename': tweet.user.screen_name,
        'text': tweet.text,
        'profile_image_url_https': tweet.user.profile_image_url_https,
        'geo': tweet.geo,
        'location': tweet.user.location,
        'created_at': _isoDate(tweet.created_at),
        'id_str': tweet.id_str,
        'reply_count': tweet.reply_count,
        'retweet_count': tweet.retweet_count,
        'favorite_count': tweet.favorite_count,
        'tweet_url' : tweet.retweeted_status
            ? `https://twitter.com/${tweet.retweeted_status.user.screen_name}/status/${tweet.retweeted_status.id_str}`
            : `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
        'is_rt' : tweet.retweeted_status ? true: false
    };

    location = data.geo? data.geo : data.location;

    console.log(location);
    geocoder.tryGeocoders(location).then((results) => {
      console.log(`geocoded [${location}] from [${results.source}]`.green);
      wsTweetData = _virtualLocTweet(data, results.coordinates);
      callback(null,new Buffer.from(JSON.stringify(wsTweetData)));
    }).catch(function(err){
      console.log(err);
      callback(null, new Buffer.from(JSON.stringify({ error: true })));
    });

}

function filterEmptyTweets(o){
    try {
      let d = JSON.parse(new Buffer.from(o).toString('utf8'));
      return !(d.hasOwnProperty("error"));
    } catch(err) {
      console.log(`Error on [filterEmptyTweets] : ${err}`);
    }
}

function filterUnMarked(o){
    try {
      let d = JSON.parse(new Buffer.from(o).toString('utf8'));
      return d.markWords.length > 0;
    } catch(err) {
      console.log(`Error on [unMarked] : ${err}`);
    }
}

function classifyTweets(t, callback){
  console.log("entra");
  try {
    let tweet = JSON.parse(new Buffer.from(t).toString());
    let wsTweetData = {...tweet, ...mapping_parties(tweet)};

    let geolocatedTweet = (wsTweetData.lat === 0 & wsTweetData.lon === 0);

    if(!geolocatedTweet){
        _saveCsv(wsTweetData);
        //Add admin levels
        wsTweetData = _addCcaaTweet(wsTweetData);
    }

    console.log(`Sending data to ws...`);
    callback(null, new Buffer.from(JSON.stringify(tweetToSend)));
  } catch (err) {
    console.log(`CASCA : [${err}]`);
    callback(true, null);
  }
}

function setup(conf) {
  let twStream = require('./twitter_stream.js')(conf.twitter);
  let geocoder = require('./batch_geocoder.js')(conf.geocoders);
  _setGeocoder(geocoder);
  _setMappingWords(conf.twitter.track);
  let pipeline = twStream
    .pipe(es.filterSync(isGeoTweet))
    .pipe(es.map(mapTweet))
    .pipe(es.filterSync(filterEmptyTweets))
    .pipe(es.map(classifyTweets))
    .pipe(es.filterSync(filterUnMarked));

  if (conf.hasOwnProperty("ws")) {
    let wsStream = require('./helpers/ws_client_stream.js')(conf.ws);
    pipeline.pipe(wsStream);
  }
  return pipeline;
}

module.exports = setup;
