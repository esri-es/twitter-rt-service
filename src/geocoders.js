const request = require('request');
const fs = require('fs');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/db.json')
const db = low(adapter)

db.defaults({ addresses: [], user: {}, count: 0 }).write();


/*
    - Comprueba en una DB local si ha sido ya geocodificado
    - Si lo está
        - Devuelve la ubicación & bounding box
    - Sino:
        - geolocalizar user.location con el geocoder indicado:
            - [arcgis](https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer)
            - [osm](https://nominatim.openstreetmap.org/search)
            - ...
        - Guardar en DB local el resultado
*/
function geocode(location, geocoderIndex){
    const geocoderFallback = ["osm", "arcgisGlobal", "arcgis"];
    const i = geocoderIndex? geocoderIndex : 0;
    location = "Entre Baltimore y Getafe";

    // For performance, use .value() instead of .write() if you're only reading from db
    var address = db.get('addresses')
      .find({ location: location })
      .value();

    if(address){
        return new Promise(function(resolve, reject) {
            console.log(`Address found for ${location}!: ${JSON.stringify(address)}`);
            resolve(address.coordinates);
        });
    }
    var p = new Promise(function(resolve, reject) {
        _osmGeocoder.then((coordinates) => {
            if(coordinates != null){
                console.log(`Location ${location} found with OSM => ${JSON.stringify(coordinates)}`)
                resolve(coordinates);
            }else{
                _arcgisGeocoder('global').then((coordinates) => {
                    if(coordinates != null){
                        console.log(`Location ${location} found with ArcGIS Global => ${JSON.stringify(coordinates)}`)
                        resolve(coordinates);
                    }else{
                        resolve(null);
                    }
                },function(err){
                    reject(err);
                })
            }
        },function(err){
            reject(err);
        });
    });

    return p;

}

function _osmGeocoder(){
    const osmGeocoder = 'https://nominatim.openstreetmap.org/search';
    const osmOptions = {
        q: location,
        email: 'hhkaos@gmail.com',
        limit: 1,
        format: 'json'
    };

    var p = new Promise(function(resolve, reject) {

        // Do async job

        request({url:osmGeocoder, qs:osmOptions}, function(err, response, body) {
            if(err) {
                console.log(err);
                return;
                reject(err);
            }
            try{
                var obj = JSON.parse(response.body);
                if(obj.length === 0){
                    console.log(`Location ${location} not found with OSM`);
                    resolve(null);
                }else{
                    var obj = {
                        location: location,
                        coordinates: {
                            lat: obj[0].lat,
                            lon: obj[0].lon
                        },
                        boundingbox: {
                            ymin: obj[0].boundingbox[0],
                            ymax: obj[0].boundingbox[1],
                            xmin: obj[0].boundingbox[2],
                            xmax: obj[0].boundingbox[3]
                        }
                    };
                    db.get('addresses')
                      .push(obj)
                      .write();
                    resolve(obj);
                }
            }catch(err){
                console.log("Error: ", err);
            }
        });

    });

    return p;
}

function _arcgisGeocoder(server){
    const arcgisGeocoder = null;
    if(server === 'local'){
        arcgisGeocoder = 'https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer/findAddressCandidates';
    }else{
        arcgisGeocoder = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    }
    const arcgisOptions = {
        'SingleLineCityName': location,
        'f': 'json',
        'outSR': '{"wkid":4326,"latestWkid":4326}',
        'maxLocations': '1'
    };

    var p = new Promise(function(resolve, reject) {
        request({url:arcgisGeocoder, qs:arcgisOptions}, function(err, response, body) {
            if(err) {
                console.log(err);
                return;
                reject(err);
            }
            var obj = JSON.parse(response.body);
            if(obj.candidates.length === 0){
                console.log(`Location ${location} not found with Local ArcGIS`);
                resolve(null);
            }else{
                var obj = {
                    location: location,
                    coordinates: obj.candidates[0].location,
                    boundingbox: obj.candidates[0].extent
                };
                db.get('addresses')
                  .push(obj)
                  .write();
                resolve(obj);
            }
        });

    });

    return p;
}

module.exports = {
    find: geocode
}
