# twitter-rt-service

Este script se conecta a la [Stream API de Twitter](https://developer.twitter.com/en/docs) para recibir tweets en tiempo real e intentar geocodificarlos. Si lo consigue los envía a la dirección indicada por la variable `ws` del fichero `config/elections.json` (por defecto lo envía a `'ws://localhost:8888'`).

> **Relacionado**: Este proyecto en combinación con [arcgis_websocket_server](https://github.com/esri-es/arcgis_websocket_server) permite servir estos datos haciéndose pasar por Stream Layer, y por tanto cargar los tweets en tiempo real en un webmap/webscene y/ cualquier<sup>1</sup> SDK/API de ArcGIS (<sup>1</sup> se ha detectado alguna [limitación](https://github.com/hhkaos/arcgis_websocket_server#known-issues)).

![animation](./img/console-animation.gif)

La estructura de la información enviada se puede ver al final de esta documentación.

## Instalación

Para instalar sólo es necesario ejecutar tener NodeJS instalado y ejecutar desde el directorio raíz del proyecto: `$ npm install`

## Configuración y ejecución

1. Crear un fichero de configuración llamado `config/twitter_credentials.json`
```
{
  "consumer_key": "YOUR_CONSUMER_KEY",
  "consumer_secret": "YOUR_CONSUMER_SECRET",
  "token": "YOUR_TOKEN",
  "token_secret": "YOUR_TOKEN_SECRET"
}
```

> Tambien puedes hacerlo desde la consola ejecutando: `$ touch ~/twitter_credentials2.json
echo '{\n  "consumer_key": "YOUR_CONSUMER_KEY",\n  "consumer_secret": "YOUR_CONSUMER_SECRET",\n  "token": "YOUR_TOKEN",\n  "token_secret": "YOUR_TOKEN_SECRET"\n}' >> ./config/twitter_credentials2.json`

E introduce los valores de una Twitter app (esta puedes crearla en [dev.twitter.com](https://developer.twitter.com/en/apps))

2. Edita el fichero `config/elections.json` a tu gusto. Esta es la configuración que viene por defecto:

```
{
 "words" : {
    "pp": [
      "PP",
      "pablocasado_",
      "Casado",
      "ppopular"
    ],
    "psoe": [
      "PSOE",
      "sanchezcastejon",
      "Sanchez"
    ],
    "podemos": [
      "Podemos",
      "pablo_iglesias_",
      "ahorapodemos"
    ],
    "ciudadanos": [
      "Ciudadanos",
      "Albert_Rivera",
      "Rivera",
      "ciudadanoscs"
    ],
    "vox": [
      "VOX",
      "santi_abascal",
      "Abascal",
      "vox_es"
    ]
  },
  "ws" : {
    "host" : "localhost",
    "port" : 8888,
    "protocol" : "ws"
  }
}
```

3. Edita a tu gusto en emmiter.js, la lista de **geocoders** . Por defecto están ["arcgis", "osm"]

> También puedes añadir nuevos geocodificacodes modificando el fichero **[src/external_geocoders.js](./src/external_geocoders.js)**: 

4. Abre un terminal nuevo y levanta un servidor de websockets que escuche en el puerto que has configurado en `config/elections.json`. Puedes usar [websocat](https://github.com/vi/websocat) para ello:

```bash
$ websocat -E -t ws-l:127.0.0.1:8888 broadcast:mirror:
```

5. Por último, para la iniciar el script tan sólo es necesario ejecutar desde la consola de comandos:

`$ node emitter.js "PP,PSOE,CIUDADANOS,PODEMOS,VOX"`

> Nota: <geocoder> puede contener el valor `name` de cualquiera de los geocodificadores de src/external_geocoders.js (nominatim, arcgis, arcgisGlobal)

Donde el segundo parámetro el un hashtag o varios separados por comas.

### Mejorar la precisión de la geocodificación

El fichero data/db.json contiene información de las geocodificaciones ya resueltas. Si se detecta que algún fallo importante se puede modificar manualmente el fichero db.json

Con este script podrás ver gráficamente el boundingbox de una geocodificación para decidir si cambiarlo:
https://jsbin.com/qaxujob/1/edit?html,output

Recuerda que además de cambiar el valor del boundingbox por el nuevo (más preciso) también debes cambiar los valores:

```js
"match": "Spain", <- la ubicación con la que ha matcheado
"geocoder": "OSM" <- el geocodificador que hayas usado
```

> Nota: <geocoder> puede contener el valor `name` de cualquiera de los geocodificadores de src/external_geocoders.js (nominatim, arcgis, arcgisGlobal)``
> Nota: <geocoder> puede contener el valor `name` de cualquiera de los geocodificadores de src/external_geocoders.js (nominatim, arcgis, arcgisGlobal)

### Diagrama de flujo del procesamiento de los tweets

En el siguiente diagrama se puede ver a alto nivel las operaciones que se realizan sobre el tweet recibido a través de la API de twitter:

[![Diagrama de flujo](https://docs.google.com/drawings/d/e/2PACX-1vTm4RvhbdJol9tKFsEqBtbiFIsOjj575oXfr_6HggoEagFm9v_fg7rCgCxTfJ-Nus9xNn2GnEBOuQoz/pub?w=1827&amp;h=1192)](https://docs.google.com/drawings/d/1Ikdc49YkkhfPYaFTdr-quEHEP61rnx_duuDppsEfjZU/edit?usp=sharing)

La salida final es algo como lo siguiente:

```js
{
  "geometry": {
    "x": -424528.17139626783,
    "y": 4907035.506488578,
    "spatialReference": {
      "wkid": 102100,
      "latestWkid": 3857
    }
  },
  "attributes": {
    "username": "J.R.",
    "screename": "JOANROIG1",
    "text": "RT @AlbanoDante76: Crec que Podemos pagarà molt car haver comprat que el PSOE era \"de izquierdas\". Segueix sent un partit neoliberal, monàr…",
    "profile_image_url_https": "https://pbs.twimg.com/profile_images/1617475574/imagesCA49VD2Z_normal.jpg",
    "geo": null,
    "location": "Europa",
    "created_at": "2019-07-23T14:22:24.000Z",
    "id_str": "1153641511956955137",
    "reply_count": 0,
    "retweet_count": 0,
    "favorite_count": 0,
    "tweet_url": "https://twitter.com/AlbanoDante76/status/1153353006873763840",
    "is_rt": true,
    "lat": 40.28219691934705,
    "lon": -3.8136014490457923,
    "admin_level": 15,
    "geocoder": "osm",
    "match": "Europa, Cerro - El Molino, Fuenlabrada, Área metropolitana de Madrid y Corredor del Henares, Comunidad de Madrid, 28943, España",
    "match_coords": {
      "lon": "-3.8050105",
      "lat": "40.2862646"
    },
    "boundingbox": {
      "xmin": -3.8250105,
      "ymin": 40.2662646,
      "xmax": -3.7850105,
      "ymax": 40.3062646
    },
    "ccaa": {
      "OBJECTID": 13,
      "Nombre": "Comunidad de Madrid",
      "cod_CCAA": "13"
    },
    "pp": false,
    "psoe": true,
    "podemos": false,
    "ciudadanos": false,
    "vox": false,
    "markWords": [
      "PSOE"
    ],
    "FltId": "1153641511956955137"
  }
}
```
