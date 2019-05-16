/*  ARCGIS_SAMPLE
    Sample: https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer/findAddressCandidates?SingleLineCityName=nerja&outFields=*&f=pjson

    "Nbrhd": "",
    "City": "Nerja", --> municipio / ciudad
    "Subregion": "Málaga", --> provincia
    "Region": "Andalucía", --> ccaa
    "Addr_type": "SubAdmin",
    "Country": "ESP"
*/

/*
 Check both requirements:
 - osm_type (by priority): ways | relation (if not -> node)
 - class: boundary, administrative, postcode

 TODO: async call to: https://nominatim.openstreetmap.org/search?q=granada&format=json
     output[0].osm_id = 344685
     output[0].osm_type = 'relation' -> R (osmtype:  node (N), way (W) or relation (R) <- res[0].osm_type)
     sample: https://nominatim.openstreetmap.org/details?osmtype=R&osmid=344685&format=json
     output.admin_level

 admin_level:
 4 -> ccaa / autonomous_communities
 6 -> provincia / province
 7 -> comarca / county
 8 -> municipio / ciudad | municipality / city
 9 -> distrito / district

 comunidad autonoma, provincia, comarca, municipio / ciudad, distrito

 https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative
 https://wiki.openstreetmap.org/wiki/Elements
 https://wiki.openstreetmap.org/wiki/Map_Features#Boundary
 https://wiki.openstreetmap.org/wiki/Boundaries#National
*/
const fetch = require("node-fetch");
const geocoderUtils = require('./geocoder_utils');

const OSM_TYPES = {
  relation : "R",
  node : "N",
  way : "W"
}

async function arcgis_geocode (loc,geocoderName) {
  try {
  console.log(`Trying [${geocoderName}] geocoding for location: [${loc}]`.yellow);
   let res = await fetch(buildUrl({
     url : GEOCODERS[geocoderName].url,
     name : geocoderName,
     loc : loc
   })).then(checkStatus);
   let json = await res.json();
   let normalizedRes = geocoderUtils.normalize(loc,geocoderName, json)
   return normalizedRes;
 } catch(err) {
   console.log(`Failed [${geocoderName}] geocoding for [${loc}] - Error [${err}]`.red);
 }
}


async function osm_geocode (loc,geocoderName) {
  try {
   let res = await fetch(buildUrl({
     url : GEOCODERS[geocoderName].url,
     loc : loc,
     name : geocoderName
   })).then(checkStatus);
   let candidates = await res.json();
   if (candidates.length > 0) {
     let json = candidates[0];
     let resAdmArea = await fetch(buildUrl({
       url : GEOCODERS[geocoderName].url.replace("search", "details"),
       name : geocoderName,
       qs : {
         osmtype : OSM_TYPES[json["osm_type"]],
         osmid   : json["osm_id"],
         format  : 'json'
       }
     })).then(checkStatus);
     let resAdmAreajson = await resAdmArea.json();
     let normalizedRes = geocoderUtils.normalize(loc,geocoderName, resAdmAreajson)
     return normalizedRes;
   } else {
     throw new Error('No candidates found');
   }
 } catch(err) {
   console.log(`Failed [${geocoderName}] geocoding for [${loc}] - Error [${err}]`.red);
 }
}

const GEOCODERS = {
  arcgis : {
    name : 'arcgis',
    url : 'https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer/findAddressCandidates',
    qs : function(location) {
      return {
        SingleLineCityName: location,
        f: 'json',
        outFields: '*',
        outSR: '{"wkid":4326,"latestWkid":4326}',
        maxLocations: '1'
      }
    },
    geocode : function(loc) {
      return arcgis_geocode(loc,"arcgis")
    }
  },
  osm : {
    name : 'nominatim',
    url : 'https://nominatim.openstreetmap.org/search',
    qs : function(location) {
      return {
        q: location,
        email: 'rauljimenezortega@gmail.com',
        limit: 1,
        format: 'json',
        countrycodes: 'ES'
      }
    },
    geocode : function(loc) {
      return osm_geocode(loc,"osm");
    }
  },
  arcgisGlobal : {
    name : 'arcgisGlobal',
    url : 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates',
    qs : function(location) {
      return {
        SingleLineCityName: location,
        f: 'json',
        outFields: '*',
        outSR: '{"wkid":4326,"latestWkid":4326}',
        maxLocations: '1',
        sourceCountry: 'ES'
      }
    },
    geocode : function(loc) {
      return arcgis_geocode(loc,"arcgisGlobal")
    }
  }
};

function checkStatus(res) {
  if (res.ok) { // res.status >= 200 && res.status < 300
      return res;
  } else {
      throw new Error(res.statusText);
  }
}

function buildUrl(obj) {
  let url = new URL(obj.url);
  let params = obj.hasOwnProperty("qs")
    ? obj.qs
    : GEOCODERS[obj.name].qs(obj.loc);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return url;
}

module.exports = GEOCODERS;

// function runExternalGeocoder(loc,opts){
//   let url = new URL(opts.url);
//   let params = opts.qs;
//   Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
//   return fetch(url)
//      .then(checkStatus)
//      .then(res => res.json())
//      .then(json => {
//          return geocoderUtils.normalize(loc,opts, json);
//      }).catch(function(err){
//        console.log(`Failed [${opts.name}] geocoding for [${loc}] - Error [${err}]`.red);
//      });
// }
