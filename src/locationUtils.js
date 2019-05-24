const colors = require('colors');
const turf = require('@turf/turf');
const spain = require('../data/spain-boundaries.json')
const ccaa = require('../data/spanish-ccaa-boundaries.json')

function randomize(location){
    let lat, lon;

    try{
        let i = 1,
            ymin = parseFloat(location.boundingbox.ymin),
            ymax = parseFloat(location.boundingbox.ymax),
            xmin = parseFloat(location.boundingbox.xmin),
            xmax = parseFloat(location.boundingbox.xmax);
            yDiff = ymax - ymin,
            xDiff = xmax - xmin;

        do{
            lat = getRandomArbitrary(ymin, ymax);
            lon = getRandomArbitrary(xmin, xmax);
            ymin += yDiff;
            ymax -= yDiff;
            xmin += xDiff;
            xmax -= xDiff;
            i++;
        }while(!isInsideSpain(lon, lat) && i < 3);

        if(i === 3){
            throw "Randomize Geolocation attempts exceeded";
        }
    }catch(err){
        console.log(`${err}\nRandomzing location: ${JSON.stringify(location)}`.red);
        lon = lat = 0;
    }

    return {
        lat: lat,
        lon: lon
    }
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};

function isInsideSpain(lon, lat){
    var is_in = false;
    var numPolygons = spain.features[0].geometry.coordinates.length;
    var i = 0;
    var point = turf.points([[lon, lat]]);

    do{
        let coords = spain.features[0].geometry.coordinates[i],
            searchWithin = turf.polygon(coords);
            ptsWithin = turf.pointsWithinPolygon(point, searchWithin);

        if(ptsWithin.features.length > 0){
            is_in = true;
            // console.log(`Point found inside Spain (${i} iterations needed)`.green);
        }
        i++;
    }while(!is_in && i < numPolygons);

    return is_in;
}

function findCCAA(tweet){
    var is_in = null,
        c = tweet.match_coords; // Check agains coords returned by the geocoder (not random)

    var numCCAAs = ccaa.features.length;
    var ccaaIndex = 0;
    
    var point = turf.points([[c.lon, c.lat]]);

    do{
        var ccaaCoords = ccaa.features[ccaaIndex].geometry.coordinates;
        var numPolygons = ccaaCoords.length;
        var polygonIndex = 0;

        do{
            let coords = ccaaCoords[polygonIndex];
            // while(coords.indexOf(null) != -1){
            //     //For some reason the layer have rings with null values on it that makes turf to fails
            //     coords.splice(coords.indexOf(null),1)
            // }
            let searchWithin = turf.polygon(coords);
                ptsWithin = turf.pointsWithinPolygon(point, searchWithin);

            if(ptsWithin.features.length > 0){
                var prop = ccaa.features[ccaaIndex].properties;
                is_in = {
                    index: ccaaIndex,
                    OBJECTID: prop.OBJECTID,
                    Nombre: prop.Nombre,
                    cod_CCAA: prop.cod_CCAA
                    // ....cod_CCAA
                };
                // console.log(`Point found inside Spain (${i} iterations needed)`.green);
            }
            polygonIndex++;
        }while(!is_in && polygonIndex < numPolygons);
        
        ccaaIndex++;
    }while(!is_in && ccaaIndex < numCCAAs);

    return is_in;
}

module.exports = {
    randomize: randomize,
    findCCAA: findCCAA
}
