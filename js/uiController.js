import map from './map.js';

// DOM elements used in the UI
const DOMstrings = {
    routeLabels: '.route__labels',
    routeValues: '.route__values',
    routeHr: '#route__hr',
    modeLabels: '.mode__labels',
    modeValues: '.mode__values',
    timeLabels: '.time__labels',
    timeValues: '.time__values',
    santaStatus: '.santaStatus',
    santaVillage: '.santaVillage',
    giftsCount: '.giftsCount',
    scratcherValues: '.scratcher-values',
    scratcherList: '.scratcher-list',
    headerTime: '#header-item1',
    headerLoc: '#header-item2',
    status: '.status',
    photosList: '.photos__list',
    photoCity: '.photos__location',
    media: '.media',
    mediaLabels: '.media__labels',
    mediaCTA: '.media__cta',
    countdownContainer: '.countdown-container',
    countdownDays: '#countdown__days',
    countdownHours: '#countdown__hours',
    countdownMinutes: '#countdown__minutes',
    countdownSeconds: '#countdown__seconds',
};

let bounce = false; //animating the santa up and down

const countDown = (endDate, domString, pointsAlongRoute, santaLocation, animateSanta) => {

    let santaAutoTrack = true;
    //if it's counting down the time at a pitstop
    if (domString === 'timeValues') {
        if (pointsAlongRoute.length === 0) {
            bounce = true;
            animateSanta(santaLocation.currMarker, 
                        santaLocation.currLat, 
                        santaLocation.currLng, 
                        santaLocation.previousLatitude, 
                        santaLocation.previousLongitude);
        } else {
            map.on('dragstart', function () {
                santaAutoTrack = false;
            });
        }
    }

    return new Promise((resolve, reject) => {
        let countDownDate = new Date(endDate);
        const x = setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            if (domString === 'routeValues' && distance <= 0) {
                resolve('done');
                clearInterval(x);
            }

            //if it's counting down the time when it's airborne
            if (domString === 'timeValues' && pointsAlongRoute.length !== 0) {
                bounce = false;
                const lastPointIndex = pointsAlongRoute.length - 1 - Math.floor(Math.abs(distance) / 1000);
                animateSanta(santaLocation.currMarker, pointsAlongRoute[lastPointIndex]['lat'], pointsAlongRoute[lastPointIndex]['lng'], santaLocation.previousLatitude, santaLocation.previousLongitude, santaAutoTrack);
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);

            minutes = (minutes < 10 ? '0' : '') + minutes;
            seconds = (seconds < 10 ? '0' : '') + seconds;

            if (domString == 'timeValues') {
                if (hours < 1) {
                    document.querySelector(DOMstrings.timeValues).innerHTML = `${minutes}:${seconds}`;
                } else {
                    document.querySelector(DOMstrings.timeValues).innerHTML = `${hours}:${minutes}:${seconds}`;
                }
            } else if (domString == 'routeValues') {
                //Preflight mode
                document.querySelector(DOMstrings.countdownDays).innerHTML = days.toString().padStart(2, '0');
                document.querySelector(DOMstrings.countdownHours).innerHTML = hours.toString().padStart(2, '0');
                document.querySelector(DOMstrings.countdownMinutes).innerHTML = minutes.toString().padStart(2, '0');
                document.querySelector(DOMstrings.countdownSeconds).innerHTML = seconds.toString().padStart(2, '0');
            }

            if (distance <= 0) {
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


class UiController {

    /**
     * Update the route dashboard with the current location and time. Waits for the countdown timer to finish 
     * @param  {object} santaPos         Object that contains santa's information (location, mode, time, etc.)
     * @param  {Array} pointsAlongRoute Array of equidistant points along the route
     * @param {Object} santaLocation    Object that contains santa's marker (currMarker), (currLat), (currLng), where santa departed from (previousLatitude), (previousLongitude)
     */
    async updateRoute(santaPos, pointsAlongRoute, santaLocation) {
        document.querySelector(DOMstrings.headerLoc).innerHTML = `${santaPos.prevLocation}, ${santaPos.region}`;

        if (santaPos.currMode == 'Airborne') {
            document.querySelector(DOMstrings.routeLabels).innerHTML = 'Santa Will Arrive In...';
            document.querySelector(DOMstrings.modeLabels).innerHTML = 'Heading To';
            document.querySelector(DOMstrings.modeValues).innerHTML = santaPos.nextLocation;
            document.querySelector(DOMstrings.timeLabels).innerHTML = 'Arriving In';
            await countDown(santaPos.timeNext, 'timeValues', pointsAlongRoute, santaLocation, this.animateSanta);
            return;
        } else if (santaPos.currMode == 'Pitstop') {
            document.querySelector(DOMstrings.routeLabels).innerHTML = 'Santa Will Arrive In...';
            document.querySelector(DOMstrings.modeLabels).innerHTML = 'Current Stop';
            document.querySelector(DOMstrings.modeValues).innerHTML = santaPos.prevLocation;
            document.querySelector(DOMstrings.timeLabels).innerHTML = 'Departing In';
            document.querySelector(DOMstrings.timeValues).innerHTML = 'No Data';
            await countDown(santaPos.timeNext, 'timeValues', [], santaLocation, this.animateSanta);
            return;
        } else if (santaPos.currMode == 'Preflight') {
            document.querySelector(DOMstrings.countdownContainer).style.display = 'block';
            document.querySelector(DOMstrings.routeLabels).style.display = 'none';
            document.querySelector(DOMstrings.routeValues).style.display = 'none';
            document.querySelector(DOMstrings.routeHr).style.display = 'none';

            document.querySelector(DOMstrings.modeLabels).innerHTML = 'Home';
            document.querySelector(DOMstrings.modeValues).innerHTML = santaPos.prevLocation;
            document.querySelector(DOMstrings.timeLabels).innerHTML = 'Departing';
            document.querySelector(DOMstrings.timeValues).innerHTML = 'Rudolph\'s Runway';
            await countDown(santaPos.timeNext, 'routeValues', [], santaLocation, this.animateSanta);

            document.querySelector(DOMstrings.countdownContainer).style.display = 'none';
            document.querySelector(DOMstrings.routeLabels).style.display = 'block';
            document.querySelector(DOMstrings.routeValues).style.display = 'block';
            document.querySelector(DOMstrings.routeHr).style.display = 'block';
        }
    }

    updateStatus(santaPos) {
        if (santaPos.currMode == 'Airborne') {
            try {
                document.querySelector(DOMstrings.santaStatus).classList.add('santa_sleigh');
                document.querySelector(DOMstrings.santaStatus).classList.remove('santa_gifts');
            } catch (error) { }
        } else if (santaPos.currMode == 'Pitstop') {
            try {
                document.querySelector(DOMstrings.santaStatus).classList.add('santa_gifts');
                document.querySelector(DOMstrings.santaStatus).classList.remove('santa_sleigh');
            } catch (error) { }
        }
    }

    updatePhotos(santaPos) {
        const photosList = document.querySelector(DOMstrings.photosList);
        const photoCity = document.querySelector(DOMstrings.photoCity);
    
        // Clear out all the previous photos
        photosList.innerHTML = '';
    
        // Add a maximum of 4 photo cards to the HTML
        for (let index = 0; index < Math.min(santaPos.photos.length, 4); index++) {
            const newLi = document.createElement('li');
            newLi.className = 'photos__card';
            photosList.appendChild(newLi);
        }
    
        // Change the image of the photo cards
        const photoCards = photosList.childNodes;
        for (let i = 0; i < photoCards.length; i++) {
            if (photoCards[i].nodeName.toLowerCase() === 'li') {
                photoCards[i].style.backgroundImage = `url(${santaPos.photos[i]})`;
            }
        }
    
        // Write the location of the photos
        const location = (santaPos.currMode === 'Pitstop') ? santaPos.prevLocation : santaPos.nextLocation;
        photoCity.innerHTML = location;
    }
    

    updateMedia() {
        setInterval(() => {
            //ID of the Scratch Projects
            let animations = [273343061, 462774091, 466337394, 89025005, 459737643, 461648228, 462911474, 226034200, 223108087, 222533289, 219473703, 211310654, 217423939, 227657131, 212304322, 213506011, 208710981, 222655860, 92500368, 274070991, 190011244, 269060133, 355074630, 41206644, 467357045];
            let games = [137651951, 86359934, 192335511, 268933200, 265577662, 90914721, 272045498, 779552593, 349373793, 272953349, 193803200, 604421910, 620253799, 190350611, 611541710, 481290805, 38403214, 447015016, 191573221, 596470087, 15075951, 456024949, 306432816, 461334001, 452209527, 269148884, 621337245, 190343215, 355747998, 37523030, 2998709, 273304778, 608139762, 574870481, 765399719];

            //Seed the random number generator using the current UTC minute, so everyone generates the same random project
            Math.seedrandom(new Date().getUTCHours + new Date().getUTCMinutes()); //hours + minutes so it has more combinations

            let projectId;
            if (new Date().getUTCMinutes() % 2 == 0) { //If the minute is even, then pick a game
                projectId = games[Math.floor(Math.random() * games.length)];
                document.querySelector(DOMstrings.mediaLabels).innerHTML = '• Play Christmas Game';
                document.querySelector(DOMstrings.mediaCTA).innerHTML = 'sports_esports';
            } else { //else pick an animation
                projectId = animations[Math.floor(Math.random() * animations.length)];
                document.querySelector(DOMstrings.mediaLabels).innerHTML = '• Watch Christmas Animation';
                document.querySelector(DOMstrings.mediaCTA).innerHTML = 'play_arrow';
            }

            document.querySelector(DOMstrings.media).style.backgroundImage = `radial-gradient(circle, transparent, rgba(0, 0, 0, 0.3)), url(https://cdn2.scratch.mit.edu/get_image/project/${projectId}_480x360.png)`;
            document.querySelector(DOMstrings.mediaCTA).parentElement.setAttribute('href', `https://scratch.mit.edu/projects/${projectId}/fullscreen/`);
        }, 1000);
    }

    updateTime() {
        setInterval(() => {
            const time = new Date();
            let hour = time.getHours();
            hour = (hour > 12) ? (hour - 12) : (hour === 0 ? 12 : hour);
            const minute = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
            const timeOfDay = hour < 12 ? 'AM' : 'PM';

            document.querySelector(DOMstrings.headerTime).innerHTML = `${hour}:${minute} ${timeOfDay}`;
        }, 1000);
    }
    

    async updateTakeOffTime(takeoffTime) {
        document.querySelector(DOMstrings.routeLabels).innerHTML = 'Santa Takes Off In...';
        await countDown(takeoffTime, 'routeValues');
    }

    async updateArrTime(arrTime) {
        await countDown(arrTime, 'routeValues');
        document.querySelector(DOMstrings.routeValues).innerHTML = 'Arrived';
    }

    updateGiftsCount(timeNext, presentsDelivered, currAmtGifts) {
        let giftsAdded = Math.round((presentsDelivered - currAmtGifts) / ((timeNext - new Date().getTime()) / 2000));
        let total = currAmtGifts + giftsAdded;
        document.querySelector(
            DOMstrings.giftsCount
        ).innerHTML = `<span class="material-icons">redeem</span><h1>${total.toLocaleString('en-US')}</h1>`; // separate thousands with commas
        return total;
    }

    createSantaVillage() {
        console.log('creating santa village');
        document.querySelector(DOMstrings.santaVillage).classList.add('santa_village');
    }

    animateSanta = (santaMarker, currLat, currLng, previousLatitude, previousLongitude, santaAutoTrack) => {
        if (bounce) {
            let currRouteData;
            if (!map.getLayer('currRoute')) {
                currRouteData = {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: '',
                            geometry: {
                                type: 'LineString',
                                coordinates: [[currLng, currLat], [previousLongitude, previousLatitude]],
                            },
                        },
                    ],
                };

                map.addSource('currRouteSource', { type: 'geojson', data: currRouteData });

                map.addLayer({
                    id: 'currRoute',
                    type: 'line',
                    source: 'currRouteSource',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#39AA59',
                        'line-width': 2,
                    },
                });
            }

            requestAnimationFrame((timestamp) => {
                let radius = 1;
                santaMarker.setLngLat([currLng, Math.sin(timestamp / 500) * (radius / map.getZoom()) + currLat]);
                if (bounce == true) { //stop animating up and down when it's airborne (bounce set to false)
                    this.animateSanta(santaMarker, currLat, currLng);
                }
            });
        } else {
            if (currLat != undefined && currLng != undefined) {
                santaMarker.setLngLat([currLng, currLat]);

                let currRouteData;

                if (!map.getLayer('currRoute')) {
                    currRouteData = {
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                properties: '',
                                geometry: {
                                    type: 'LineString',
                                    coordinates: [[currLng, currLat], [previousLongitude, previousLatitude]],
                                },
                            },
                        ],
                    };

                    map.addSource('currRouteSource', { type: 'geojson', data: currRouteData });

                    map.addLayer({
                        id: 'currRoute',
                        type: 'line',
                        source: 'currRouteSource',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round',
                        },
                        paint: {
                            'line-color': '#39AA59',
                            'line-width': 2,
                        },
                    });
                } else {
                    map.getSource('currRouteSource').setData({
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                properties: '',
                                geometry: {
                                    type: 'LineString',
                                    coordinates: [[currLng, currLat], [previousLongitude, previousLatitude]],
                                },
                            },
                        ]
                    });
                    if (santaAutoTrack) {
                        map.panTo([currLng, currLat])
                    }
                }
            }
        }
    }
}

export default UiController;
