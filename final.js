let map;
let directionsService;
let directionsRenderer;
let googleapikey;



const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const openButton = document.getElementById('openButton');
const closeButton = document.getElementById('closeButton');


closeButton.addEventListener('click', () => {
    modal.classList.add('hidden');
    modalBackdrop.classList.add('hidden');
});

modalBackdrop.addEventListener('click', () => {
    modal.classList.add('hidden');
    modalBackdrop.classList.add('hidden');
});


async function setAPI(){
    // opensourceapiKey = $('#opensourceapiKey').val();
    googleapikey = $('#googleapikey').val();
    $('#xhide').show()
    await loadGoogleMapsAPI(googleapikey).then(()=>{
      console.log('done')
      modal.classList.add('hidden');
      modalBackdrop.classList.add('hidden');
    });
    
}

function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleapikey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API script'));
      document.head.appendChild(script);
    });
  }


 async function getCoordinates() {
      const pickup = $('#pickup').val()
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pickup)}&key=${googleapikey}&libraries=places`;

      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const place = data.results[0].formatted_address;
          const coordinates = data.results[0].geometry.location;
          console.log(`Place: ${place}`);
          console.log(`Coordinates: Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}`);
          return { name: place, location: {lat: coordinates.lat, lng: coordinates.lng} };
        } else {
          console.log('No results found');
          return null;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    }

async function getCoordinatesFromText(placeInput) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeInput)}&key=${googleapikey}&libraries=places`;

      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const place = data.results[0].formatted_address;
          const coordinates = data.results[0].geometry.location;
          console.log(`Place: ${place}`);
          console.log(`Coordinates: Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}`);
          return { name: place, location: {lat: coordinates.lat, lng: coordinates.lng} };
        } else {
          console.log('No results found');
          return null;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    }

// async function ecalculate() {
//   document.getElementById('loading').style.display = 'block';
//   const destinations = ($('#pickup').val() + '\n' +$('#destinations').val()).split('\n')

//   let destinationCoordinates = [];

//   for (let destination of destinations) {
//     const coords = await getCoordinatesFromText(destination);
//     if (coords) {
//       destinationCoordinates.push(coords);
//     }
//   }

//   if (destinationCoordinates.length > 0) {
//     let waypoints = []
//     for (let dest of destinationCoordinates) {
//       waypoints.push(new google.maps.LatLng(dest.location.lat, dest.location.lng));
//     }
//     mapRoute(waypoints, destinationCoordinates);
//   }
  
//   document.getElementById('loading').style.display = 'none';
// }

async function rcalculate(){
  const pickupCity = document.getElementById('pickupcity').value;
  const deliveryCity = document.getElementById('deliverycity').value;
  const mileage1p1d = parseFloat(document.getElementById('1p1dM').value);
  const rate1p1d = parseFloat(document.getElementById('1p1dR').value);
  const assistCost = parseFloat(document.getElementById('assistcost').value) || 200;
  const numStops = parseInt(document.getElementById('numstop').value);
  const totalStopMiles = parseFloat(document.getElementById('totalstop').value);
  const rpmAdd = parseFloat(document.getElementById('rpmadd').value) || 2.25;
  const additionalRate = parseFloat(document.getElementById('addrate').value) || 100;
  const markup = parseFloat(document.getElementById('markup').value) || 20;

  // Formula Calculations
  const additionalMiles = totalStopMiles - mileage1p1d;
  const totalCost = rate1p1d + (additionalMiles * rpmAdd) + (additionalRate * (numStops - 1));
  const totalRateCustomer = totalCost * (1 + markup / 100);

  document.getElementById('additionalMiles').value = additionalMiles.toFixed(2);
  document.getElementById('totalCost').value = totalCost.toFixed(2);
  document.getElementById('totalRateCustomer').value = totalRateCustomer.toFixed(2);
  document.querySelector('.results').style.display = 'block';
}

async function reset(){
  document.getElementById('pickupcity').value = '';
  document.getElementById('deliverycity').value = '';
  document.getElementById('1p1dM').value = '';
  document.getElementById('1p1dR').value = '';
  document.getElementById('assistcost').value = '200';
  document.getElementById('numstop').value = '';
  document.getElementById('totalstop').value = '';
  document.getElementById('rpmadd').value = '2.25';
  document.getElementById('addrate').value = '100';
  document.getElementById('markup').value = '25';

  document.getElementById('additionalMiles').textContent = '';
  document.getElementById('totalCost').textContent = '';
  document.getElementById('totalRateCustomer').textContent = '';
  document.querySelector('.results').style.display = 'none';
}






async function ecalculate() {
    document.getElementById('loading').style.display = 'block';
    const destinations = ($('#pickup').val() + '\n' + $('#destinations').val()).split('\n');

    let destinationCoordinates = [];

    for (let destination of destinations) {
        const coords = await getCoordinatesFromText(destination);
        if (coords) {
            destinationCoordinates.push(coords);
        }
    }

    if (destinationCoordinates.length > 0) {
        let waypoints = destinationCoordinates.map(dest => new google.maps.LatLng(dest.location.lat, dest.location.lng));
        mapRoute(waypoints, destinationCoordinates);
    }

    document.getElementById('loading').style.display = 'none';
}

function mapRoute(waypoints, destinations) {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: waypoints[0], // Center the map on the pickup location
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    findShortestPath(directionsService, destinations).then(sequence => {
        const waypoints = sequence.slice(1, -1).map(dest => ({
            location: new google.maps.LatLng(dest.location.lat, dest.location.lng),
            stopover: true
        }));

        directionsService.route({
            origin: new google.maps.LatLng(sequence[0].location.lat, sequence[0].location.lng),
            destination: new google.maps.LatLng(sequence[sequence.length - 1].location.lat, sequence[sequence.length - 1].location.lng),
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
                const route = response.routes[0];
                updateTable(route, sequence);
            } else {
                console.error(`Directions request failed due to ${status}`);
            }
        });
    });
}


function updateTable(route, destinations) {
    const summary = route.legs.reduce((acc, leg) => {
        acc.totalDistance += leg.distance.value;
        acc.totalTime += leg.duration.value;
        return acc;
    }, { totalDistance: 0, totalTime: 0 });

    const totalDistance = (summary.totalDistance / 1609.34).toFixed(2); // Convert meters to miles
    const totalTime = (summary.totalTime / 3600).toFixed(2); // Convert seconds to hours
    let pick1, last, lname, numberofstops;

    let resultsHtml = `<h2 class="text-2xl font-semibold mb-4">Results</h2>`;
    resultsHtml += `<p>Total Distance: ${totalDistance} miles</p>`;
    resultsHtml += `<p>Total Time: ${totalTime} hours</p>`;
    resultsHtml += `<p id='pickdrop'>1p1d: miles</p><br>`;
    resultsHtml += `<h2 class="text-2xl font-semibold mb-4">Routes Delivery Table</h2>`;
    resultsHtml += `<table id="myTable" class="display"><thead><tr><th>Stop</th><th>Location</th><th>Distance to Next Stop</th><th>Time to Next Stop</th></tr></thead><tbody>`;

    route.legs.forEach((leg, i) => {
        const distanceToNextStop = (leg.distance.value / 1609.34).toFixed(2);
        const timeToNextStop = (leg.duration.value / 3600).toFixed(2);
        const stopType = i === 0 ? 'Pick Up' : `Delivery ${i}`;

        resultsHtml += `<tr><td>${stopType}</td><td>${destinations[i].name}</td><td>${i < destinations.length - 1 ? `${distanceToNextStop} mi` : ''}</td><td>${i < destinations.length - 1 ? `${timeToNextStop} hours` : ''}</td></tr>`;

        if (i === 0) {
            pick1 = leg.distance.value / 1609.34;
        } else if (i === route.legs.length - 1) { // Ensure last leg
            last = leg.distance.value / 1609.34;
            lname = destinations[i].name;
        }

        numberofstops = i + 1;
    });

    // Ensure the last row has empty distance and time
    resultsHtml += `<tr><td>Delivery ${destinations.length}</td><td>${destinations[destinations.length - 1].name}</td><td></td><td></td></tr>`;

    resultsHtml += `</tbody></table>`;
    document.getElementById('results').innerHTML = resultsHtml;

    // Check if pick1 and last are defined before calculating
    if (typeof pick1 !== 'undefined' && typeof last !== 'undefined') {
        $('#pickdrop').text(`1p1d: ${(pick1 + last).toFixed(2)} miles`);
        $('#1p1dM').val((pick1 + last).toFixed(2));
    } else {
        $('#pickdrop').text(`1p1d: Data not available`);
        $('#1p1dM').val('');
    }

    $('#pickupcity').val(destinations[0].name);
    $('#deliverycity').val(lname);
    $('#numstop').val(numberofstops);
    $('#totalstop').val(totalDistance);

    $('#map').show();

    // Initialize DataTable
    $(document).ready(function () {
        var table = $('#myTable').DataTable({
            "order": [] // Disable initial sorting
        });

        $("#myTable tbody").sortable({
            helper: fixHelper,
            items: "tr:not(:first-child)", // Exclude the first row from being sortable
            stop: function (event, ui) {
                var newData = [];
                $('#myTable tbody tr').each(function () {
                    var row = table.row(this).data();
                    newData.push(row);
                });
                table.clear().rows.add(newData).draw();
                console.log('Updated Table Data:', newData);
                recalculateRoute(newData); // Recalculate route based on new data
            }
        }).disableSelection();

        function fixHelper(e, ui) {
            ui.children().each(function () {
                $(this).width($(this).width());
            });
            return ui;
        }
    });
}



async function findShortestPath(directionsService, destinations) {
    const sequence = [destinations[0]];
    let current = destinations[0];
    let remaining = destinations.slice(1);

    while (remaining.length > 0) {
        const destinationPromises = remaining.map(destination => {
            return new Promise((resolve, reject) => {
                directionsService.route({
                    origin: new google.maps.LatLng(current.location.lat, current.location.lng),
                    destination: new google.maps.LatLng(destination.location.lat, destination.location.lng),
                    travelMode: google.maps.TravelMode.DRIVING,
                }, (response, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        resolve({ destination, duration: response.routes[0].legs[0].duration.value });
                    } else {
                        reject(`Directions request failed due to ${status}`);
                    }
                });
            });
        });

        const results = await Promise.all(destinationPromises);
        results.sort((a, b) => a.duration - b.duration);
        const nextPoint = results[0].destination;

        sequence.push(nextPoint);
        current = nextPoint;
        remaining = remaining.filter(dest => dest !== nextPoint);
    }

    return sequence;
}


async function recalculateRoute(newData) {
    const destinationCoordinates = [];

    for (let i = 0; i < newData.length; i++) {
        const coords = await getCoordinatesFromText(newData[i][1]);
        if (coords) {
            destinationCoordinates.push(coords);
        }
    }

    if (destinationCoordinates.length > 0) {
        console.log(destinationCoordinates, 'coordinates');
        const waypoints = destinationCoordinates.map(dest => ({
            location: new google.maps.LatLng(dest.location.lat, dest.location.lng),
            stopover: true
        }));

        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
            origin: waypoints[0].location,
            destination: waypoints[waypoints.length - 1].location,
            waypoints: waypoints.slice(1, -1), // All except the first and last waypoint
            travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                const directionsRenderer = new google.maps.DirectionsRenderer();
                directionsRenderer.setMap(new google.maps.Map(document.getElementById("map")));
                directionsRenderer.setDirections(response);
                updateTable(response.routes[0], destinationCoordinates);
            } else {
                console.error(`Directions request failed due to ${status}`);
            }
        });
    }
}



// Helper function to preserve column widths while dragging
function fixHelper(e, ui) {
    ui.children().each(function () {
        $(this).width($(this).width());
    });
    return ui;
}





























// function mapRoute(waypoints, pickup, destinations) {
//     const map = new google.maps.Map(document.getElementById("map"), {
//         zoom: 4,
//         center: pickup.location,
//     });

//     const directionsService = new google.maps.DirectionsService();
//     const directionsRenderer = new google.maps.DirectionsRenderer();
//     directionsRenderer.setMap(map);

//     findShortestPath(directionsService, pickup, destinations).then(sequence => {
//         waypoints = sequence.slice(1).map(dest => ({
//             location: dest.location,
//             stopover: true
//         }));

//         directionsService.route({
//             origin: sequence[0].location,
//             destination: sequence[sequence.length - 1].location,
//             waypoints: waypoints,
//             travelMode: google.maps.TravelMode.DRIVING,
//         }, (response, status) => {
//             if (status === google.maps.DirectionsStatus.OK) {
//                 directionsRenderer.setDirections(response);
//                 const route = response.routes[0];
//                 updateTable(route, pickup, destinations);
//             } else {
//                 console.error(`Directions request failed due to ${status}`);
//             }
//         });
//     });
// }

// function updateTable(route, pickup, destinations) {
//     const summary = route.legs.reduce((acc, leg) => {
//         acc.totalDistance += leg.distance.value;
//         acc.totalTime += leg.duration.value;
//         return acc;
//     }, { totalDistance: 0, totalTime: 0 });

//     const totalDistance = (summary.totalDistance / 1609.34).toFixed(2); // Convert meters to miles
//     const totalTime = (summary.totalTime / 3600).toFixed(2); // Convert seconds to hours
//     let pick1, last, lname, numberofstops;

//     let resultsHtml = `<h2 class="text-2xl font-semibold mb-4">Results</h2>`;
//     resultsHtml += `<p>Total Distance: ${totalDistance} miles</p>`;
//     resultsHtml += `<p>Total Time: ${totalTime} hours</p>`;
//     resultsHtml += `<p id='pickdrop'>1p1d: miles</p><br>`;
//     resultsHtml += `<h2 class="text-2xl font-semibold mb-4">Routes Delivery Table</h2>`;
//     resultsHtml += `<table id="myTable" class="display"><thead><tr><th>Stop</th><th>Location</th><th>Distance to Next Stop</th><th>Time to Next Stop</th></tr></thead><tbody>`;

//     if (route.legs.length > 0) {
//         const distanceToNextStop = (route.legs[0].distance.value / 1609.34).toFixed(2);
//         const timeToNextStop = (route.legs[0].duration.value / 3600).toFixed(2);
//         resultsHtml += `<tr><td>Pick Up</td><td>${pickup.name}</td><td>${distanceToNextStop} mi</td><td>${timeToNextStop} hours</td></tr>`;
//     }

//     route.legs.forEach((leg, i) => {
//         if (i < destinations.length) {
//             const nextLegDistance = route.legs[i + 1] ? (route.legs[i + 1].distance.value / 1609.34).toFixed(2) : '';
//             const nextLegTime = route.legs[i + 1] ? (route.legs[i + 1].duration.value / 3600).toFixed(2) : '';

//             resultsHtml += `<tr><td>Delivery ${i + 1}</td><td>${destinations[i].name}</td><td>${nextLegDistance ? `${nextLegDistance} mi` : ''}</td><td>${nextLegTime ? `${nextLegTime} hours` : ''}</td></tr>`;

//             if (i === 0) {
//                 pick1 = leg.distance.value / 1609.34;
//             } else if (i === destinations.length - 1) {
//                 last = leg.distance.value / 1609.34;
//                 lname = destinations[i].name;
//             }

//             numberofstops = i + 1;
//         }
//     });

//     resultsHtml += `</tbody></table>`;
//     document.getElementById('results').innerHTML = resultsHtml;

//     $('#pickdrop').show();
//     $('#pickdrop').text(`1p1d: ${(pick1 + last).toFixed(2)} miles`);
//     $('#pickupcity').val(pickup.name);
//     $('#deliverycity').val(lname);
//     $('#1p1dM').val(pick1 + last);
//     $('#numstop').val(numberofstops);
//     $('#totalstop').val(summary.totalDistance / 1609.34);

//     $('#map').show();

//     // Initialize DataTable
//     $(document).ready(function () {
//         var table = $('#myTable').DataTable({
//             "order": [] // Disable initial sorting
//         });

//         $("#myTable tbody").sortable({
//             helper: fixHelper,
//             items: "tr:not(:first-child)", // Exclude the first row from being sortable
//             stop: function (event, ui) {
//                 var newData = [];
//                 $('#myTable tbody tr').each(function () {
//                     var row = table.row(this).data();
//                     newData.push(row);
//                 });
//                 table.clear().rows.add(newData).draw();
//                 console.log('Updated Table Data:', newData);
//                 recalculateRoute(newData); // Recalculate route based on new data
//             }
//         }).disableSelection();

//         function fixHelper(e, ui) {
//             ui.children().each(function () {
//                 $(this).width($(this).width());
//             });
//             return ui;
//         }
//     });
// }

// async function findShortestPath(directionsService, start, destinations) {
//     const sequence = [start];
//     let current = start;
//     let remaining = [...destinations];

//     while (remaining.length > 0) {
//         const destinationPromises = remaining.map(destination => {
//             return new Promise((resolve, reject) => {
//                 directionsService.route({
//                     origin: current.location,
//                     destination: destination.location,
//                     travelMode: google.maps.TravelMode.DRIVING,
//                 }, (response, status) => {
//                     if (status === google.maps.DirectionsStatus.OK) {
//                         resolve({ destination, duration: response.routes[0].legs[0].duration.value });
//                     } else {
//                         reject(`Directions request failed due to ${status}`);
//                     }
//                 });
//             });
//         });

//         const results = await Promise.all(destinationPromises);
//         results.sort((a, b) => a.duration - b.duration);
//         const nextPoint = results[0].destination;

//         sequence.push(nextPoint);
//         current = nextPoint;
//         remaining = remaining.filter(dest => dest !== nextPoint);
//     }

//     return sequence;
// }

// async function recalculateRoute(newData) {
//     const pickup = await getCoordinates();
//     let destinationCoordinates = [];

//     for (let i = 1; i < newData.length; i++) {
//         const coords = await getCoordinatesFromText(newData[i][1]);
//         if (coords) {
//             destinationCoordinates.push(coords);
//         }
//     }
    
//     if (pickup && destinationCoordinates.length > 0) {
//         console.log(destinationCoordinates, 'coordinates');
//         const waypoints = destinationCoordinates.map(dest => ({
//             location: new google.maps.LatLng(dest.location.lat, dest.location.lng),
//             stopover: true
//         }));

//         const directionsService = new google.maps.DirectionsService();
//         directionsService.route({
//             origin: new google.maps.LatLng(pickup.location.lat, pickup.location.lng),
//             destination: waypoints[waypoints.length - 1].location,
//             waypoints: waypoints.slice(0, -1), // All except the last waypoint
//             travelMode: google.maps.TravelMode.DRIVING,
//         }, (response, status) => {
//             if (status === google.maps.DirectionsStatus.OK) {
//                 const directionsRenderer = new google.maps.DirectionsRenderer();
//                 directionsRenderer.setMap(new google.maps.Map(document.getElementById("map")));
//                 directionsRenderer.setDirections(response);
//                 updateTable(response.routes[0], pickup, destinationCoordinates);
//             } else {
//                 console.error(`Directions request failed due to ${status}`);
//             }
//         });
//     }
// }



// function mapRoute(waypoints, pickup, destinations) {
//     const map = new google.maps.Map(document.getElementById("map"), {
//         zoom: 4,
//         center: pickup.location,
//     });

//     const directionsService = new google.maps.DirectionsService();
//     const directionsRenderer = new google.maps.DirectionsRenderer();
//     directionsRenderer.setMap(map);

//     findShortestPath(directionsService, pickup, destinations).then(sequence => {
//         waypoints = sequence.slice(1).map(dest => ({
//             location: dest.location,
//             stopover: true
//         }));

//         directionsService.route({
//             origin: sequence[0].location,
//             destination: sequence[sequence.length - 1].location,
//             waypoints: waypoints,
//             travelMode: google.maps.TravelMode.DRIVING,
//         }, (response, status) => {
//             if (status === google.maps.DirectionsStatus.OK) {
//                 directionsRenderer.setDirections(response);
//                 const route = response.routes[0];
//                 const summary = route.legs.reduce((acc, leg) => {
//                     acc.totalDistance += leg.distance.value;
//                     acc.totalTime += leg.duration.value;
//                     return acc;
//                 }, { totalDistance: 0, totalTime: 0 });

//                 const totalDistance = (summary.totalDistance / 1609.34); // Convert meters to miles
//                 const totalTime = (summary.totalTime / 3600).toFixed(2); // Convert seconds to hours
//                 let pick1, last, lname, numberofstops;

//                 let resultsHtml = `<h2 class="text-2xl font-semibold mb-4">Results</h2>`;
//                 resultsHtml += `<p>Total Distance: ${totalDistance} miles</p>`;
//                 resultsHtml += `<p>Total Time: ${totalTime} hours</p>`;
//                 resultsHtml += `<p id='pickdrop'>1p1d: miles</p><br>`;
//                 resultsHtml += `<h2 class="text-2xl font-semibold mb-4">Routes Delivery Table</h2>`;
//                 resultsHtml += `<table id="myTable" class="display"><thead><tr><th>Stop</th><th>Location</th><th>Distance to Next Stop</th><th>Time to Next Stop</th></tr></thead><tbody>`;

//                 if (route.legs.length > 0) {
//                     const distanceToNextStop = (route.legs[0].distance.value / 1609.34).toFixed(2);
//                     const timeToNextStop = (route.legs[0].duration.value / 3600).toFixed(2);
//                     resultsHtml += `<tr><td>Pick Up</td><td>${pickup.name}</td><td>${distanceToNextStop} mi</td><td>${timeToNextStop} hours</td></tr>`;
//                 }

//                 route.legs.forEach((leg, i) => {
//                     if (i < destinations.length) {
//                         const nextLegDistance = route.legs[i + 1] ? (route.legs[i + 1].distance.value / 1609.34).toFixed(2) : '';
//                         const nextLegTime = route.legs[i + 1] ? (route.legs[i + 1].duration.value / 3600).toFixed(2) : '';

//                         resultsHtml += `<tr><td>Delivery ${i + 1}</td><td>${destinations[i].name}</td><td>${nextLegDistance ? `${nextLegDistance} mi` : ''}</td><td>${nextLegTime ? `${nextLegTime} hours` : ''}</td></tr>`;

//                         if (i === 0) {
//                             pick1 = leg.distance.value / 1609.34;
//                         } else if (i === destinations.length - 1) {
//                             last = leg.distance.value / 1609.34;
//                             lname = destinations[i].name;
//                         }

//                         numberofstops = i + 1;
//                     }
//                 });

//                 resultsHtml += `</tbody></table>`;
//                 document.getElementById('results').innerHTML = resultsHtml;

//                 $('#pickdrop').show();
//                 $('#pickdrop').text(`1p1d: ${(pick1 + last).toFixed(2)} miles`);
//                 $('#pickupcity').val(pickup.name);
//                 $('#deliverycity').val(lname);
//                 $('#1p1dM').val(pick1 + last);
//                 $('#numstop').val(numberofstops);
//                 $('#totalstop').val(summary.totalDistance / 1609.34);

//                 $('#map').show();

//                 // Initialize DataTable
//                 $(document).ready(function () {
//                     var table = $('#myTable').DataTable({
//                         "order": [] // Disable initial sorting
//                     });

//                     $("#myTable tbody").sortable({
//                         helper: fixHelper,
//                         items: "tr:not(:first-child)", // Exclude the first row from being sortable
//                         stop: function (event, ui) {
//                             var newData = [];
//                             $('#myTable tbody tr').each(function () {
//                                 var row = table.row(this).data();
//                                 newData.push(row);
//                             });
//                             table.clear().rows.add(newData).draw();
//                             console.log('Updated Table Data:', newData);
//                             recalculateRoute(newData); // Recalculate route based on new data
//                         }
//                     }).disableSelection();

//                     function fixHelper(e, ui) {
//                         ui.children().each(function () {
//                             $(this).width($(this).width());
//                         });
//                         return ui;
//                     }
//                 });
//             } else {
//                 console.error(`Directions request failed due to ${status}`);
//             }
//         });
//     });
// }
// async function findShortestPath(directionsService, start, destinations) {
//     const sequence = [start];
//     let current = start;
//     let remaining = [...destinations];

//     while (remaining.length > 0) {
//         const destinationPromises = remaining.map(destination => {
//             return new Promise((resolve, reject) => {
//                 directionsService.route({
//                     origin: current.location,
//                     destination: destination.location,
//                     travelMode: google.maps.TravelMode.DRIVING,
//                 }, (response, status) => {
//                     if (status === google.maps.DirectionsStatus.OK) {
//                         resolve({ destination, duration: response.routes[0].legs[0].duration.value });
//                     } else {
//                         reject(`Directions request failed due to ${status}`);
//                     }
//                 });
//             });
//         });

//         const results = await Promise.all(destinationPromises);
//         results.sort((a, b) => a.duration - b.duration);
//         const nextPoint = results[0].destination;

//         sequence.push(nextPoint);
//         current = nextPoint;
//         remaining = remaining.filter(dest => dest !== nextPoint);
//     }

//     return sequence;
// }

// async function recalculateRoute(newData) {
//     const pickup = await getCoordinates();
//     let destinationCoordinates = [];

//     for (let i = 1; i < newData.length; i++) {
//         const coords = await getCoordinatesFromText(newData[i][1]);
//         if (coords) {
//             destinationCoordinates.push(coords);
//         }
//     }
    

//     if (pickup && destinationCoordinates.length > 0) {
//       console.log(destinationCoordinates, 'coordinates')
//         const waypoints = destinationCoordinates.map(dest => (
//           { 
//             location: new google.maps.LatLng(dest.location.lat, dest.location.lng),
//             stopover: true
//           }
//       )
//       );
       
//         const directionsService = new google.maps.DirectionsService();
//         directionsService.route({
//             origin: new google.maps.LatLng(pickup.location.lat, pickup.location.lng),
//             destination: waypoints[waypoints.length - 1].location,
//             waypoints: waypoints.slice(0, -1), // All except the last waypoint
//             travelMode: google.maps.TravelMode.DRIVING,
//         }, (response, status) => {
//             if (status === google.maps.DirectionsStatus.OK) {
//                 const directionsRenderer = new google.maps.DirectionsRenderer();
//                 directionsRenderer.setMap(new google.maps.Map(document.getElementById("map")));
//                 directionsRenderer.setDirections(response);
//             } else {
//                 console.error(`Directions request failed due to ${status}`);
//             }
//         });
//     }
// }



// function mapRoutes(waypoints, pickup, destinations) {
  

//   const request = {
//     origin: waypoints[0],
//     destination: waypoints[waypoints.length - 1],
//     waypoints: waypoints.slice(1, -1).map(location => ({ location, stopover: true })),
//     travelMode: 'DRIVING'
//   };
//   console.log(request);
//   // directionsService.route(request, function(result, status) {
//   //   if (status == 'OK') {
//   //     directionsRenderer.setDirections(result);

//   //     const route = result.routes[0];
//   //     const summary = route.legs.reduce((acc, leg) => {
//   //       acc.totalDistance += leg.distance.value;
//   //       acc.totalTime += leg.duration.value;
//   //       return acc;
//   //     }, { totalDistance: 0, totalTime: 0 });

//   //     const totalDistance = (summary.totalDistance / 1609.34); // Convert meters to miles
//   //     const totalTime = (summary.totalTime / 3600).toFixed(2); // Convert seconds to hours
//   //     let pick1;
//   //     let last;
//   //     let pickname = pickup.label; let lname; let numberofstops;


//   //     let resultsHtml = `<h2 class="text-2xl font-semibold mb-4">Results</h2>`;
//   //     resultsHtml += `<p>Total Distance: ${totalDistance} miles</p>`;
//   //     resultsHtml += `<p>Total Time: ${totalTime} hours</p>`;
//   //     resultsHtml += `<p id='pickdrop' >1p1d: miles</p><br>`;
//   //     resultsHtml += `<h2 class="text-2xl font-semibold mb-4">Routes Delivery Table</h2>`;
//   //     resultsHtml += `<table id="myTable" class="display"><thead><tr><th>Stop</th><th>Location</th><th>Distance to Next Stop</th><th>Time to Next Stop</th></tr></thead><tbody>`;

//   //     if (route.legs.length > 0) {
//   //       const distanceToNextStop = (route.legs[0].distance.value / 1609.34).toFixed(2);
//   //       const timeToNextStop = (route.legs[0].duration.value / 3600).toFixed(2);
//   //       resultsHtml += `<tr><td>Pick Up</td><td>${pickup.name}</td><td>${distanceToNextStop} mi</td><td>${timeToNextStop} hours</td></tr>`;
//   //     }


//   //     route.legs.forEach((leg, i) => {
//   //       if (i < destinations.length) {
//   //           const nextLegDistance = route.legs[i + 1] ? (route.legs[i + 1].distance.value / 1609.34).toFixed(2) : '';
//   //           const nextLegTime = route.legs[i + 1] ? (route.legs[i + 1].duration.value / 3600).toFixed(2) : '';

//   //           resultsHtml += `<tr><td>Delivery ${i + 1}</td><td>${destinations[i].name}</td><td>${nextLegDistance ? `${nextLegDistance} mi` : ''}</td><td>${nextLegTime ? `${nextLegTime} hours` : ''}</td></tr>`;

//   //           if (i === 0) {
//   //               pick1 = leg.distance.value / 1609.34;
//   //           } else if (i === destinations.length - 1) {
//   //               last = leg.distance.value / 1609.34;
//   //               lname = destinations[i].name;
//   //           }

//   //           numberofstops = i + 1;
//   //       }
//   //     });
      
//   //     resultsHtml += `</tbody></table>`;
//   //     document.getElementById('results').innerHTML = resultsHtml;

//   //     $('#pickdrop').show();
//   //     $('#pickdrop').text(`1p1d: ${(pick1+last).toFixed(2)} miles`);
//   //     $('#pickupcity').val(pickname);
//   //     $('#deliverycity').val(lname);
//   //     $('#1p1dM').val(pick1+last);
//   //     $('#numstop').val(numberofstops);
//   //     $('#totalstop').val(summary.totalDistance / 1609.34);

//   //     // Initialize DataTable
//   //     $(document).ready(function () {
//   //       var table = $('#myTable').DataTable({
//   //         "order": [] // Disable initial sorting
//   //       });

//   //       $("#myTable tbody").sortable({
//   //         helper: fixHelper,
//   //         stop: function (event, ui) {
//   //           var newData = [];
//   //           $('#myTable tbody tr').each(function () {
//   //             var row = table.row(this).data();
//   //             newData.push(row);
//   //           });
//   //           table.clear().rows.add(newData).draw();
//   //           recalculateRoute(newData); // Recalculate route based on new data
//   //           console.log('Updated Table Data:', newData);
//   //         }
//   //       }).disableSelection();

//   //       function fixHelper(e, ui) {
//   //         ui.children().each(function () {
//   //           $(this).width($(this).width());
//   //         });
//   //         return ui;
//   //       }
//   //     });
//   //   }
//   // });
// }



