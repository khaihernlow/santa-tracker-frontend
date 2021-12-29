const santaController = (() => {
  let currTime, santaPos, trackerData, routeData, daysAdding;
  let prevMarker, currMarker, prevLat, prevLng, currLat, currLng;
  let locationResponse, locationData;

  let currDate = new Date();
  daysAdding = Math.floor(new Date(currDate.getTime() - new Date(1577181600000).getTime()) / (1000 * 3600 * 24)); // number of days from dec 24th 2019 to today

  // calculate differences between two time
  const calcTimeDiff = (time1, time2) => {
    let diff = time1 - time2;
    diff = Math.abs(diff);
    diff = Math.floor(diff / 1000);
    return diff;
  };

  // create a function that add number of days to a date
  const addDays = (date, days) => {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  santaPos = {
    prevLocation: '',
    nextLocation: '',
    region: '',
    currMode: '',
    timeNext: '',
    orderID: null,
    presentsDelivered: 0,
  };

  const updateSantaPos = (prevLocation, nextLocation, region, currMode, timeNext, orderID, presentsDelivered) => {
    santaPos.prevLocation = prevLocation;
    santaPos.nextLocation = nextLocation;
    santaPos.region = region;
    santaPos.currMode = currMode;
    santaPos.timeNext = timeNext;
    santaPos.orderID = orderID;
    santaPos.presentsDelivered = presentsDelivered;
  };

  const plotCoords = async (index) => {
    let lat = routeData[index]['location']['lat'],
      lng = routeData[index]['location']['lng'],
      city = routeData[index > 0 ? (index -= 1) : (index = 0)]['city'],
      region = routeData[index]['region'],
      photoUrl = routeData?.[index]?.['details']?.['photos']?.[0]?.['url'];

    // if (prevLat !== undefined) {
    //   map.removeLayer(currMarker);
    // }
    // currMarker = L.marker([lat, lng], { riseOnHover: true, icon: santaIcon, zIndexOffset: 1000 }).addTo(map);
    if (prevLat !== undefined) {
      currLat = lat;
      currLng = lng;
      currMarker.remove();
    }

    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        },
      ],
    };

    const el = document.createElement('div');
    el.className = 'santaStatus';
    el.style.width = `100px`;
    el.style.height = `100px`;
    currMarker = new mapboxgl.Marker(el).setLngLat(geojson.features[0].geometry.coordinates).addTo(map);

    const giftsCount = document.createElement('div');
    giftsCount.className = 'giftsCount';
    giftsCount.innerHTML = '<span class="material-icons">redeem</span><h1></h1>';
    document.querySelector('.santaStatus').appendChild(giftsCount);

    map.flyTo({
      center: [lng, lat],
      zoom: 4,
      essential: true,
    });

    if (prevLat !== undefined) {
      let desc = locationData[index]['extract'];
      let scratchUsers = locationData[index]['scratchUsers'];
      // console.log(scratchUsers);

      // function to shorten a string to 3 lines
      function truncate(str, n, useWordBoundary) {
        if (str.length <= n) {
          return str;
        }
        const subString = str.substr(0, n - 1); // the original check
        return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' ')) : subString) + '&hellip;';
      }

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnMove: true }).setHTML(
        `<div class="locationPopup__photo" style="background-image: url(${photoUrl});"></div><div class="locationPopup__content"><h2 class="locationPopup__name">${city}, ${region}</h2><h3 class="locationPopup__desc">${truncate(
          desc,
          120,
          true
        )}</h3><h2 class="locationPopup__usersLabel">Scratchers in the Region:</h2><div class="locationPopup__users">
          <a href="https://scratch.mit.edu/users/${scratchUsers[0]['username']}" target="_blank"><img title="${scratchUsers[0]['username']}" class="locationPopup__user" src="${scratchUsers[0].profileIcon}" alt="${scratchUsers[0]['username']}"></a>
          <a href="https://scratch.mit.edu/users/${scratchUsers[1]['username']}" target="_blank"><img title="${scratchUsers[1]['username']}" class="locationPopup__user" src="${scratchUsers[1].profileIcon}" alt="${scratchUsers[1]['username']}"></a>
          <a href="https://scratch.mit.edu/users/${scratchUsers[2]['username']}" target="_blank"><img title="${scratchUsers[2]['username']}" class="locationPopup__user" src="${scratchUsers[2].profileIcon}" alt="${scratchUsers[2]['username']}"></a>
          <a href="https://scratch.mit.edu/users/${scratchUsers[3]['username']}" target="_blank"><img title="${scratchUsers[3]['username']}" class="locationPopup__user" src="${scratchUsers[3].profileIcon}" alt="${scratchUsers[3]['username']}"></a>
          <a href="https://scratch.mit.edu/users/${scratchUsers[4]['username']}" target="_blank"><img title="${scratchUsers[4]['username']}" class="locationPopup__user" src="${scratchUsers[4].profileIcon}" alt="${scratchUsers[4]['username']}"></a>
        </div></div>`
      );

      //prevMarker = L.marker([prevLat, prevLng], { riseOnHover: true, icon: regularIcon, zIndexOffset: 0 }).addTo(map);
      prevMarker = new mapboxgl.Marker({ color: '#D85748', scale: 0.75, cursor: 'pointer' })
        .setLngLat([routeData[index]['location']['lng'], routeData[index]['location']['lat']])
        .setPopup(popup)
        .addTo(map);
    }

    prevLat = lat;
    prevLng = lng;
  };

  return {
    getRouteAPI: async () => {
      const response = await fetch(
        'https://firebasestorage.googleapis.com/v0/b/santa-tracker-firebase.appspot.com/o/route%2Fsanta_en.json?alt=media'
      );
      trackerData = await response.json();
      routeData = trackerData.destinations;
      return routeData;
    },

    getLocationData: async () => {
      locationResponse = await fetch('./locationData.json');
      locationData = await locationResponse.json();
      return;
    },

    findArrTime: async () => {
      let response, closestLocation, closestLocDistance;
      response = await fetch('https://ipgeolocation.abstractapi.com/v1/?api_key=4b552c45f7c7415db90b58a7e20ee6c0');
      data = await response.json();

      lat = data['latitude'];
      lng = data['longitude'];
      //console.log(lat + ',' + lng)

      closestLocDistance = '';

      Number.prototype.toRad = function () {
        return (this * Math.PI) / 180;
      };

      for (i = 1; i < routeData.length; i++) {
        let lat2 = routeData[i]['location']['lat'];
        let lon2 = routeData[i]['location']['lng'];
        let lat1 = lat;
        let lon1 = lng;

        const R = 6371; // km
        //has a problem with the .toRad() method below.
        let x1 = lat2 - lat1;
        let dLat = x1.toRad();
        let x2 = lon2 - lon1;
        let dLon = x2.toRad();
        let a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;

        if (d < closestLocDistance || closestLocDistance === '') {
          closestLocation = i;
          closestLocDistance = d;
        }
      }

      var addArrival = addDays(routeData[closestLocation]['arrival'], daysAdding);
      return addArrival;
    },

    getSantaPos: () => {
      let addArrival, addDeparture;

      let currTime = new Date().toUTCString();
      addDeparture = addDays(new Date(routeData[0]['departure']), daysAdding);

      // check if santa departed
      if (Date.parse(currTime) < Date.parse(addDeparture)) {
        let timeToTakeoff = calcTimeDiff(Date.parse(currTime), Date.parse(addDeparture));
        //console.log(`Santa has not take off yet! Santa will takeoff in ${timeToTakeoff} minutes`);

        updateSantaPos(
          routeData[0]['city'],
          routeData[0]['city'],
          routeData[0]['region'],
          'Pitstop',
          Date.parse(addDeparture),
          0,
          routeData[0]['presentsDelivered']
        );
        return santaPos;
      }
      plotCoords(0);

      for (i = 1; i < routeData.length; i++) {
        addArrival = addDays(new Date(routeData[i]['arrival']), daysAdding);
        addDeparture = addDays(new Date(routeData[i]['departure']), daysAdding);
        if (Date.parse(currTime) < Date.parse(addArrival)) {
          //console.log(`Santa has left ${routeData[i-1]['city']} and heading to ${routeData[i]['city']}`);
          updateSantaPos(
            routeData[i - 1]['city'],
            routeData[i]['city'],
            routeData[i - 1]['region'],
            'Airborne',
            Date.parse(addArrival),
            i,
            routeData[i - 1]['presentsDelivered']
          );
          plotCoords(i);
          //setViewBox(routeData[i]['location']['lat'], routeData[i]['location']['lng']);
          return santaPos;
        } else if (Date.parse(currTime) < Date.parse(addDeparture)) {
          //console.log(`Santa is currently at ${routeData[i]['city']} delivering presents`);
          updateSantaPos(
            routeData[i]['city'],
            routeData[i + 1]['city'],
            routeData[i]['region'],
            'Pitstop',
            Date.parse(addDeparture),
            i,
            routeData[i]['presentsDelivered']
          );
          // setViewBox(routeData[i]['location']['lat'], routeData[i]['location']['lng']);
          return santaPos;
        }
        plotCoords(i);
        //if before arrival
        //return status
        //else if before departure
        //return status
      }
      //console.log(`${routeData[santaPos.orderID]['location']['lat']}, ${routeData[santaPos.orderID]['location']['lng']}`)
    },

    getNextPos: () => {
      let addArrival, addDeparture;
      if (santaPos.currMode == 'Airborne') {
        plotCoords(santaPos.orderID);
        addDeparture = addDays(new Date(routeData[santaPos.orderID]['departure']), daysAdding);

        updateSantaPos(
          santaPos.nextLocation,
          routeData[santaPos.orderID + 1]['city'],
          routeData[santaPos.orderID]['region'],
          'Pitstop',
          Date.parse(addDeparture),
          santaPos.orderID,
          routeData[santaPos.orderID]['presentsDelivered']
        );
      } else if (santaPos.currMode == 'Pitstop') {
        addArrival = addDays(new Date(routeData[santaPos.orderID + 1]['arrival']), daysAdding);

        updateSantaPos(
          santaPos.prevLocation,
          routeData[santaPos.orderID + 1]['city'],
          routeData[santaPos.orderID]['region'],
          'Airborne',
          Date.parse(addArrival),
          santaPos.orderID + 1,
          routeData[santaPos.orderID + 1]['presentsDelivered']
        );
      }
    },

    getSantaMarker: () => {
      return { currMarker, currLat, currLng };
    },

    drawRecentRoute: (orderID) => {
      let coordinates = [];
      let coordinatePair = [];

      for (i = 0; i < 20; i++) {
        coordinatePair = [routeData[orderID - i]['location']['lng'], routeData[orderID - i]['location']['lat']];
        coordinates.push(coordinatePair);
      }

      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: '',
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
          },
        ],
      };

      // function that create lighter shades of a color, written by copilot
      function shadeColor(color, percent) {
        let f = parseInt(color.slice(1), 16),
          t = percent < 0 ? 0 : 255,
          p = percent < 0 ? percent * -1 : percent,
          R = f >> 16,
          G = (f >> 8) & 0x00ff,
          B = f & 0x0000ff;
        return (
          '#' +
          (
            0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B)
          )
            .toString(16)
            .slice(1)
        );
      }

      if (map.getLayer('route')) {
        map.removeLayer('route');
        map.removeSource('route');
      }

      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          lineMetrics: true,
          data: geojson.features[0],
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#39AA59',
          'line-width': 2,
          'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#39AA59', 1, shadeColor('#39AA59', 0.75)],
        },
      });
    },
  };
})();

const uiController = (() => {
  const DOMstrings = {
    routeValues: '.route__values',
    modeLabels: '.mode__labels',
    modeValues: '.mode__values',
    timeLabels: '.time__labels',
    timeValues: '.time__values',
    santaStatus: '.santaStatus',
    giftsCount: '.giftsCount',
    scratcherValues: '.scratcher-values',
    scratcherList: '.scratcher-list',
    headerTime: '#header-item1',
    headerLoc: '#header-item2',
    status: '.status',
  };

  const countDown = (endDate, domString) => {
    return new Promise((resolve, reject) => {
      let countDownDate = new Date(endDate);
      let x = setInterval(() => {
        let now = new Date().getTime();

        if (domString == 'routeValues' && countDownDate.getTime() < now) {
          //console.log('over');
          resolve('done');
          clearInterval(x);
        }

        let distance = countDownDate - now;
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);
        //console.log(seconds)
        minutes = (minutes < 10 ? '0' : '') + minutes;
        seconds = (seconds < 10 ? '0' : '') + seconds;

        if (domString == 'timeValues') {
          if (hours < 1) {
            document.querySelector(DOMstrings.timeValues).innerHTML = `${minutes}:${seconds}`;
          } else {
            document.querySelector(DOMstrings.timeValues).innerHTML = `${hours}:${minutes}:${seconds}`;
          }
        } else if (domString == 'routeValues') {
          document.querySelector(DOMstrings.routeValues).innerHTML = `${hours} Hours ${minutes} Minutes`;
        }
        if (minutes < 1 && hours < 1 && domString == 'routeValues') {
          //console.log('over');
          resolve('done');
          clearInterval(x);
        }

        if (seconds < 1 && minutes < 1 && hours < 1) {
          //console.log('over');
          resolve('done');
          clearInterval(x);
        }
      }, 1000);
    });
  };

  const removeAllChildren = (parent) => {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  };

  return {
    updateRoute: async (santaPos) => {
      document.querySelector(DOMstrings.headerLoc).innerHTML = `${santaPos.prevLocation}, ${santaPos.region}`;

      if (santaPos.currMode == 'Airborne') {
        document.querySelector(DOMstrings.modeLabels).innerHTML = 'Heading To';
        document.querySelector(DOMstrings.modeValues).innerHTML = santaPos.nextLocation;
        document.querySelector(DOMstrings.timeLabels).innerHTML = 'Arriving In';
        await countDown(santaPos.timeNext, 'timeValues');
        //console.log('after');
        return;
      } else if (santaPos.currMode == 'Pitstop') {
        document.querySelector(DOMstrings.modeLabels).innerHTML = 'Current Stop';
        document.querySelector(DOMstrings.modeValues).innerHTML = santaPos.prevLocation;
        document.querySelector(DOMstrings.timeLabels).innerHTML = 'Departing In';
        document.querySelector(DOMstrings.timeValues).innerHTML = 'No Data';
        await countDown(santaPos.timeNext, 'timeValues');
        //console.log('after pitstop');
        return;
      }
    },

    updateStatus: (santaPos) => {
      if (santaPos.currMode == 'Airborne') {
        try {
          document.querySelector(DOMstrings.santaStatus).classList.add('santa_sleigh');
          document.querySelector(DOMstrings.santaStatus).classList.remove('santa_gifts');
        } catch (error) {}
      } else if (santaPos.currMode == 'Pitstop') {
        try {
          document.querySelector(DOMstrings.santaStatus).classList.add('santa_gifts');
          document.querySelector(DOMstrings.santaStatus).classList.remove('santa_sleigh');
        } catch (error) {}
      }
    },

    updateTime: () => {
      let x = setInterval(() => {
        let time, hour, minute, timeOfDay, timeString;
        time = new Date();
        hour = time.getHours();
        minute = time.getMinutes();
        minute = (minute < 10 ? '0' : '') + minute;
        timeOfDay = hour < 12 ? 'AM' : 'PM';
        hour = hour > 12 ? hour - 12 : hour;
        hour = hour == 0 ? 12 : hour;
        timeString = `${hour}:${minute} ${timeOfDay}`;
        document.querySelector(DOMstrings.headerTime).innerHTML = timeString;
      }, 1000);
    },

    updateArrTime: async (arrTime) => {
      await countDown(arrTime, 'routeValues');
      document.querySelector(DOMstrings.routeValues).innerHTML = 'Arrived';
    },

    updateGiftsCount: (timeNext, presentsDelivered, currAmtGifts) => {
      let giftsAdded = Math.round((presentsDelivered - currAmtGifts) / ((timeNext - new Date().getTime()) / 2000));
      let total = currAmtGifts + giftsAdded;
      document.querySelector(
        DOMstrings.giftsCount
      ).innerHTML = `<span class="material-icons">redeem</span><h1>${total.toLocaleString('en-US')}</h1>`; // separate thousands with commas
      return total;
    },

    animateSanta: (santaMarker, currLat, currLng) => {
      function animate(timestamp) {
        let radius = 2;
        santaMarker.setLngLat([currLng, Math.sin(timestamp / 500) * (radius / map.getZoom()) + currLat]);
        //santaMarker.addTo(map);
        requestAnimationFrame(() => {
          uiController.animateSanta(santaMarker, currLat, currLng);
        });
      }
      requestAnimationFrame(animate);
    },
  };
})();

const controller = (async (santaCtrl, uiCtrl) => {
  let routeData, santaPos, scratcherData, arrTime;
  let currAmtGifts = undefined;

  uiCtrl.updateTime();

  routeData = await santaCtrl.getRouteAPI(); // get route data from API
  await santaCtrl.getLocationData();
  console.log(routeData);
  santaCtrl.findArrTime().then((value) => {
    uiCtrl.updateArrTime(value);
  });

  santaPos = await santaCtrl.getSantaPos(); // get santa position
  uiCtrl.updateStatus(santaPos);
  santaCtrl.drawRecentRoute(santaPos.orderID);

  // setinterval function
  if (currAmtGifts == undefined) {
    currAmtGifts = santaPos.presentsDelivered;
  }
  setInterval(() => {
    currAmtGifts = uiCtrl.updateGiftsCount(santaPos.timeNext, santaPos.presentsDelivered, currAmtGifts);
  }, 2000);

  while (true) {
    santaLocation = santaCtrl.getSantaMarker();
    uiCtrl.animateSanta(santaLocation.currMarker, santaLocation.currLat, santaLocation.currLng);
    await uiCtrl.updateRoute(santaPos);
    await santaCtrl.getNextPos();
    uiCtrl.updateStatus(santaPos);
    santaCtrl.drawRecentRoute(santaPos.orderID);
  }
})(santaController, uiController);

mapboxgl.accessToken = 'pk.eyJ1Ijoia2hhaWhlcm4iLCJhIjoiY2t4ajczaTVtMnBoazJva3k4cTMxZDQ0MCJ9.C4RBRggFv5Bv3Eq3XJmvgg';
let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/khaihern/ckxjzd7zc0qar14o1a3ubj1i4',
  center: [40.346, 33.428],
  zoom: 2
});
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl(), 'top-left');
