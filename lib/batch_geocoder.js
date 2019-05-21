const geocode = require('../src/geocoders');
const locationUtils = require('../src/locationUtils');

var GEO_LIST;

function _setList(list){
  GEO_LIST = list;
}

function _switchGeo () {
  GEO_LIST.reverse();
}

async function tryGeocoders(loc) {
  var results,nextgeo;
  var arr = [...GEO_LIST];
  while(arr.length > 0) {
    nextgeo = arr.shift();
    try {
      results = await geocode.find(loc, nextgeo);
      if (results && results.hasOwnProperty("coordinates")){
        break;
      }
    } catch(err) {
      _switchGeo();
      continue;
    }
  }
  return new Promise((resolve, reject) => {
    if (results && results.hasOwnProperty("coordinates")){
      resolve(results);
    } else {
      reject(`ERROR attempting to geocode [${loc}] with [${nextgeo}]`.red);
    }
  });
}

module.exports = function(list){
  _setList(list);
  return {
    tryGeocoders : tryGeocoders,
    randomize : locationUtils.randomize,
  }
}
