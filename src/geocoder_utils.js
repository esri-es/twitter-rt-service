const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('data/db.json');
const db = low(adapter);
const notFoundDB = low(new FileSync('data/notFoundLocations.json'));
// File database to store locations already geocoded
db.defaults({ "type": "FeatureCollection", features: [] }).write();

const CANDIDATES = {
  osm : {
    check : function(obj) {
      return obj.length > 0;
    },
    responseTemplate : function(obj) {
      return {
        location: obj.loc,
        coordinates: {
            lat: obj.res[0].lat,
            lon: obj.res[0].lon
        },
        boundingbox: {
            ymin: obj.res[0].boundingbox[0],
            ymax: obj.res[0].boundingbox[1],
            xmin: obj.res[0].boundingbox[2],
            xmax: obj.res[0].boundingbox[3]
        },
        match: obj.res[0].display_name,
        geocoder: obj.name,
        admin_level : 0 // HARDCODED -> TO BE IMPLEMENTED
      }
    },
    admin_levels : ['Country', 'Region', 'Subregion', undefined, 'City', 'Nbrhd']
  },
  arcgis : {
    check : function(obj) {
      return obj.candidates.length > 0
    },
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
  let foundCandidates = CANDIDATES[name].check(res);
  if (!foundCandidates) {
      console.log(`Location "${loc}" not found with ${name}`.red);
      return new Promise((resolve, reject) => {
          reject(`No candidates`);
      });
  } else {
    let results = CANDIDATES[name].responseTemplate({
      loc : loc,
      name : name,
      res : res,
      admin_levels : CANDIDATES[name].admin_levels
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
}

module.exports = {
  normalize: normalize
}
