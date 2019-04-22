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
function geocode(location, geocoder){
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

    if(!geocoder){
        console.log('Please specify a geocoder');
        return -1;
    }

    switch(geocoder){
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
                    console.log(err);
                    return;
                    reject(err);
                }
                var obj = JSON.parse(response.body);
                if(obj.candidates.length === 0){
                    console.log(`Location ${location} not found`);
                    fs.appendFile('data/notfound.txt', location, function (err) {
                      if (err) throw err;
                    });
                    resolve(null);
                }else{
                    var obj = {
                        location: location,
                        coordinates: obj.candidates[0].location
                        // TODO: add boundingbox
                    };
                    db.get('addresses')
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
                    console.log(err);
                    return;
                    reject(err);
                }
                try{
                    var obj = JSON.parse(response.body);
                    if(obj.length === 0){
                        console.log(`Location ${location} not found`);
                        fs.appendFile('data/notfound.txt', location, function (err) {
                          if (err) throw err;
                        });
                        resolve(null);
                    }else{
                        var obj = {
                            location: location,
                            coordinates: {
                                lat: obj[0].lat,
                                lon: obj[0].lon
                            },
                            boundingbox: obj[0].boundingbox
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
        break;
    }

    return p;

}

module.exports = {
    find: geocode
}
