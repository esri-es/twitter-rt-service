function randomize(location){
    /*
        TODO:
        1) Meter random al estilo de lo que hice aquí: https://github.com/esri-es/real-time-twitter-map/blob/master/js/twitterMap.js#L187 (usar límites el Bounding box)
        2) Hacer interseccion espacial con data/spain-boundaries.geojson
        3) Si la intersección es vacía repetir (hasta 3 veces)
    */
    return {
        lat: -1,
        lon: -1
    }
}

module.exports = {
    randomize: randomize
}
