var map;
var markers;
var inputDate;
var database = firebase.database().ref();
var searchResults = [];

// Updates the display to show the new firebase searches
function updateDisplay() {
  $('#search-counter').empty();
  for (var i = 0; searchResults.length > i; i++) {
    var newDiv1 = $('<div>');
    newDiv1.html("Area Name: " + searchResults[i].AreaName
      + "<br>Location: " + searchResults[i].Location
      + "<br>Crime: " + searchResults[i].Crime
      + "<br> ");
    $('#search-counter').append(newDiv1);
  }
}

//Function callback when document is fully loaded
$(document).ready(function () {
  initializeMap();
  //initialize dropdown and datepicker select
  $('select').formSelect();
  $('.datepicker').datepicker();
  //add click event to submit button
  $('#userInput').click(function () {
    //get the date and format it into proper formats
    var date = formatUserInputDate($('.datepicker').val());
    //get crime code value
    var code = $('#dropDownMenu option:selected').val();
    //call function designed to handle input and determine which function to use
    handleUserInput(code, date);
    getNews();
  });
  //confusion
  database.orderByChild("dateAdded").limitToLast(5).on("child_added", function (snapshot) {
    // Change the HTML to reflect
  });
});

//function to handle user input and determine correct function for use
//input of crime csode and date
function handleUserInput(code, date) {
  if (code >= 0 && date !== undefined) {
    //use function that uses ajax both parameters
    getCrimeDataDateAndCode(date, code);
  }
  //one or the other is valid. if date is valid do ajax with date
  else if (date !== undefined) {
    getCrimeDataDate(date);
  }
  //if crime code is valid, do ajax with crime code
  else if (code > 0) {
    getCrimeDataCrime(code);
  }
  //else alert error
  else {
    alert("Error");
  }
}

//function to initialize leaflet map on screen
function initializeMap() {
  //variable map initialized to be a leaflet map with in element 'map' with defined center and zoom. coords using latitude and longitude
  map = L.map('map', {
    center: [34.0522, -118.2437],
    zoom: 13
  });
  //set a tilelayer for the map. Grab tilelayer of openstreetmap. Free map data resource
  //make sure to give attributuion for credit and set max zoom
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);//Finally add layer to map
}
// function to check if a crime and date was selected
function handleUserInput(code, date) {

  // both are selected
  if (code >= 0 && date !== "" && date !== undefined && date !== null) {
    getCrimeDataDateAndCode(date, code);
  }//if a date was the only thing selected
  else if (date !== "" && date !== undefined && date !== null) {
    getCrimeDataDate(date);
  }
  else if (code > 0) {
    getCrimeDataCrime(code);
  }
  else {
    alert("Error");
  }
}


function formatUserInputDate(string) {
  //if string is empty, null, or underdefined then dont do anything
  if (string === "" || string === null || string === undefined) {
    return;
  }
  //if not then use regular expression to remove non numeric characters and replace with blank space
  string = string.replace(/\D/g, '');
  //create a moment by parsing string with expected format
  var day = moment(string, "MMM DD YYYY");
  //format string to get proper format of date
  day = day.format('YYYY-MM-DD');
  //return string
  return day.toString();
}

//ajax call function using just a date
function getCrimeDataDate(date) {
  $.ajax({
    url: "https://data.lacity.org/resource/7fvc-faax.json?date_occ=" + date + "T00:00:00.000",
    data: {
      "$limit": 500,
      "$$app_token": "fNjQDblxyyhoI1YrUgCkAQj6Y"
    }//once ajax is called run the map crime data function
  }).done(function (data) {
    //callback function with data. pass data to map function
    mapCrimeData(data);
  });
}

//ajax call function using just a crime code
function getCrimeDataCrime(crmCD) {
  $.ajax({
    url: "https://data.lacity.org/resource/7fvc-faax.json?crm_cd=" + crmCD,
    data: {
      "$limit": 500,
      "$$app_token": "fNjQDblxyyhoI1YrUgCkAQj6Y"
    }
  }).done(function (data) {
    //callback function with data. pass data to map function
    mapCrimeData(data);
  });
}

//ajax call function using both date and crime code
function getCrimeDataDateAndCode(date, crmCD) {
  $.ajax({
    url: "https://data.lacity.org/resource/7fvc-faax.json?date_occ=" + date + "T00:00:00.000&crm_cd=" + crmCD,
    data: {
      "$limit": 500,
      "$$app_token": "fNjQDblxyyhoI1YrUgCkAQj6Y"
    }
  }).done(function (data) {
    results = data;
    //callback function with data. pass data to map function
    mapCrimeData(data);
  });
}

//function to make markers on leaflet map using response data
function mapCrimeData(data) {
  //if layer of markers already exists clear layer of markers
  if (markers !== null && markers !== undefined) {
    markers.clearLayers();
  }
  //initialize markers as an empty layerGroup
  markers = L.layerGroup([]);
  //for all results in response
  for (var i = 0; i < data.length; i++) {
    var lat = data[i]["location_1"]["coordinates"][1];
    var lon = data[i]["location_1"]["coordinates"][0];
    var marker = L.marker([lat, lon]);
    marker.alt = i;
    marker.on("click", function () {
      //create a div with text from data
      //Change this part here
      $('#stats').html("Area Name: " + data[this.alt]["area_name"]
        + "<br>Location: " + data[this.alt]["location"]
        + "<br>Crime: " + data[this.alt]["crm_cd_desc"]
        + "<br> ");
      //create a data object to be added to firebase
      var newData = {
        AreaName: data[this.alt]["area_name"],
        Location: data[this.alt]["location"],
        Crime: data[this.alt]["crm_cd_desc"],
        DateOcc: data[this.alt]["date_occ"],
        DateRptd: data[this.alt]["date_rptd"],
        VictimAge: data[this.alt]["vict_age"],
        VictimDescent: data[this.alt]["vict_descent"],
        VictimSex: data[this.alt]["vict_sex"],
        dateAdded: firebase.database.ServerValue.TIMESTAMP
      };
      //generate a unique post key for the data
      var newPostKey = firebase.database().ref('posts').push(newData).key;
      var updates = {};
      //add to firebase using key and data
      updates['/posts/' + newPostKey] = newData;

    });
    marker.addTo(markers);
  }
  markers.addTo(map);
}


// Calls firebase data and displays it on the page
firebase.database().ref('posts').on('child_added', function (childSnapshot) {
  if (searchResults.length > 5) {
    searchResults.pop()
    searchResults.unshift(childSnapshot.val())
  } else {
    searchResults.unshift(childSnapshot.val())
  }
  console.log(searchResults);
  updateDisplay();

});


