import map from './map.js';

let currTime, santaPos, trackerData, routeData, daysAdding;
let prevMarker, currMarker, prevLat, prevLng, currLat, currLng;
let locationResponse, locationData;

let villageLocation = {"lat": 84, "lng": 168};

let currDate = new Date(1766570400000); //Set this date to Christams Eve, currently Dec 24th 2025 5:00:00 AM EST
daysAdding = Math.floor(new Date(currDate.getTime() - new Date(1577181600000).getTime()) / (1000 * 3600 * 24)); // number of days from dec 24th 2019 (original date from API) to upcoming Christmas Eve

/**
 * Calculates the absolute difference between two times in seconds.
 * @param {Date} time1 - The first time.
 * @param {Date} time2 - The second time.
 * @returns {number} The absolute difference in seconds.
 */
const calcTimeDiff = (time1, time2) => {
    const diff = Math.abs(time1 - time2);
    return Math.floor(diff / 1000);
};

/**
 * Adds a specified number of days to a date.
 * @param {Date} date - The original date.
 * @param {number} days - The number of days to add.
 * @returns {Date} The new date.
 */
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// The current position of Santa
santaPos = {
    prevLocation: '',
    nextLocation: '',
    region: '',
    currMode: '',
    timeNext: '',
    orderID: null,
    presentsDelivered: 0,
    photos: [],
};

const updateSantaPos = (prevLocation, nextLocation, region, currMode, timeNext, orderID, presentsDelivered, photos) => {
    santaPos.prevLocation = prevLocation;
    santaPos.nextLocation = nextLocation;
    santaPos.region = region;
    santaPos.currMode = currMode;
    santaPos.timeNext = timeNext;
    santaPos.orderID = orderID;
    santaPos.presentsDelivered = presentsDelivered;
    santaPos.photos = photos;
};

const plotCoords = async (index) => {
    let lat = routeData[index]['location']['lat'],
        lng = routeData[index]['location']['lng'],
        city = routeData[index > 0 ? (index -= 1) : (index = 0)]['city'],
        region = routeData[index]['region'],
        photoUrl = routeData?.[index]?.['details']?.['photos']?.[0]?.['url'];

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
                    properties: {
                        'marker-size': 'small'
                    }
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
        zoom: 5,
        essential: true,
    });

    if (prevLat !== undefined) {
        let desc = locationData[index]['extract'];
        //let scratchUsers = locationData[index]['scratchUsers'];

        // function to shorten a string to 3 lines
        function truncate(str, n, useWordBoundary) {
            if (str.length <= n) {
                return str;
            }
            const subString = str.substr(0, n - 1); // the original check
            return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' ')) : subString) + '&hellip;';
        }

        // const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnMove: true }).setHTML(
        //     `<div class="locationPopup__photo" style="background-image: url(${photoUrl});"></div><div class="locationPopup__content"><h2 class="locationPopup__name">${city}, ${region}</h2><h3 class="locationPopup__desc">${truncate(
        //         desc,
        //         120,
        //         true
        //     )}</h3><h2 class="locationPopup__usersLabel">Scratchers in the Region:</h2><div class="locationPopup__users">
        //   <a href="https://scratch.mit.edu/users/${scratchUsers[0]['username']}" target="_blank"><img title="${scratchUsers[0]['username']}" class="locationPopup__user" src="${scratchUsers[0].profileIcon}" alt="${scratchUsers[0]['username']}"></a>
        //   <a href="https://scratch.mit.edu/users/${scratchUsers[1]['username']}" target="_blank"><img title="${scratchUsers[1]['username']}" class="locationPopup__user" src="${scratchUsers[1].profileIcon}" alt="${scratchUsers[1]['username']}"></a>
        //   <a href="https://scratch.mit.edu/users/${scratchUsers[2]['username']}" target="_blank"><img title="${scratchUsers[2]['username']}" class="locationPopup__user" src="${scratchUsers[2].profileIcon}" alt="${scratchUsers[2]['username']}"></a>
        //   <a href="https://scratch.mit.edu/users/${scratchUsers[3]['username']}" target="_blank"><img title="${scratchUsers[3]['username']}" class="locationPopup__user" src="${scratchUsers[3].profileIcon}" alt="${scratchUsers[3]['username']}"></a>
        //   <a href="https://scratch.mit.edu/users/${scratchUsers[4]['username']}" target="_blank"><img title="${scratchUsers[4]['username']}" class="locationPopup__user" src="${scratchUsers[4].profileIcon}" alt="${scratchUsers[4]['username']}"></a>
        // </div></div>`
        // );

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnMove: true }).setHTML(
            `<div class="locationPopup__photo" style="background-image: url(${photoUrl});"></div><div class="locationPopup__content"><h2 class="locationPopup__name">${city}, ${region}</h2><h3 class="locationPopup__desc">${truncate(
                desc,
                150,
                true
            )}</h3></div>`
        );

        prevMarker = new mapboxgl.Marker({ color: '#D85748', scale: 0.75, cursor: 'pointer' })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);
    }

    prevLat = lat;
    prevLng = lng;
};


class SantaController {
    async getRouteAPI() {
        const response = await fetch(
            'https://firebasestorage.googleapis.com/v0/b/santa-tracker-firebase.appspot.com/o/route%2Fsanta_en.json?alt=media'
        );
        trackerData = await response.json();
        routeData = trackerData.destinations;
        return routeData;
    }

    async getLocationData() {
        locationResponse = await fetch('./locationData.json');
        locationData = await locationResponse.json();
        return;
    }

    plotSantaVillage = () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [villageLocation['lng'], villageLocation['lat']],
                        properties: {
                            'marker-size': 'small'
                        }
                    },
                },
            ],
        };
    
        const markerElement = document.createElement('div');
        markerElement.className = 'santaVillage';
        markerElement.style.width = '100px';
        markerElement.style.height = '100px';

        new mapboxgl.Marker(markerElement)
            .setLngLat(geojson.features[0].geometry.coordinates)
            .addTo(map);

        if (santaPos.currMode == 'Preflight') {
            map.panTo([villageLocation['lng'], villageLocation['lat']])
        }
    };

    async getTakeoffTime() {
        return currDate;
    }

    async findArrTime() {
        let response, data, closestLocation, closestLocDistance;
        response = await fetch('https://ipapi.co/json/');
        data = await response.json();

        let lat = Number(data['latitude']);
        let lng = Number(data['longitude']);

        closestLocDistance = '';

        Number.prototype.toRad = function () {
            return (this * Math.PI) / 180;
        };

        for (let i = 1; i < routeData.length; i++) {
            let lat2 = routeData[i]['location']['lat'];
            let lon2 = routeData[i]['location']['lng'];
            let lat1 = lat;
            let lon1 = lng;

            const R = 6371; // km
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

        let addArrival = addDays(routeData[closestLocation]['arrival'], daysAdding);
        return addArrival;
    }

    getSantaPos() {
        let addArrival, addDeparture;

        let currTime = new Date().toUTCString();
        addDeparture = addDays(new Date(routeData[0]['departure']), daysAdding);

        let photos = [];

        // check if santa departed
        if (Date.parse(currTime) < Date.parse(addDeparture)) {
            let timeToTakeoff = calcTimeDiff(Date.parse(currTime), Date.parse(addDeparture));
            //console.log(`Santa has not take off yet! Santa will takeoff in ${timeToTakeoff} seconds`);

            //Grab photos
            photos = [];
            routeData[0]['details']['photos'].forEach((el) => {
                photos.push(el['url']);
            });

            updateSantaPos(
                routeData[0]['city'],
                routeData[0]['city'],
                routeData[0]['region'],
                'Preflight',
                Date.parse(addDeparture),
                0,
                routeData[0]['presentsDelivered'],
                photos,
            );
            return santaPos;
        }
        plotCoords(0);

        for (let i = 1; i < routeData.length; i++) {
            addArrival = addDays(new Date(routeData[i]['arrival']), daysAdding);
            addDeparture = addDays(new Date(routeData[i]['departure']), daysAdding);
            if (Date.parse(currTime) < Date.parse(addArrival)) {
                //console.log(`Santa has left ${routeData[i-1]['city']} and heading to ${routeData[i]['city']}`);

                //Grab photos
                photos = [];
                routeData[i]['details']['photos'].forEach((el) => {
                    photos.push(el['url']);
                });

                updateSantaPos(
                    routeData[i - 1]['city'],
                    routeData[i]['city'],
                    routeData[i - 1]['region'],
                    'Airborne',
                    Date.parse(addArrival),
                    i,
                    routeData[i - 1]['presentsDelivered'],
                    photos
                );
                plotCoords(i);
                //setViewBox(routeData[i]['location']['lat'], routeData[i]['location']['lng']);
                return santaPos;
            } else if ((Date.parse(currTime) < Date.parse(addDeparture)) && i < routeData.length - 1) {
                //console.log(`Santa is currently at ${routeData[i]['city']} delivering presents`);

                //Grab photos
                photos = [];
                routeData[i]['details']['photos'].forEach((el) => {
                    photos.push(el['url']);
                });

                updateSantaPos(
                    routeData[i]['city'],
                    routeData[i + 1]['city'],
                    routeData[i]['region'],
                    'Pitstop',
                    Date.parse(addDeparture),
                    i,
                    routeData[i]['presentsDelivered'],
                    photos
                );
                // setViewBox(routeData[i]['location']['lat'], routeData[i]['location']['lng']);
                return santaPos;
            }
            if (i < routeData.length - 1) {
                plotCoords(i + 1);
            } else {
                updateSantaPos(
                    routeData[0]['city'],
                    routeData[0]['city'],
                    routeData[0]['region'],
                    'Landing',
                    Date.parse(addDeparture),
                    i + 1,
                    routeData[i]['presentsDelivered'],
                    photos,
                )
            }
        }
    }

    /**
     * Updates the santaPos object with the new values
     */
    getNextPos() {
        let addArrival, addDeparture, photos = [];
        if (santaPos.currMode == 'Airborne') {
            plotCoords(santaPos.orderID);
            addDeparture = addDays(new Date(routeData[santaPos.orderID]['departure']), daysAdding);

            //Grab photos
            routeData[santaPos.orderID]['details']['photos'].forEach((el) => {
                photos.push(el['url']);
            });

            updateSantaPos(
                santaPos.nextLocation,
                routeData[santaPos.orderID + 1]['city'],
                routeData[santaPos.orderID]['region'],
                'Pitstop',
                Date.parse(addDeparture),
                santaPos.orderID,
                routeData[santaPos.orderID]['presentsDelivered'],
                photos
            );
        } else if (santaPos.currMode == 'Pitstop') {
            plotCoords(santaPos.orderID);
            addArrival = addDays(new Date(routeData[santaPos.orderID + 1]['arrival']), daysAdding);

            //Grab photos
            routeData[santaPos.orderID + 1]['details']['photos'].forEach((el) => {
                photos.push(el['url']);
            });

            updateSantaPos(
                santaPos.prevLocation,
                routeData[santaPos.orderID + 1]['city'],
                routeData[santaPos.orderID]['region'],
                'Airborne',
                Date.parse(addArrival),
                santaPos.orderID + 1,
                routeData[santaPos.orderID + 1]['presentsDelivered'],
                photos
            );
        }
    }

    getSantaMarker() {
        let data = routeData[santaPos.orderID - 1];

        return {
            currMarker,
            currLat,
            currLng,
            previousLatitude: data?.location?.lat,
            previousLongitude: data?.location?.lng,
        };
    }

    drawRecentRoute(orderID) {
        let coordinates = [];
        let coordinatePair = [];

        const limit = orderID < 20 ? orderID : 20;

        for (let i = 0; i < limit; i++) {
            let lat = routeData[orderID - 1 - i]['location']['lat']
            let lng = routeData[orderID - 1 - i]['location']['lng']
            if (orderID - 1 - i != 0) {
                let prevLng = routeData[orderID - 1 - i - 1]['location']['lng']
                lng += lng - prevLng > 180 ? -360 : 
                    prevLng - lng > 180 ? 360 : 0;
            }

            coordinatePair = orderID - 1 - i == 0 ? [villageLocation.lng, villageLocation.lat] : [lng, lat];
            coordinates.push(coordinatePair);
        }
        console.log(coordinates);

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
    }

    /**
     * Split the route into segments by creating a new point every second along the route
    */
    getEquidistantCoordinates() {
        // Convert numeric degrees to radians
        Number.prototype.toRad = function () {
            return this * Math.PI / 180;
        }

        // Convert radians to numeric degrees
        Number.prototype.toDeg = function () {
            return this * 180 / Math.PI;
        }

        // n is the number of points created for every second
        const n = Math.abs((new Date(santaPos.timeNext).getTime() - addDays(routeData[santaPos.orderID - 1]['departure'], daysAdding)) / 1000);

        const startCoords = santaPos.orderID == 1 ? villageLocation : routeData[santaPos.orderID - 1]['location'];
        let endCoords = routeData[santaPos.orderID]['location'];
        
        endCoords.lng += endCoords.lng - startCoords.lng > 180 ? -360 : 
            startCoords.lng - endCoords.lng > 180 ? 360 : 0;

        const points = [];
        const R = 6371; // radius of Earth in kilometers
        const dLat = endCoords.lat - startCoords.lat;
        const dLon = endCoords.lng - startCoords.lng;

        console.log("start coords:  lat: " + startCoords.lat + " lng: " + startCoords.lng)
        console.log("end coords:  lat: " + endCoords.lat + " lng: " + endCoords.lng)
        console.log(dLat);
        console.log(dLon)

        for (let i = 0; i <= n; i++) {
            const fraction = i / n;
            const lat3 = startCoords.lat + fraction * dLat;
            const lon3 = startCoords.lng + fraction * dLon;
            points.push({
                lat: lat3,
                lng: lon3
            });
        }

        console.log(points);
        return points;
    }
}

export default SantaController;
