// Dev stuff

function enableDevMode(urlParams){
  $(".dev").css("visibility", "visible");
  console.log("Dev mode enabled, overwriting console functions");
  setDevConsole();
  if(isMobileDevice()){
    console.notify(`NDM Mobile v.${VERSION}`)
  }
  else{
    console.notify(`NDM Desktop v.${VERSION}`)
  }
  if(urlParams.has('state')){
    listDisplayState = urlParams.get('state');
    changeListDisplayState(listDisplayState, 0);
  }
}

// Copy console output to dev element
function setDevConsole(){
  var devConsole = $(".dev");
  _log = console.log;
  _error = console.error;
  console.log = function(){
    for(var i = 0; i < arguments.length; i++){
      var msg;
      if(typeof arguments[i] == 'object'){
        msg = JSON.stringify(arguments[i]);
      }
      else{
        msg = arguments[i];
      }
      devConsole.append(`<div>${msg}</div>`);
      _log(msg);
    }
  }
  console.error = function(){
    for(var i = 0; i < arguments.length; i++){
      var msg;
      if(typeof arguments[i] == 'object'){
        msg = JSON.stringify(arguments[i]);
      }
      else{
        msg = arguments[i];
      }
      devConsole.append(`<div style="color: var(--red);">${msg}</div>`);
      _error(msg);
    }
  }
  console.notify = function(){
    for(var i = 0; i < arguments.length; i++){
      var msg;
      if(typeof arguments[i] == 'object'){
        msg = JSON.stringify(arguments[i]);
      }
      else{
        msg = arguments[i];
      }
      devConsole.append(`<div style="color: var(--blue);">${msg}</div>`);
      _log(msg);
    }
  }
}

function loadDummyDiscounts(){
  $.ajax({
      type: "GET",
      url: "public/data.geojson", // Using our resources.json file to serve results
      success: function(geojson) {
        console.log("Load: Discounts downloaded");
        discountManager.parse(geojson);
        console.log("Load: Discounts parsed");
        discountManager.updateList();
        console.log("Load: List updated");
        console.log(`Load: Done (${Object.keys(discountManager.discounts).length} discounts total)`);
      }
  });
}

function setActive(id, state){

}
