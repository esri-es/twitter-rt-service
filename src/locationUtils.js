const colors = require('colors');

function randomize(location){
    /*
        TODO:
        1) Meter random al estilo de lo que hice aquí: https://github.com/esri-es/real-time-twitter-map/blob/master/js/twitterMap.js#L187 (usar límites el Bounding box)
        2) Hacer interseccion espacial con data/spain-boundaries.geojson
        3) Si la intersección es vacía repetir (hasta 3 veces)
    */
    let lat, lon;

    try{
        lat = getRandomArbitrary(location.boundingbox.ymin, location.boundingbox.ymax);
        lon = getRandomArbitrary(location.boundingbox.xmin, location.boundingbox.xmax)
    }catch(err){
        console.log(`Error: ${err}\nRandomzing location: ${JSON.stringify(location)}`.red);
    }


    return {
        lat: lat,
        lon: lon
    }
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};

module.exports = {
    randomize: randomize
}
