const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('data/db.json');
const db = low(adapter);
const notFoundDB = low(new FileSync('data/notFoundLocations.json'));
// File database to store locations already geocoded
db.defaults({ "type": "FeatureCollection", features: [] }).write();

const CANDIDATES = {
  osm : {
    responseTemplate : function(obj) {
      //Comma separated list of min latitude, max latitude, min longitude, max longitude
      let [ymin,ymax,xmin,xmax] = obj.res.boundingbox;
      return {
        location: obj.loc,
        coordinates: {
            lat: obj.res.lat,
            lon: obj.res.lon
        },
        boundingbox: {
          xmin : xmin,
          ymin : ymin,
          xmax : xmax,
          ymax : ymax
        }  ,
        match: obj.res.display_name,
        geocoder: obj.name,
        admin_level : obj.res.admin_level // HARDCODED -> TO BE IMPLEMENTED
      }
    },
    admin_levels : ['Country', 'Region', 'Subregion', undefined, 'City', 'Nbrhd']
  },
  arcgis : {
    responseTemplate : function(obj) {
      let i = obj.admin_levels.length - 1;
      while (i >= 0 && (obj.res.candidates[0].attributes[obj.admin_levels[i]] === "" || obj.admin_levels[i] === undefined)) {
          i--;
      }

      return {
          location: obj.loc,
          coordinates: obj.res.candidates[0].location,
          boundingbox: obj.res.candidates[0].extent,
          match: obj.res.candidates[0].address,
          geocoder: obj.name,
          admin_level: i
      }
    },
    admin_levels : ['Country', 'Region', 'Subregion', undefined, 'City', 'Nbrhd']
  }
}

function normalize(loc,name,res) {
  let results = CANDIDATES[name].responseTemplate({
    loc : loc,
    name : name,
    res : res,
    admin_levels : name === "osm"
      ? res.admin_level
      : CANDIDATES[name].admin_levels
  });

  //console.log(`Location "${loc}" found with ${name}: ${JSON.stringify(results)}`.green);
  db.get('features')
      .push(results)
      .write();

  return new Promise((resolve, reject) => {
      resolve({
          coordinates: results,
          source: name
      })
  });
}

module.exports = {
  normalize: normalize
}
