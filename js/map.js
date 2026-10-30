'use strict';

if (places.length) {
  const geoFeatures = places.map((place) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [place.lng, place.lat]
    },
    properties: {
      count: place.count
    }
  }));

  const map = new maplibregl.Map({
    container: 'geo-map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [10.13, 45.42],
    zoom: 9.5,
    attributionControl: true
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
  map.on('load', () => {
    map.addSource('bet-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geoFeatures
      }
    });

    map.addLayer({
      id: 'bet-density',
      type: 'heatmap',
      source: 'bet-points',
      maxzoom: 14,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'count'], 1, 0.65, 4, 1.8],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1.05, 10, 1.35, 12, 1.7],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 42, 10, 56, 12, 72],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(39, 50, 160, 0)',
          0.04, 'rgba(56, 35, 168, 0.12)',
          0.12, 'rgba(56, 35, 168, 0.28)',
          0.24, '#7b2cbf',
          0.4, '#b72abb',
          0.56, '#e238a6',
          0.7, '#f06a3b',
          0.84, '#f4c542',
          1, '#fff06a'
        ],
        'heatmap-opacity': 0.72
      }
    });

    map.addLayer({
      id: 'bet-locations',
      type: 'circle',
      source: 'bet-points',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 2, 4, 3],
        'circle-color': '#fff06a',
        'circle-opacity': 0.75,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1
      }
    });

    const bounds = new maplibregl.LngLatBounds();
    places.forEach((place) => bounds.extend([place.lng, place.lat]));
    map.fitBounds(bounds, { padding: 55, maxZoom: 10.7, duration: 0 });
  });
} else {
  document.getElementById('geo-map').textContent = 'Nessuna coordinata disponibile.';
}
