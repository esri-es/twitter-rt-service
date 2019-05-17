const fetch = require("node-fetch");
const geocoderUtils = require('./geocoder_utils');
const AbortController = require("abort-controller");

const OSM_TYPES = {
  relation : "R",
  node : "N",
  way : "W"
}


async function arcgis_geocode (loc,geocoderName) {
  const controller = new AbortController()
  const signal = controller.signal
  setTimeout(() => {
    controller.abort()
  }, GEOCODERS[geocoderName].timeout);
  try {

   let res = await fetch(buildUrl({
     url : GEOCODERS[geocoderName].url,
     name : geocoderName,
     loc : loc
   }),{ signal }).then(checkStatus);
   let json = await res.json();
   if (json.candidates.length > 0) {
     let normalizedRes = geocoderUtils.normalize(loc,geocoderName, json)
     return normalizedRes;
   } else {
     throw new Error('No candidates found');
   }
 } catch(err) {
   console.log(`Failed [${geocoderName}] geocoding for [${loc}] - [${err}]`.red);
 }
}


async function osm_geocode (loc,geocoderName) {
  const controller = new AbortController()
  const signal = controller.signal
  setTimeout(() => {
    controller.abort()
  }, GEOCODERS[geocoderName].timeout);
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
     let normalizedRes = geocoderUtils.normalize(loc,geocoderName, {...resAdmAreajson,...json})
     return normalizedRes;
   } else {
     throw new Error('No candidates found');
   }
 } catch(err) {
   console.log(`Failed [${geocoderName}] geocoding for [${loc}] - [${err}]`.red);
 }
}

const GEOCODERS = {
  arcgis : {
    name : 'arcgis',
    url : 'https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer/findAddressCandidates',
    timeout : 30000,
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
    timeout : 30000,
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
  console.log(`Fetching attempt url : [${url.href}]`.yellow);
  return url;
}

module.exports = GEOCODERS;
