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


module.exports = {
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
    }
  }
};
