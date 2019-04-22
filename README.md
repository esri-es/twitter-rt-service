# Tareas pendientes

* Geolocalizar el tweet
  - Si tiene geo ->  Generarlocalizacion({lat:..., lon:...})
  - Si no tiene -> Generarlocalizacion(str)
  geocodificar con este

* Servir fichero con CSV [Koop](https://esri-es.github.io/awesome-arcgis/arcgis/developers/profiles/devops/technologies/koop/)

* Conectar con [arcgis_websocket_server](https://github.com/esri-es/arcgis_websocket_server)

* Montar Operations Dashboard o Web AppBuilder

```js
function Generarlocalizacion(location){
    0) Sí location es string:
        - geolocalizar user.location con [locator](https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer)
        - opcional (posibilidad de crear una caché con localizaciones previas en memoria para reducir número de peticiones)
    1) Meter random al estilo de lo que hice aquí: https://github.com/esri-es/real-time-twitter-map/blob/master/js/twitterMap.js#L187
    2) Hacer interseccion espacial con data/spain-boundaries.geojson
    3) Si la intersección es vacía repetir (hasta 3 veces)
}
```


# Tareas terminadas

* Escribir en CSV los tweets recibidos

* Generar la URL del tweet
