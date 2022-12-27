mapboxgl.accessToken = 'pk.eyJ1Ijoia2hhaWhlcm4iLCJhIjoiY2t4ajczaTVtMnBoazJva3k4cTMxZDQ0MCJ9.C4RBRggFv5Bv3Eq3XJmvgg';
let map = new mapboxgl.Map({
  container: 'map',
  //style: 'mapbox://styles/khaihern/ckxjzd7zc0qar14o1a3ubj1i4',
  //style: 'mapbox://styles/khaihern/clbzp8ri6001o15peogfztip7', //prod
  //style: 'mapbox://styles/khaihern/clc2sozid002q15qibgox0lp4/draft',
  style: 'mapbox://styles/khaihern/clc2sozid002q15qibgox0lp4',
  center: [40.346, 33.428],
  zoom: 2
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl(), 'top-left'); // add zoom and rotation controls to the map (top-left corner)
map.dragRotate.disable(); // disable map rotation using right click + drag
map.touchZoomRotate.disableRotation(); // disable map rotation using touch rotation gesture

export default map;