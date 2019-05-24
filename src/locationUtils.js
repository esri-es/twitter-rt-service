const colors = require('colors');
const {randomPoint} = require('@turf/random');
const PolygonLookup = require('polygon-lookup');
const spain = require('../data/spain-boundaries.json')
const ccaa = require('../data/spanish-ccaa-boundaries.json')
const LOOKUP_CCAA = new PolygonLookup(ccaa);
const LOOKUP_SPAIN = new PolygonLookup(spain);

function randomize(location){
  let {xmin,ymin,xmax,ymax} = location.boundingbox;
  let [lon,lat] =randomPoint(1, {bbox : [xmin,ymin,xmax,ymax]}).features[0].geometry.coordinates;
  return {
    lat : lat,
    lon : lon
  };
}

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
