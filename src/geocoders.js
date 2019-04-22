const   request = require('request'),
        fs = require('fs');

function geocode(location, geocoder){
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

            // Do async job

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
                    newLocation = obj.candidates[0].location;
                    resolve(newLocation);
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
                        newLocation = {
                            lat: obj[0].lat,
                            lon: obj[0].lon
                        };
                        resolve(newLocation);
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
