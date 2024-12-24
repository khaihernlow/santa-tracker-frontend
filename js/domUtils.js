export const DOMstrings = {
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

export function updateElement(selector, content) {
    document.querySelector(selector).innerHTML = content;
}

export function updateBackgroundImage(selector, url) {
    document.querySelector(selector).style.backgroundImage = `url(${url})`;
}

export function removeAllChildren(parentSelector) {
    const parent = document.querySelector(parentSelector);
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}