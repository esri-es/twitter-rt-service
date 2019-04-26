const request = require('request');
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
    console.log(`Address found for "${location}" in the local DB: ${JSON.stringify(address)}`.green);
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



function runExternalGeocoder(loc,opts){
  return new Promise((resolve,reject) => {
   request({url:opts.url, qs:opts.qs}, function(err, response, body) {
     if(err) {
         console.log(`Error: ${err.red}`.red);
         reject(err);
     }
     let res = JSON.parse(response.body);
     let foundCandidates = opts.name === "osm"
        ? res.length > 0
        : res.candidates.length > 0;

     if(!foundCandidates){
       console.log(`Location "${loc}" not found with ${opts.name}`.red);
       reject(`failed [${opts.name}] geocoding`);
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
       console.log(`Location "${loc}" found with ${opts.name}: ${JSON.stringify(results)}`.green);
       db.get('features')
         .push(results)
         .write();
       resolve(results);
     }
   })
  });
}

    // TODO: check if exists in db/notfound.txt, if so, resolve(null) & return
function geocode(location, geocoderName = 'arcgis'){
  let cached = isCached(location);
  if(cached) {
    return new Promise(function(resolve,reject){
      resolve(cached);
    });
  } else {
    if (ALLOW_EXTERNAL_GEOCODING) {
      let options = {
        name : GEOCODERS[geocoderName].name,
        url  : GEOCODERS[geocoderName].url,
        qs   : GEOCODERS[geocoderName].qs(location)
      };
      console.log(`Trying [${geocoderName}] geocoding for location: [${location}]`);
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
