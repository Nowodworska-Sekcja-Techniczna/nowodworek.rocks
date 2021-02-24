// Nowodworek Discount Map
const VERSION = "1.0";

// Mapbox Map
var map;
// Discounts
var discountManager;

// Discount function
function Discount(id, type, name, discount, location, coordinates, website) {
  this.id = id;
  this.type = type;
  this.name = name;
  this.discount = discount;
  this.location = location;
  this.coordinates = coordinates;
  this.website = website;
}

// DiscountManager function
function DiscountManager() {
  var self = this;
  this.discounts = {};
  this.focusedDiscount = 1;
  this.activeDiscount = function() {
    return this.get(this.focusedDiscount);
  }
  this.locationMarker = undefined;
  this.add = function(discount) {
    if (this.discounts[discount.id] == undefined) {
      this.discounts[discount.id] = discount;
      return true;
    } else {
      return false;
    }
  }
  this.get = function(id) {
    return this.discounts[id];
  }
  this.parse = function(data) {
    data.features.forEach(function(feature) {
      var discount = new Discount(feature.id, feature.properties.type, feature.properties.name, feature.properties.discount, feature.properties.location, feature.geometry.coordinates, feature.properties.website);
      self.add(discount);
    });
  }
  this.updateList = function(source = this.discounts) {
    $(".list-group").empty();
    $.each(source, function(i, discount) {
      var element =
        `<li id="L${discount.id}" class="list-group-item it-${discount.type} noselect" onclick="focusOnDiscount(this)">
          <div class="list-group-item-name">
            <a>${discount.name}</a>
          </div>
          <div class="list-group-item-details">
            <i class="list-group-item-external fas fa-external-link-alt" onclick="${discount.website}"></i>
            <div class="list-group-item-distance">${listSettings.locate ? `${roundDistance(latLonDistance(discount.coordinates[1], discount.coordinates[0], position.latitude, position.longitude))}` : ""}</div>
          </div>
        </li>`;
      $(".list-group").append(element);
    });
  }
  /*
  div class="list-group-item-distance">${listSettings.locate ? `${function() {
    return latLonDistance(discount.coordinates.lat, discount.coordinates.lon, position.latitude, position.longitude);
  }}m` : ""}</div>
  */
  this.updateListByType = function() {
    var sorted = {};
    $.each(this.discounts, function(index, discount) {
      if (sorted[discount.type] == undefined) {
        sorted[discount.type] = [];
      }
      sorted[discount.type].push(discount);
    });
    $(".list-group").empty();
    $.each(sorted, function(i, type) {
      $.each(type, function(i, discount) {
        var element =
          `<li id="L${discount.id}" class="list-group-item it-${discount.type} noselect" onclick="focusOnDiscount(this)">
            <div class="list-group-item-name">
              <a>${discount.name}</a>
            </div>
            <div class="list-group-item-details">
              <i class="list-group-item-external fas fa-external-link-alt" onclick="${discount.website}"></i>
              <div class="list-group-item-distance">${listSettings.locate ? `${roundDistance(latLonDistance(discount.coordinates[1], discount.coordinates[0], position.latitude, position.longitude))}` : ""}</div>
            </div>
          </li>`;
        $(".list-group").append(element);
      });
    });
  }
}

// Events

// Parameters in URL
var urlParams;

window.onload = function() {
  discountManager = new DiscountManager();
  urlParams = new URLSearchParams(window.location.search);
  hasMap = !urlParams.has('noMap');
  // Enable devmode
  if (urlParams.has('dev')) {
    $.getScript("public/js/dev.js", function() {
      enableDevMode(urlParams);
      if (hasMap) {
        initMap();
      } else {
        loadDummyDiscounts();
      }
    });
  } else {
    if (hasMap) {
      initMap();
    }
  }
}

function onMapLoad() {
  if (urlParams.has('discount')) {
    var id = urlParams.get('discount');
    console.log(`FocusRequest: LINK => ${id}`);
    focusOnDiscountById(id);
  }

  // Lose focus on active discount on map click
  $('.mapboxgl-canvas').click(function() {
    discountManager.focusedDiscount == undefined ? undefined : loseFocusOnDiscount(discountManager)
  });
}

// Mapbox init
function initMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZmlyZWJpdGUiLCJhIjoiY2tsamUwcmozMGNpaTJwb2Job2M0cDBucyJ9.X4lRi61CRWinbNGHCS7SQg';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/firebite/cjrax9zr50s9d2tkieemekyzk',
    center: [19.93300, 50.061080],
    zoom: 14,
    minZoom: 10,
    maxZoom: 19,
    attributionControl: false
  }).addControl(new mapboxgl.AttributionControl({
    compact: true
  }));
  if (isMobileDevice()) {

  } else {
    var nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'bottom-right');
  }
  loadDiscounts();
  map.on('load', onMapLoad);
}

// Load and display discounts
function loadDiscounts() {
  $.ajax({
    type: "GET",
    url: "public/data.geojson", // GEOJSON source
    dataType: "json",
    success: function(geojson) {
      console.log("Load: Discounts downloaded");
      discountManager.parse(geojson);
      console.log("Load: Discounts parsed");

      // Create markers
      geojson.features.forEach(function(discount) {
        // Create a HTML element for each feature
        var marker = document.createElement('div');
        marker.className = 'marker';
        marker.id = "M" + discount.id;
        marker.setAttribute("onclick", "focusOnDiscount(this);");
        if (discount.properties.type != "") {
          marker.className += " ds-" + discount.properties.type;
          marker.innerHTML = `<i class="marker-icon fas fa-${discount.properties.type}"></i>`;
        }

        // Make a marker for each feature and add to the map
        new mapboxgl.Marker(marker)
          .setLngLat(discount.geometry.coordinates)
          .addTo(map);
      });

      // Add user location marker
      var marker = document.createElement('div');
      marker.className = 'marker';
      marker.id = "M-location";
      marker.className += " ds-person";
      marker.innerHTML = `<i class="marker-icon fas fa-person"></i>`;
      discountManager.locationMarker = new mapboxgl.Marker(marker)
        .setLngLat(POINT)
        .addTo(map);

      console.log("Load: Map updated");
      discountManager.updateList();
      console.log("Load: List updated");
      console.log(`Load: Done (${Object.keys(discountManager.discounts).length} discounts total)`);
    }
  });
}

// Utils
// Phone detection
function isMobileDevice() {
  if (navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i)) {
    return true;
  }
  return false;
}

// Marker offset
var OFFSET = -0.00016;

// Coordinate bar offset aka dark magic black box
function calculateCoordinates(coordinate) {
  // If list is not hidden add offset
  // Desktop
  if ($(window).width() > 650 && !$(".expand-hide")[0]) {
    var delta = (($(window).width() - 300) / 2) + 300 - ($(window).width() / 2);
    var offset = delta * -0.000001875;
    return [coordinate[0] + offset, coordinate[1]];
  }
  // Mobile
  // TODO: Offset doesn't match with panBy offset. Recalculate everything
  else if ($(window).width() <= 650 && $(".expand-hide")[0]) {
    var delta = (($(window).height() - 328) / 2) + 328 - ($(window).height() / 2);
    var offset = delta * -0.000001875;
    return [coordinate[0], coordinate[1] + offset];
  }
  // No need to add offset
  else {
    return coordinate;
  }
}

// List
// TODO: Move to object

// Current list state.
// 0 - Shrinked.
// 1 - Expanded.
var listState = 0;

// Current list display state.
// 'list' - Display all discounts.
// 'display' - Display discount details.
var listDisplayState = "list";

// Animation step (in ms)
var STEP = 300;

// Map zoom level on discount
var ZOOM = 18;

// Map default zoom level
var ZOOM_DEFAULT = 14;

// Max distance to center point (in m)
var MAX_DISTANCE = 10000;

// Point to measure max distance from
var POINT = {
  "lat": 50.06171,
  "lon": 19.93736
};

// LocationInterval token
var locationIntervalToken;

// Location update speed
var UPDATE_SPEED = 3000;

// List settings values
var listSettings = {
  locate: false,
  groupByType: false,
  search: false
}

// Expand or shrink list
function changeListState(state, pan) {
  if (state != listState) {
    if (state == 0) {
      if (pan) {
        map.panBy([0, -150], {
          duration: 1000
        });
      }
      $(".mapboxgl-ctrl-bottom-left").removeClass("shrink");
      $(".mapboxgl-ctrl-bottom-right").removeClass("shrink");
      $(".list").removeClass("expand");
      $(".list-hide-button").removeClass("expand-hide");
    }
    if (state == 1) {
      if (pan) {
        map.panBy([0, 150], {
          duration: 1000
        });
      }
      $(".mapboxgl-ctrl-bottom-left").addClass("shrink");
      $(".mapboxgl-ctrl-bottom-right").addClass("shrink");
      $(".list").addClass("expand");
      $(".list-hide-button").addClass("expand-hide");
    }

    listState = state;
  }
}

// Toggle list state
function toggleListState(pan) {
  if (listState == 0) {
    changeListState(1, pan);
  } else if (listState == 1) {
    changeListState(0, pan);
  }
}

// List view settings
function changeSetting(element) {
  var setting = element.id;
  if (listSettings[setting] == null) {
    console.error(`ChangeSetting: ${element.id} doesn't exist`);
    return element;
  }
  // Set new value
  var value = !listSettings[setting];
  listSettings[setting] = value;
  // Do some actiohs
  switch (setting) {
    case 'locate':
      if (value) {
        $("#M-location").addClass("visible"); // Show marker
        locationIntervalToken = setInterval(measureDistances, UPDATE_SPEED); // Update location @ 10s
        measureDistances(); // Calculate distances
      } else {
        clearInterval(locationIntervalToken); // Stop update
        $("#M-location").removeClass("visible"); // Remove marker
        if (value) {
          discountManager.updateListByType();
        } else {
          discountManager.updateList();
        }
      }
      break;
    case 'groupByType':
      if (value) {
        discountManager.updateListByType();
      } else {
        discountManager.updateList();
      }
      break;
    case 'source':

      break;
  }
  if (value) {
    $("#" + setting).addClass("setting-active");
  } else {
    $("#" + setting).removeClass("setting-active");
  }
  console.log(`ChangeSetting: ${setting} -> ${value}`);
}

// Move map to discount and display info
function focusOnDiscount(element) {
  var prefix = element.id.charAt(0);
  var discountId = element.id.substr(1);
  console.log(`FocusRequest: ${prefix} => ${discountId}`);
  focusOnDiscountById(discountId);
}

function focusOnDiscountById(id) {
  var discount = discountManager.get(id);

  changeListDisplayState("details-update", discount);
  if (listState == 0 && isMobileDevice()) {
    changeListState(1);
  }

  // Change if new discount is selected
  if (discountManager.focusedDiscount != id) {
    map.flyTo({
      center: calculateCoordinates(discount.coordinates),
      zoom: ZOOM,
      bearing: 0 // TODO: Fix offsets calculation to include rotation
    });

    $(`#M${discountManager.focusedDiscount}`).removeClass("active");
    discountManager.focusedDiscount = id;
    $(`#M${discountManager.focusedDiscount}`).addClass("active");
  }
}

// Removes focus and active class from discount marker
function loseFocusOnDiscount() {
  changeListDisplayState("list", discountManager.activeDiscount());
  $(`#M${discountManager.focusedDiscount}`).removeClass("active");
  discountManager.focusedDiscount = undefined;

  map.flyTo({
    zoom: ZOOM_DEFAULT
  });
}

function changeListDisplayState(state, discount) {
  console.log(`ChangeState: ${listDisplayState} => ${state}`);
  var lastDiscount = discountManager.activeDiscount();
  switch (state) {
    case "list":
      setTimeout(function() {
        $("#details-container").addClass("d-hidden");
      }, 0);
      setTimeout(function() {
        $(".list-header-button").removeClass(`ds-${lastDiscount.type}`);
      }, STEP / 2);
      setTimeout(function() {
        $("#discount-container").removeClass("d-display");
        $("#details-container").removeClass("d-display");
      }, STEP);
      setTimeout(function() {
        $("#discount-container").removeClass("d-hidden");
      }, STEP + 10);
      break;
    case "details":
      setTimeout(function() {
        $("#discount-container").addClass("d-hidden");
      }, 0);
      setTimeout(function() {
        updateDetails(discount);
        $("#discount-container").addClass("d-display");
        $("#details-container").addClass("d-display");
        $(".list-header-button").addClass(`ds-${discount.type}`);
      }, STEP);
      setTimeout(function() {
        $("#details-container").removeClass("d-hidden");
      }, STEP + 10);
      break;
    case "details-update": // Doesn't change discount-container visibility
      if (listDisplayState == "details-update") {
        setTimeout(function() {
          $("#discount-container").addClass("d-hidden");
        }, 0);
        $(".list-header-button").removeClass(`ds-${lastDiscount.type}`);
        $(".list-header-button").addClass(`ds-${discount.type}`);
        updateDetails(discount);
        setTimeout(function() {
          $("#discount-container").removeClass("d-hidden");
        }, STEP + 10);
      } else {
        changeListDisplayState("details", discount);
      }
      break;
  }
  listDisplayState = state;
}

function updateDetails(discount) {
  console.log(`ChangeState: Details updated`);
  $("#details-container").empty();
  var element =
    `<div class="details-header ds-${discount.type}">
    <i class="fas fa-arrow-left details-header-button" onclick="loseFocusOnDiscount()"></i>
    <div class="details-header-text">${discount.name}</div>
   </div>
   <!--div class="details-image">
   </div-->
   <div id="${discount.id}" class="details-button-container noselect ds-${discount.type}">
    <div id="${discount.id}" class="details-button" onclick="openMaps(this)">
      <i class="fas fa-map-marked-alt details-button-icon"></i>
      <div class="details-button-text">
        Mapa
      </div>
    </div>
    <!--div id="${discount.id}" class="details-button">
      <i class="fas fa-globe details-button-icon"></i>
      <div class="details-button-text">
        Strona
      </div>
    </div-->
    <div id="${discount.id}" class="details-button" onclick="copyLink(this);">
      <i class="fas fa-link details-button-icon"></i>
      <div class="details-button-text">
        Link
      </div>
    </div>
   </div>
   <ul class="details-list">
     <li class="details-entry">
       <div class="left">Zniżka:</div>
       <div class="right">${discount.discount}</div>
     </li>
     <li class="details-entry">
       <div class="left">Miejsce:</div>
       <div class="right">${discount.location}</div>
     </li>
   </ul>
   ${listSettings.locate ?
    `<li class="details-entry">
       <div class="left">Odległość:</div>
       <div class="right">${roundDistance(latLonDistance(discount.coordinates[1], discount.coordinates[0], position.latitude, position.longitude))}</div>
     </li>`
   : ''}
   <div class="details-footer">
     Id: ${discount.id}
   </div>`;
  $("#details-container").append(element);
}

function copyLink(element) {
  // Copy using magic
  const copyEl = document.createElement('textarea');
  copyEl.value = location.protocol + '//' + location.host + location.pathname + '?discount=' + element.id;
  document.body.appendChild(copyEl);
  copyEl.select();
  document.execCommand('copy');
  document.body.removeChild(copyEl);

  element.getElementsByClassName("details-button-text")[0].innerText = "Done!";
  console.log(`Copy: Copied link to ${element.id}`);
}

function openMaps(element) {
  var discount = discountManager.get(element.id);
  var querry = discount.name + ' ' + discount.location;
  querry = querry.replace(/ /g, '+');
  querry = "http://maps.google.com/?q=" + querry;
  window.open(querry);
  console.log(`Maps: Opened link to ${element.id}`);
}

var position;

function measureDistances() {
  navigator.geolocation.getCurrentPosition(function(newPosition) {
    position = newPosition.coords;
    discountManager.locationMarker.setLngLat([position.longitude, position.latitude]); // Update location position

    // Debug distance to Cracow
    var distance = latLonDistance(POINT.lat, POINT.lon, position.latitude, position.longitude);
    console.log("Distance: Cracow <-> User | " + roundDistance(distance));

    if (listSettings.groupByType) {
      discountManager.updateListByType();
    } else {
      discountManager.updateList();
    }
  }, function(error) {
    var code;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        code = "User denied the request for Geolocation."
        break;
      case error.POSITION_UNAVAILABLE:
        code = "Location information is unavailable."
        break;
      case error.TIMEOUT:
        code = "The request to get user location timed out."
        break;
      case error.UNKNOWN_ERROR:
        code = "An unknown error occurred."
        break;
    }
    console.error(`Distance: ${code}`);
  });
}

// Just trust me that it works
function latLonDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function roundDistance(d) {
  if (d > 1) return Math.round(d) + "km";
  else if (d <= 1) return Math.round(d * 1000) + "m";
}
