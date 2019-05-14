const fetch = require("node-fetch");
const fs = require('fs');
const colors = require('colors')
const geocoderUtils = require('./geocoder_utils');

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

function checkStatus(res) {
    if (res.ok) { // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw new Error(res.statusText);
    }
}


function runExternalGeocoder(loc,opts){
  let url = new URL(opts.url);
  let params = opts.qs;
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return fetch(url)
     .then(checkStatus)
     .then(res => res.json())
     .then(json => {
         return geocoderUtils.normalize(loc,opts, json);
     }).catch(function(err){
       console.log(`Failed [${opts.name}] geocoding for [${loc}] - Error [${err}]`.red);
     });
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
      let options = {
        name : GEOCODERS[geocoderName].name,
        url  : GEOCODERS[geocoderName].url,
        qs   : GEOCODERS[geocoderName].qs(location)
      };
      console.log(`Trying [${geocoderName}] geocoding for location: [${location}]`.yellow);
      return runExternalGeocoder(location, options);
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
