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
