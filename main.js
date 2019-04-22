var config = require('./config.json');
var Twitter = require('twitter');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
var jp = require('jsonpath');

var client = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

const csvWriter = createCsvWriter({
    path: 'tweets.csv',
    header: [
        {id: 'tweet_url', title: 'Tweet_URL'},
        {id: 'username', title: 'Username'},
        {id: 'screename', title: 'Screenmae'},
        {id: 'geo', title: 'Geo'},
        {id: 'location', title: 'Location'},
        {id: 'created_at', title: 'Created_at'},
        {id: 'id_str', title: 'ID_str'},
        {id: 'reply_count', title: 'Reply_count'},
        {id: 'retweet_count', title: 'Retweet_count'},
        {id: 'favorite_count', title: 'Favorite_count'},
    ],
    // append:true
});

var stream = client.stream('statuses/filter', {track: 'FelizLunes'});

stream.on('data', function(tweet) {
    // write some data with a base64 encoding
    var data = {
        'username': tweet.user.name,
        'screename': tweet.user.screen_name,
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

    csvWriter.writeRecords([data]).then(() => {
        console.log('The CSV file was written successfully');
    });


});

stream.on('error', function(error) {
    throw error;
});
