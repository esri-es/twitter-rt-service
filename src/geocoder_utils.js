const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('data/db.json');
const db = low(adapter);
const notFoundDB = low(new FileSync('data/notFoundLocations.json'));

// File database to store locations already geocoded
db.defaults({ "type": "FeatureCollection", features: [] }).write();
function normalize(loc,opts, json) {
    let res = json;
    let foundCandidates;


    switch (opts.name) {
        case 'nominatim':
            foundCandidates = res.length > 0;
            break;

        case 'arcgis':
            foundCandidates = res.candidates.length > 0
            break;

            // TODO: add "pelias" geocoder
    }

    if (!foundCandidates) {
        console.log(`Location "${loc}" not found with ${opts.name}`.red);
        return new Promise((resolve, reject) => {
            reject(`No candidates`);
        });
    } else {

        let results;
        switch (opts.name) {
            case 'nominatim':
                results = {
                    location: loc,
                    coordinates: {
                        lat: res[0].lat,
                        lon: res[0].lon
                    },
                    boundingbox: {
                        ymin: res[0].boundingbox[0],
                        ymax: res[0].boundingbox[1],
                        xmin: res[0].boundingbox[2],
                        xmax: res[0].boundingbox[3]
                    },
                    match: res[0].display_name,
                    geocoder: opts.name
                };

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
                //const SPANISH_ADMIN_LEVELS = ['Country', 'Autonomous Community', 'Province', 'County', 'Municipality', 'District'];

                break;

            case 'arcgis':
                results = {
                    location: loc,
                    coordinates: res.candidates[0].location,
                    boundingbox: res.candidates[0].extent,
                    match: res.candidates[0].address,
                    geocoder: opts.name
                }

                /*
                    Sample: https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer/findAddressCandidates?SingleLineCityName=nerja&outFields=*&f=pjson

                    "Nbrhd": "",
                    "City": "Nerja", --> municipio / ciudad
                    "Subregion": "Málaga", --> provincia
                    "Region": "Andalucía", --> ccaa
                    "Addr_type": "SubAdmin",
                    "Country": "ESP"
                */
                //const SPANISH_ADMIN_LEVELS = ['Country', 'Autonomous Community', 'Province', 'County', 'Municipality', 'District'];
                const ARCGIS_ADMIN_LEVELS = ['Country', 'Region', 'Subregion', undefined, 'City', 'Nbrhd'];
                let i = ARCGIS_ADMIN_LEVELS.length - 1;
                while (i >= 0 && (res.candidates[0].attributes[ARCGIS_ADMIN_LEVELS[i]] === "" || ARCGIS_ADMIN_LEVELS[i] === undefined)) {
                    i--;
                }
                results.admin_level = i;

                break;

                // TODO: add "pelias" geocoder
        }

        //console.log(`Location "${loc}" found with ${opts.name}: ${JSON.stringify(results)}`.green);
        db.get('features')
            .push(results)
            .write();

        return new Promise((resolve, reject) => {
            resolve({
                coordinates: results,
                source: opts.name
            })
        });
    }
}

module.exports = {
  normalize: normalize
}
