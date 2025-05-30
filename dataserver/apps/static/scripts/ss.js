"use strict";

import maps from './modules/maps.js';
import polling from './modules/polling.js';
import devices from './modules/devices.js';

// Attach modules to global `ss` object
window.ss = { maps, polling, devices };

// Initialize maps if it has an init function
if (window.ss.maps.init) {
    window.ss.maps.init();
}
