const fs = require('fs');
const colors = require('colors')


const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('data/db.json');
const db = low(adapter);
const notFoundDB = low(new FileSync('data/notFoundLocations.json'));
// File database to store locations already geocoded
db.defaults({ "type": "FeatureCollection", features: [] }).write();


const ALLOW_EXTERNAL_GEOCODING = true;
const GEOCODERS = require('./external_geocoders.js');

function checkCache(location){
  let address = db.get('features')
    .find({ location: location })
    .value();
  if (address) {
    console.log(`Address found for "${location}" in the local DB: ${JSON.stringify(address)}`.grey);
    return address;
  } else {
    let notFoundAddress = notFoundDB.get('locations')
      .find({ name: location })
      .value();
    if(notFoundAddress){
        console.log(`Not found address "${location}" in the notFoundDB`.red);
        return true;
    }else{
        return false;
    }
  }
}

// TODO: check if exists in db/notfound.txt, if so, resolve(null) & return
function geocode(location, geocoderName = 'arcgis'){
  let cached = checkCache(location);
  if(cached.hasOwnProperty('coordinates')) {
    return new Promise(function(resolve,reject){
      resolve({ coordinates : cached, source : "cached"});
    });
  } else {
    if (ALLOW_EXTERNAL_GEOCODING && !cached) {
      // let options = {
      //   name : GEOCODERS[geocoderName].name,
      //   url  : GEOCODERS[geocoderName].url,
      //   qs   : GEOCODERS[geocoderName].qs(location)
      // };
      
      return GEOCODERS[geocoderName].geocode(location);
    } else {
      return new Promise(function(resolve,reject){
        console.log("sin geocoding");
        reject("sin geocoding");
      });
    }
  }
}

module.exports = {
    find: geocode
}
