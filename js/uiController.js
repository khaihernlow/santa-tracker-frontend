import map from './map.js';
import { countDown } from './countdown.js';
import { DOMstrings, updateElement, updateBackgroundImage, removeAllChildren } from './domUtils.js';

class UiController {
    constructor() {
        this.bounce = false; //animating the santa up and down
    }

    /**
     * Update the route dashboard with the current location and time. Waits for the countdown timer to finish 
     * @param  {object} santaPos         Object that contains santa's information (location, mode, time, etc.)
     * @param  {Array} pointsAlongRoute Array of equidistant points along the route
     * @param {Object} santaLocation    Object that contains santa's marker (currMarker), (currLat), (currLng), where santa departed from (previousLatitude), (previousLongitude)
     */
    async updateRoute(santaPos, pointsAlongRoute, santaLocation) {
        updateElement(DOMstrings.headerLoc, `${santaPos.prevLocation}, ${santaPos.region}`);

        if (santaPos.currMode === 'Airborne') {
            updateElement(DOMstrings.routeLabels, 'Santa Will Arrive In...');
            updateElement(DOMstrings.modeLabels, 'Heading To');
            updateElement(DOMstrings.modeValues, santaPos.nextLocation);
            updateElement(DOMstrings.timeLabels, 'Arriving In');

            await countDown(santaPos.timeNext, 'timeValues', pointsAlongRoute, santaLocation, this.animateSanta, true, this);
        } else if (santaPos.currMode === 'Pitstop') {
            updateElement(DOMstrings.routeLabels, 'Santa Will Arrive In...');
            updateElement(DOMstrings.modeLabels, 'Current Stop');
            updateElement(DOMstrings.modeValues, santaPos.prevLocation);
            updateElement(DOMstrings.timeLabels, 'Departing In');
            updateElement(DOMstrings.timeValues, 'No Data');
            
            await countDown(santaPos.timeNext, 'timeValues', [], santaLocation, this.animateSanta, false, this);
        } else if (santaPos.currMode === 'Preflight') {
            document.querySelector(DOMstrings.countdownContainer).style.display = 'block';
            document.querySelector(DOMstrings.routeLabels).style.display = 'none';
            document.querySelector(DOMstrings.routeValues).style.display = 'none';
            document.querySelector(DOMstrings.routeHr).style.display = 'none';

            updateElement(DOMstrings.modeLabels, 'Home');
            updateElement(DOMstrings.modeValues, santaPos.prevLocation);
            updateElement(DOMstrings.timeLabels, 'Departing');
            updateElement(DOMstrings.timeValues, 'Rudolph\'s Runway');

            await countDown(santaPos.timeNext, 'routeValues', [], santaLocation, this.animateSanta, false, this);
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
                updateElement(DOMstrings.mediaLabels, '• Play Christmas Game');
                updateElement(DOMstrings.mediaCTA, 'sports_esports');
            } else { //else pick an animation
                projectId = animations[Math.floor(Math.random() * animations.length)];
                updateElement(DOMstrings.mediaLabels, '• Watch Christmas Animation');
                updateElement(DOMstrings.mediaCTA, 'play_arrow');
            }

            document.querySelector(DOMstrings.media).style.backgroundImage = `radial-gradient(circle, transparent, rgba(0, 0, 0, 0.3)), url(https://cdn2.scratch.mit.edu/get_image/project/${projectId}_480x360.png)`;
            document.querySelector(DOMstrings.mediaCTA).parentElement.setAttribute('href', `https://scratch.mit.edu/projects/${projectId}/fullscreen/`);
        }, 1000);
    }

    updateTime() {
        setInterval(() => {
            const time = new Date();
            let hour = time.getHours();
            const timeOfDay = hour < 12 ? 'AM' : 'PM';
            hour = (hour > 12) ? (hour - 12) : (hour === 0 ? 12 : hour);
            const minute = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();

            updateElement(DOMstrings.headerTime, `${hour}:${minute} ${timeOfDay}`);
        }, 1000);
    }
    

    async updateTakeOffTime(takeoffTime) {
        updateElement(DOMstrings.routeLabels, 'Santa Takes Off In...');
        await countDown(takeoffTime, 'routeValues');
    }

    async updateArrTime(arrTime) {
        await countDown(arrTime, 'routeValues');
        updateElement(DOMstrings.routeValues, 'Arrived');
    }

    updateGiftsCount(timeNext, presentsDelivered, currAmtGifts) {
        let giftsAdded = Math.round((presentsDelivered - currAmtGifts) / ((timeNext - new Date().getTime()) / 2000));
        let total = currAmtGifts + giftsAdded;
        updateElement(
            DOMstrings.giftsCount
        , `<span class="material-icons">redeem</span><h1>${total.toLocaleString('en-US')}</h1>`); // separate thousands with commas
        return total;
    }

    createSantaVillage() {
        console.log('creating santa village');
        document.querySelector(DOMstrings.santaVillage).classList.add('santa_village');
    }

    animateSanta = (santaMarker, currLat, currLng, previousLatitude, previousLongitude, santaAutoTrack) => {
        if (this.bounce) {
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
                if (this.bounce == true) { //stop animating up and down when it's airborne (bounce set to false)
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
