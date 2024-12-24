import SantaController from './santaController.js';
import UiController from './uiController.js';

const santaCtrl = new SantaController();
const uiCtrl = new UiController();

const controller = async () => {
  let routeData, santaPos, scratcherData, arrTime, pointsAlongRoute;
  let currAmtGifts = undefined;

  uiCtrl.updateTime(); // update the time on the sidebar header, loops itself every minute to update

  routeData = await santaCtrl.getRouteAPI(); // get route data from API
  await santaCtrl.getLocationData(); // get Scratch users location using api

  santaPos = await santaCtrl.getSantaPos(); // get santa position
  console.log(santaPos)
  santaCtrl.plotSantaVillage();
  uiCtrl.createSantaVillage();

  uiCtrl.updateMedia(); // update the media card with games and animations

  if (santaPos.orderID < routeData.length) {
    uiCtrl.updatePhotos(santaPos); // update the photos stack with photos for the current location
    
    if (santaPos.currMode == 'Preflight') {
      await uiCtrl.updateRoute(santaPos, []);
      santaPos = await santaCtrl.getSantaPos(); // get santa position
    }

    pointsAlongRoute = santaCtrl.getEquidistantCoordinates();
    uiCtrl.updateStatus(santaPos); // changing santa's image to flying / delivering gifts
    santaCtrl.drawRecentRoute(santaPos.orderID); // draw a line connecting the last 20 locations santa visited

    santaCtrl.findArrTime().then((value) => {
      uiCtrl.updateArrTime(value); // find how much time left until santa arrives
    });

    if (currAmtGifts == undefined) {
      currAmtGifts = santaPos.presentsDelivered;
    }

    setInterval(() => {
      currAmtGifts = uiCtrl.updateGiftsCount(santaPos.timeNext, santaPos.presentsDelivered, currAmtGifts);
    }, 2000);
  }

  while (true && santaPos.orderID < routeData.length) {
    let santaLocation = santaCtrl.getSantaMarker();

    await uiCtrl.updateRoute(santaPos, pointsAlongRoute, santaLocation); // update the route dashboard with current info and wait for timer to countdown

    await santaCtrl.getNextPos(); // update the santaPos object with new values

    if (santaPos.currMode == 'Airborne') {
      pointsAlongRoute = santaCtrl.getEquidistantCoordinates();
    }

    uiCtrl.updateStatus(santaPos);
    uiCtrl.updatePhotos(santaPos);
    santaCtrl.drawRecentRoute(santaPos.orderID);
  }

  uiCtrl.updatePhotos()
};

controller();