const colors = require('colors');
const {randomPosition} = require('@turf/random');
const PolygonLookup = require('polygon-lookup');
const spain = require('../data/spain-boundaries.json')
const ccaa = require('../data/spanish-ccaa-boundaries.json')
const LOOKUP_CCAA = new PolygonLookup(ccaa);
const LOOKUP_SPAIN = new PolygonLookup(spain);
const SPAIN_EXTENT = [-18.1607999245551,27.6377369098232,4.32788540952535,43.7899967308538];

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
    do {
      lat = getRandomArbitrary(ymin, ymax);
      lon = getRandomArbitrary(xmin, xmax);
      ymin += yDiff;
      ymax -= yDiff;
      xmin += xDiff;
      xmax -= xDiff;
      i++;
    } while(!_isInsideSpain(lon, lat) && i < 3);
    if(i === 3){
      throw "Geolocation attempts exceeded";
    }
  } catch(err) {
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

function _isInsideSpain(lon, lat){
  let candidate = LOOKUP_SPAIN.search(lon,lat);
  return candidate !== undefined;
}

function findCCAA(tweet) {
  let {lat,lon} = tweet.match_coords;
  let candidate = LOOKUP_CCAA.search(lon,lat);
  let result = candidate
    ? {
      // No he puesto el indice , lo necesitas?
      OBJECTID: candidate.properties.OBJECTID,
      Nombre: candidate.properties.Nombre,
      cod_CCAA: candidate.properties.cod_CCAA
    }
    : null;
  return result;

}

module.exports = {
    randomize: randomize,
    findCCAA: findCCAA
}
