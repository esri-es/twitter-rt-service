# Tareas pendientes

* [x] Generar la URL del tweet

* [ ] Geolocalizar el tweet
  * [x] Si no está geolocalizado -> geolocalizar = geocoderFind(str)
  * [ ] Implementar distorsionarLocalizacion({lat:..., lon:..., boundingbox: ...})

* [ ] Escribir en CSV los tweets recibidos & geolocalizados (parcialmente hecho)


* [ ] Servir fichero con CSV [Koop](https://esri-es.github.io/awesome-arcgis/arcgis/developers/profiles/devops/technologies/koop/)

* [ ] Conectar con [arcgis_websocket_server](https://github.com/esri-es/arcgis_websocket_server)

* [ ] Montar Operations Dashboard o Web AppBuilder

## Pseudocodigo de funciones

```js
function distorsionarLocalizacion(location){
    1) Meter random al estilo de lo que hice aquí: https://github.com/esri-es/real-time-twitter-map/blob/master/js/twitterMap.js#L187 (usar límites el Bounding box)
    2) Hacer interseccion espacial con data/spain-boundaries.geojson
    3) Si la intersección es vacía repetir (hasta 3 veces)
}
```


```js
function geocoderFind(location, geocoder){
    Sí location es string:
        - comprobar en una DB local si ha sido ya geocodificado
        sino:
            - geolocalizar user.location con el geocoder indicado:
                - [arcgis](https://cloudlab.esri.es/server/rest/services/ESP_AdminPlaces/GeocodeServer)
                - [osm](https://nominatim.openstreetmap.org/search)
                - ...
            - Guardar en DB local el resultado
```
