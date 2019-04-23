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

/*
    - Comprueba en una DB local si ha sido ya geocodificado
    - Si lo está
        - Devuelve la ubicación & bounding box
    - Sino:
        - geolocalizar user.location con el geocoder indicado:
            - [arcgis](https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer)
            - [osm](https://nominatim.openstreetmap.org/search)
            - ...
        - si consigo geolocalizar con alguno de los locators
            - Guardar en DB local el resultado
*/
function geocode(location, geocoderIndex){
    const geocoderFallback = ["arcgis", /*"osm",*/ "arcgisGlobal"];
    const i = geocoderIndex? geocoderIndex : 0;

    var address = db.get('features')
      .find({ location: location })
      .value();

    if(address){
        return new Promise(function(resolve, reject) {
            console.log(`Address found for "${location}" in the local DB: ${JSON.stringify(address)}`.green);
            resolve(address);
        });
    }

    var falseAddress = notFoundDB.get('locations')
      .find({ name: location })
      .value();

    if(falseAddress){
        return new Promise(function(resolve, reject) {
            console.log(`False address "${location}" in the local DB`.red);
            resolve(null);
        });
    }

    // TODO: check if exists in db/notfound.txt, if so, resolve(null) & return

    switch(geocoderFallback[i]){
        case 'arcgis':
        const arcgisGeocoder = 'https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer/findAddressCandidates';
        const arcgisOptions = {
            'SingleLineCityName': location,
            'f': 'json',
            'outSR': '{"wkid":4326,"latestWkid":4326}',
            'maxLocations': '1'
        };

        var p = new Promise(function(resolve, reject) {
            request({url:arcgisGeocoder, qs:arcgisOptions}, function(err, response, body) {
                if(err) {
                    console.log(`Error: ${err.red}`.red);
                    reject(err);
                    return;
                }
                var obj = JSON.parse(response.body);
                if(obj.candidates.length === 0){
                    console.log(`Location "${location}" not found with Local ArcGIS`.red);
                    if(geocoderFallback.length > i+1){
                        geocode(location,i+1).then((coordinates) => {
                            if(coordinates != null){
                                console.log(`Location "${location}" found with ${geocoderFallback[i+1]}: ${JSON.stringify(coordinates)}`.green);
                            }
                            resolve(coordinates);
                        },function(err){
                            reject(err);
                        });
                    }else{
                        resolve(null);
                    }
                }else{
                    var obj = {
                        location: location,
                        coordinates: obj.candidates[0].location,
                        boundingbox: obj.candidates[0].extent,
                        match: obj.candidates[0].address,
                        geocoder: 'ArcGIS Local'
                    };
                    console.log(`Location "${location}" found with ${geocoderFallback[i]}: ${JSON.stringify(obj)}`.green);
                    db.get('features')
                      .push(obj)
                      .write();
                    resolve(obj);
                }
            });

        });
        break;

        case 'osm':
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
                    console.log(`Error: ${err}`.red);
                    return;
                    reject(err);
                }
                try{
                    var obj = JSON.parse(response.body);
                    if(obj.length === 0){
                        console.log(`Location "${location}" not found with OSM`.red);
                        // console.log(`i=${i}, geocoderFallback=${geocoderFallback}, geocoderFallback.length=${geocoderFallback.length}`.yellow)
                        if(geocoderFallback.length > i+1){
                            // console.log(`Geocodificamos ahora con ${geocoderFallback[i+1]}`.yellow)

                            geocode(location,i+1).then((coordinates) => {
                                if(coordinates != null){
                                    console.log(`Location "${location}" found with ${geocoderFallback[i+1]}: ${JSON.stringify(coordinates)}`.green);
                                }
                                resolve(coordinates);
                            },function(err){
                                reject(err);
                            });
                        }else{
                            resolve(null);
                        }
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
                            },
                            match: obj[0].display_name,
                            geocoder: 'OSM'
                        };
                        console.log(`Location "${location}" found with ${geocoderFallback[i]}: ${JSON.stringify(obj)}`.green);
                        db.get('features')
                          .push(obj)
                          .write();
                        resolve(obj);
                    }
                }catch(err){
                    console.log(`Error: ${err}`.red);
                }
            });

        });
        break;

        case 'arcgisGlobal':
        const arcgisWorldGeocoder = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
        const arcgisGlobalOptions = {
            'SingleLineCityName': location,
            'f': 'json',
            'outSR': '{"wkid":4326,"latestWkid":4326}',
            'maxLocations': '1'
        };

        var p = new Promise(function(resolve, reject) {
            request({url:arcgisWorldGeocoder, qs:arcgisGlobalOptions}, function(err, response, body) {
                if(err) {
                    console.log(`Error: ${err}`.red);
                    return;
                    reject(err);
                }
                var obj = JSON.parse(response.body);
                if(obj.candidates.length === 0){
                    console.log(`Location "${location}" not found Global ArcGIS`.red);
                    if(geocoderFallback.length > i+1){
                        debugger
                        geocode(location,i+1).then((coordinates) => {
                            if(coordinates != null){
                                console.log(`Location "${location}" found with ${geocoderFallback[i+1]}: ${JSON.stringify(coordinates)}`.green);
                            }
                            resolve(coordinates);
                        },function(err){
                            reject(err);
                        });
                    }else{
                        resolve(null);
                    }

                }else{
                    var obj = {
                        location: location,
                        coordinates: obj.candidates[0].location,
                        boundingbox: obj.candidates[0].extent,
                        match: obj.candidates[0].address,
                        geocoder: 'ArcGIS Global'
                    };
                    console.log(`Location "${location}" found with ${geocoderFallback[i]}: ${JSON.stringify(obj)}`.green);
                    db.get('features')
                      .push(obj)
                      .write();
                    resolve(obj);
                }
            });

        });
        break;
    }

    return p;

}

module.exports = {
    find: geocode
}
