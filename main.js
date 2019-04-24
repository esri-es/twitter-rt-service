const config = require('./config.json');
const Twitter = require('twitter');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const jp = require('jsonpath');
const fs = require('fs');
const geocode = require('./src/geocoders');
const locationUtils = require('./src/locationUtils');
const colors = require('colors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const WebSocketServer = require('websocket').server;
const http = require('http');

const PORT = 7070;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(PORT, function() {
    console.log((new Date()) + ` Server is listening on port ${PORT}`);
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    // var interval = setInterval(function(client, arr) {
    //   connection.sendUTF(JSON.stringify(arr.shift()));
    // }, TIME_INTERVAL, connection,[...messagesArr]);


    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

const adapter = new FileSync('data/notFoundLocations.json');
const db = low(adapter);

db.defaults({ "locations": [] }).write();


const client = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

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

var stream = client.stream('statuses/filter', {track: 'ELDEBATEenRTVE'});

stream.on('data', function(tweet) {
    if(!tweet.geo && tweet.user && !tweet.user.location){
        fs.appendFile('data/unlocated.js', JSON.stringify(tweet, null, 4), function (err) {
          if (err) throw err;
          // console.log('Non-localizable tweet saved at data/unlocated.js'.yellow);
        });
        return 0;
    }

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
        'favorite_count': tweet.favorite_count
    };

    if(tweet.retweeted_status){
        data.tweet_url = `https://twitter.com/${tweet.retweeted_status.user.screen_name}/status/${tweet.retweeted_status.id_str}`;
    }else{
        data.tweet_url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
    }

    if(data.geo || data.location){
        location = data.geo? data.geo : data.location;
        geolocateTweet(location).then((coordinates) => {
            // Now it's time to add a random value to its location and ensure it falls in land
            if(coordinates != null){
                var virtualLocation = locationUtils.randomize(coordinates);

                // Write in the CSV the received and geolocated tweets
                data.lat = virtualLocation.lat;
                data.lon = virtualLocation.lon;
                csvWriter.writeRecords([data]).then(() => {
                    // console.log('The CSV file was written successfully'.yellow);
                });

                // TODO: send tweet by socket connection

            }
        },function(err){
            console.log(`Error: ${err}`.red);
        })
    }else{
        console.log('This should never happen'.red);
    }

});

function geolocateTweet(location){
    return new Promise(function(resolve, reject) {
        if(typeof location === 'string'){
            geocode.find(location).then((coordinates) => {
                if(coordinates === null){
                    // TODO: save also which geocoders has been tried to geocode the address
                    db.get('locations')
                      .push({name: location})
                      .write();
                }
                // console.log(`Location ${location}: ${JSON.stringify(coordinates)}`.green);
                resolve(coordinates);
            },function(err){
                reject(err);
            });
        }else if(typeof location !== 'obj'){
            try{
                /*
                    TODO: Check twitter location format and change to
                    {
                        location: location,
                        coordinates: {
                            lat: obj[0].lat,
                            lon: obj[0].lon
                        },
                        boundingbox: obj[0].boundingbox
                    }
                */
                console.log(`Valid location!: ${location}`.blue);
                resolve(location);
            }catch(err){
                reject(err);
            }
        }
    });
}

stream.on('error', function(error) {
    throw error;
});
