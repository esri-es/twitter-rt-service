let {ws,geocoders} = require('./config/elections.json');

const WORDS_TO_TRACK = "PP,PSOE,CIUDADANOS,VOX,PODEMOS";

const electionsStream = require('./lib/elections_stream.js')({
  ws : ws,
  geocoders : ["arcgis"],
  twitter : {
    track : process.argv[2] || WORDS_TO_TRACK,
    credentials : require('./config/twitter_credentials.json')
  }
});
