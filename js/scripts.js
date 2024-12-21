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
  santaCtrl.plotSantaVillage();
  uiCtrl.createSantaVillage();

  uiCtrl.updatePhotos(santaPos); // update the photos stack with photos for the current location
  uiCtrl.updateMedia(); // update the media card with games and animations
  
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

  while (true) {
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

  // if santa is flying, split route into equidistant points, 
  // so that santa can move smoothly as it updates slightly once per second
  // let pointsAlongRoute; 
  // if (santaPos.currMode == 'Airborne') { 
  //   pointsAlongRoute = santaCtrl.getEquidistantCoordinates();
  // }

  // uiCtrl.updateStatus(santaPos); // changing santa's image to flying / delivering gifts
  
  // if (currAmtGifts == undefined) {
  //   currAmtGifts = santaPos.presentsDelivered;
  // }

  // // update the gifts counter every 2 seconds
  // if (santaPos.currMode != 'Preflight') {  
  //   santaCtrl.findArrTime().then((value) => {
  //     uiCtrl.updateArrTime(value); // find how much time left until santa arrives
  //   });
  //   setInterval(() => {
  //     currAmtGifts = uiCtrl.updateGiftsCount(santaPos.timeNext, santaPos.presentsDelivered, currAmtGifts);
  //   }, 2000);
  // }

  // // Main loop
  // while (true) {
  //   let santaLocation = santaCtrl.getSantaMarker();

  //   await uiCtrl.updateRoute(santaPos, pointsAlongRoute, santaLocation); // update the route dashboard with current info and wait for timer to countdown
    
  //   if (santaPos.currMode == 'Preflight') {
  //     santaPos = await santaCtrl.getSantaPos();
  //     setInterval(() => {
  //       currAmtGifts = uiCtrl.updateGiftsCount(santaPos.timeNext, santaPos.presentsDelivered, currAmtGifts);
  //     }, 2000);
  //     santaCtrl.findArrTime().then((value) => {
  //       uiCtrl.updateArrTime(value); // find how much time left until santa arrives
  //     });
  //   }
     
  //   await santaCtrl.getNextPos(); // update the santaPos object with new values

  //   if (santaPos.currMode == 'Airborne') {
  //     pointsAlongRoute = santaCtrl.getEquidistantCoordinates();
  //   }

  //   uiCtrl.updateStatus(santaPos);
  //   uiCtrl.updatePhotos(santaPos);
  //   santaCtrl.drawRecentRoute(santaPos.orderID);
  // }
};

controller();