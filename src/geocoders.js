const fetch = require("node-fetch");
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
colors = require('colors');

const adapter = new FileSync('data/db.json');
const db = low(adapter);

const notFoundDB = low(new FileSync('data/notFoundLocations.json'));

// File database to store locations already geocoded
db.defaults({ "type": "FeatureCollection", features: [] }).write();


const ALLOW_EXTERNAL_GEOCODING = true;
const GEOCODERS = require('./external_geocoders.js');
/*
    - Comprueba en una DB local si ha sido ya geocodificado
    - Si lo está
        - Devuelve la ubicación & bounding box
    - Sino:
        - geolocalizar user.location con el geocoder indicado:
            - [arcgis](https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer)
            - [osm](https://nominatim.openstreetmap.org/search)
            - ...
        - [PENDING] si consigo geolocalizar con alguno de los locators
            - Guardar en DB local el resultado
*/
function isCached(location){
  let address = db.get('features')
    .find({ location: location })
    .value();
  if (address) {
    console.log(`Address found for "${location}" in the local DB: ${JSON.stringify(address)}`.grey);
    return address;
  } else {
    let falseAddress = notFoundDB.get('locations')
      .find({ name: location })
      .value();
    if(falseAddress){
        console.log(`False address "${location}" in the local DB`.red);
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
         let res = json;
         let foundCandidates = opts.name === "osm"
            ? res.length > 0
            : res.candidates.length > 0;

         if(!foundCandidates){
           console.log(`Location "${loc}" not found with ${opts.name}`.red);
           return new Promise((resolve, reject) => {
             reject(`No candidates`);
           });
         } else {
           let results = opts.name === "osm"
            ? {
              location: loc,
               coordinates: {
                   lat: res[0].lat,
                   lon: res[0].lon
               },
               boundingbox: {
                   ymin: res[0].boundingbox[0],
                   ymax: res[0].boundingbox[1],
                   xmin: res[0].boundingbox[2],
                   xmax: res[0].boundingbox[3]
               },
               match: res[0].display_name,
               geocoder: 'OSM'
            }
            : {
               location: loc,
               coordinates: res.candidates[0].location,
               boundingbox: res.candidates[0].extent,
               match: res.candidates[0].address,
               geocoder: opts.name
            };
           //console.log(`Location "${loc}" found with ${opts.name}: ${JSON.stringify(results)}`.green);
           db.get('features')
             .push(results)
             .write();
           return new Promise((resolve,reject) => {
             resolve({coordinates: results, source : opts.name})
           });
          }
     }).catch(function(err){
       console.log(`Failed [${opts.name}] geocoding for [${loc}] - Error [${err}]`.red);
     });
}


// TODO: check if exists in db/notfound.txt, if so, resolve(null) & return
function geocode(location, geocoderName = 'arcgis'){
  let cached = isCached(location);
  if(cached) {
    return new Promise(function(resolve,reject){
      resolve({ coordinates : cached, source : "cached"});
    });
  } else {
    if (ALLOW_EXTERNAL_GEOCODING) {
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
