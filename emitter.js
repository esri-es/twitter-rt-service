let {ws} = require('./config/elections.json');

const WORDS_TO_TRACK = "#PP,#PSOE,#CIUDADANOS,#VOX,#PODEMOS,#26M";

const electionsStream = require('./lib/elections_stream.js')({
  ws : ws,
  geocoders : ["arcgis"], //,"osm"],
  twitter : {
    track : process.argv[2] || WORDS_TO_TRACK,
    credentials : require('./config/twitter_credentials.json')
  }
});
