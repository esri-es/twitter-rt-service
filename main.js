const   config = require('./config.json'),
        Twitter = require('twitter'),
        createCsvWriter = require('csv-writer').createObjectCsvWriter,
        jp = require('jsonpath'),
        fs = require('fs'),
        geocode = require('./src/geocoders');

const client = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

const csvWriter = createCsvWriter({
    path: 'tweets.csv',
    header: [
        {id: 'username', title: 'Username'},
        {id: 'screename', title: 'Screenmae'},
        {id: 'profile_image_url_https', title: 'Avatar'},
        {id: 'geo', title: 'Geo'},
        {id: 'location', title: 'Location'},
        {id: 'created_at', title: 'Created_at'},
        {id: 'id_str', title: 'ID_str'},
        {id: 'reply_count', title: 'Reply_count'},
        {id: 'retweet_count', title: 'Retweet_count'},
        {id: 'favorite_count', title: 'Favorite_count'},
        {id: 'tweet_url', title: 'Tweet_URL'}
    ],
    // append:true
});

var stream = client.stream('statuses/filter', {track: 'ELDEBATEenRTVE'});

stream.on('data', function(tweet) {
    if(!tweet.geo && tweet.user && !tweet.user.location){
        fs.appendFile('data/unlocated.js', JSON.stringify(tweet, null, 4), function (err) {
          if (err) throw err;
          console.log('Non-localizable tweet saved at data/unlocated.js');
        });
        return 0;
    }

    var data = {
        'username': tweet.user.name,
        'screename': tweet.user.screen_name,
        'profile_image_url_https': tweet.user.profile_image_url_https,
        'geo': tweet.geo,
        'location': tweet.user.location,
        // tweet.user.virtualLocation <- generado por nosotros,
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

    if(data.geo){
        geolocateTweet(data.geo);
    }else if(data.location){
        geolocateTweet(data.location);
    }else{
        console.log('This should never happen');
    }

    csvWriter.writeRecords([data]).then(() => {
        // console.log('The CSV file was written successfully');
    });

});

function geolocateTweet(location){
    if(typeof location === 'string'){
        geocode.find(location,'osm').then((coordinates) => {
            console.log(`Location ${location}: ${JSON.stringify(coordinates)}`);
        });

    }else if(typeof location !== 'obj'){
        console.log("Valid location!: ", location);
    }
}



stream.on('error', function(error) {
    throw error;
});
