import map from './map.js'
import { DOMstrings } from "./domUtils.js";

/**
 * Creates and starts a countdown timer.
 * 
 * @param {string|Date} endDate
 *      The target date/time to count down to.
 * 
 * @param {string} domString
 *      The DOM string to update.
 * 
 * @param {Array} pointsAlongRoute
 *      Array of equidistant points along the route.
 * 
 * @param {Object} santaLocation
 *      Object containing santa's location details.
 * 
 * @param {function} animateSanta
 *      Function to animate Santa.
 * 
 * @param {Object} uiController
 *      The UiController instance to access its properties.
 * 
 * @returns {Promise} 
 *      A promise that resolves when the countdown completes.
 */
export function countDown(endDate, domString, pointsAlongRoute, santaLocation, animateSanta, santaAutoTrack, uiController) {
    return new Promise((resolve) => {
        let santaAutoTrack = true;
        //if it's counting down the time at a pitstop
        if (domString === 'timeValues') {
            if (pointsAlongRoute.length === 0) {
                uiController.bounce = true;
                console.log("santa_curr_coords: " + santaLocation.currLat + ", " + santaLocation.currLng);
                console.log("santa_prev_coords: " + santaLocation.previousLatitude + ", " + santaLocation.previousLongitude);
                animateSanta(santaLocation.currMarker, santaLocation.currLat, santaLocation.currLng, santaLocation.previousLatitude, santaLocation.previousLongitude, santaAutoTrack);
            } else {
                map.on('dragstart', function () {
                    santaAutoTrack = false;
                });
            }
        }
  
        let countDownDate = new Date(endDate);
        const x = setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;
  
            if (domString === 'routeValues' && distance <= 0) {
                resolve('done');
                clearInterval(x);
            }
  
            if (domString === 'timeValues' && pointsAlongRoute.length !== 0) {
                uiController.bounce = false;
                const lastPointIndex = pointsAlongRoute.length - 1 - Math.floor(Math.abs(distance) / 1000);
                console.log("santa_curr_coords: " + santaLocation.currLat + ", " + santaLocation.currLng);
                console.log("santa_prev_coords: " + santaLocation.previousLatitude + ", " + santaLocation.previousLongitude);
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
                if (days > 0) { //Preflight mode
                    document.querySelector(DOMstrings.routeValues).innerHTML = `${days} Days`;
                    if (hours > 1) {
                        document.querySelector(DOMstrings.routeValues).insertAdjacentHTML('beforeend', ` and ${hours} Hours`);
                    } else {
                        document.querySelector(DOMstrings.routeValues).insertAdjacentHTML('beforeend', ` and ${minutes} Minutes`);
                    }
                } else if (hours < 1) { //Pitstop & Airborne mode
                    document.querySelector(DOMstrings.routeValues).innerHTML = `${minutes} Minutes`;
                    
                    hours > 1
                    ? document.querySelector(DOMstrings.routeValues).insertAdjacentHTML('beforeend', ` and ${hours} Hours`)
                    : document.querySelector(DOMstrings.routeValues).insertAdjacentHTML('beforeend', ` and ${minutes} Minutes`);
                } else if (hours < 1) {
                    minutes < 1
                    ? document.querySelector(DOMstrings.routeValues).innerHTML = `${seconds} Seconds`
                    : document.querySelector(DOMstrings.routeValues).innerHTML = `${minutes} Minutes`;
                } else {
                    document.querySelector(DOMstrings.routeValues).innerHTML = `${hours} Hours ${minutes} Minutes`;
                }

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
}