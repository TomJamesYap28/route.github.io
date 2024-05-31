let map;
let directionsService;
let directionsRenderer;
let googleapikey = 'AIzaSyA3r0p1kyloJSECy3wk1tUQS8cAyTomxfY';


(function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleapikey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API script'));
      document.head.appendChild(script);
      
    });
    
  })();

function savemapasimage(){
    html2canvas(document.getElementById("map"), {
        useCORS: true,
        onrendered: function (canvas) {
            var img = canvas.toDataURL("image/png");
            img = img.replace('data:image/png;base64,', '');
            var finalImageSrc = 'data:image/png;base64,' + img;
            $('#googlemapbinary').attr('src', finalImageSrc);
         }
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

async function ecalculate() {
  document.getElementById('loading').style.display = 'block';
  const pickup = await getCoordinates();
  const destinations = document.getElementById('destinations').value.split('\n');
  
  let destinationCoordinates = [];

  for (let destination of destinations) {
    const coords = await getCoordinatesFromText(destination);
    if (coords) {
      destinationCoordinates.push(coords);
    }
  }
  if (pickup && destinationCoordinates.length > 0) {
    const waypoints = [new google.maps.LatLng(pickup.location[0], pickup.location[1])];
    for (let dest of destinationCoordinates) {
      waypoints.push(new google.maps.LatLng(dest.location[0], dest.location[1]));
    }
    mapRoute(waypoints, pickup, destinationCoordinates);
  }

  
}

function rcalculate() {
  const mileage1p1d = parseFloat(document.getElementById('1p1dM').value.replace(/,/g, ''));
  const rate1p1d = parseFloat(document.getElementById('1p1dR').value);
  const assistCost = parseFloat(document.getElementById('assistcost').value) || 200;
  const numStops = parseInt(document.getElementById('numstop').value);
  const totalStopMiles = parseFloat(document.getElementById('totalstop').value.replace(/,/g, ''));
  const rpmAdd = parseFloat(document.getElementById('rpmadd').value) || 2.25;
  const additionalRate = parseFloat(document.getElementById('addrate').value) || 100;
  const markup = parseFloat(document.getElementById('markup').value) || 20;

  // Formula Calculations
  const additionalMiles = totalStopMiles - mileage1p1d;
  const totalCost = rate1p1d + (additionalMiles * rpmAdd) + (additionalRate * (numStops - 1)) + assistCost;
  const totalRateCustomer = totalCost * (1 + markup / 100);

  // Formatting with thousands separator and rounding to nearest whole number
  const formatNumber = (num) => num.toLocaleString(undefined, { maximumFractionDigits: 0 });

//document.getElementById('additionalMiles').value = formatNumber(additionalMiles);
  document.getElementById('totalCost').value = `$${formatNumber(totalCost)}`;
  document.getElementById('totalRateCustomer').value = `$${formatNumber(totalRateCustomer)}`;

  document.querySelector('.results').style.display = 'block';
}

async function reset(){
  location.reload();
}
function mapRoute(waypoints, pickup, destinations) {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: pickup.location,
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    findShortestPath(directionsService, pickup, destinations).then(sequence => {
        waypoints = sequence.slice(1, sequence.length - 1).map(dest => ({
            location: dest.location,
            stopover: true
        }));

        // Calculate distance between first and last locations
        calculateDistance(sequence[0].location, sequence[sequence.length - 1].location).then(distance => {
            $('#1p1dM').val((distance).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
            
            directionsService.route({
                origin: sequence[0].location,
                destination: sequence[sequence.length - 1].location,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
            }, (response, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(response);
                    const route = response.routes[0];
                    updateTable(route, pickup, sequence);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            });
        }).catch(error => {
            console.error(`Error calculating distance: ${error}`);
        });
    }).catch(error => {
        console.error(`Error finding shortest path: ${error}`);
    });
}

async function calculateDistance(firstLocation, lastLocation) {
    const directionsService = new google.maps.DirectionsService();

    return new Promise((resolve, reject) => {
        directionsService.route({
            origin: firstLocation,
            destination: lastLocation,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                const route = response.routes[0];
                const distance = route.legs[0].distance.value / 1609.34; // Convert meters to miles
                resolve(distance);
            } else {
                reject(`Directions request failed due to ${status}`);
            }
        });
    });
}



async function findShortestPath(directionsService, start, destinations) {
    const sequence = [start];
    let current = start;
    let remaining = [...destinations];

    while (remaining.length > 0) {
        const destinationPromises = remaining.map(destination => {
            return new Promise((resolve, reject) => {
                directionsService.route({
                    origin: current.location,
                    destination: destination.location,
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

        try {
            const results = await Promise.all(destinationPromises);
            results.sort((a, b) => a.duration - b.duration);
            const nextPoint = results[0].destination;

            sequence.push(nextPoint);
            current = nextPoint;
            remaining = remaining.filter(dest => dest !== nextPoint);
        } catch (error) {
            console.error(`Error processing route: ${error}`);
            break;
        }
    }

    return sequence;
}


function updateTable(route, pickup, sequence) {
    const summary = route.legs.reduce((acc, leg) => {
        acc.totalDistance += leg.distance.value;
        acc.totalTime += leg.duration.value;
        return acc;
    }, { totalDistance: 0, totalTime: 0 });

    const totalDistance = (summary.totalDistance / 1609.34).toFixed(0);
    const totalTime = formatSecondsToTime((summary.totalTime / 3600)* 3600);
    let pick1, last = 0, lname, numberofstops;
    const formatNumber = (num) => num.toLocaleString(undefined, { maximumFractionDigits: 0 });

    let resultsHtml = `<h2 class="text-2xl font-semibold mb-4">Results</h2>`;
    resultsHtml += `<p>Total Distance: ${totalDistance.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} miles</p>`;
    resultsHtml += `<p>Total Drive Time: ${totalTime} </p>`;
    resultsHtml += `<h2 class="text-2xl font-semibold mb-4">Routes Delivery Table</h2>`;
    resultsHtml += `<table id="myTable" class="display"><thead><tr><th>Stop</th><th>Location</th><th>Distance to Next Stop</th><th>Time to Next Stop</th></tr></thead><tbody>`;

    if (route.legs.length > 0) {
        const distanceToNextStop = (route.legs[0].distance.value / 1609.34).toFixed(2);
        const timeToNextStop = (route.legs[0].duration.value / 3600).toFixed(2);
        resultsHtml += `<tr><td>Pick Up</td><td>${pickup.name}</td><td>${distanceToNextStop} mi</td><td>${formatSecondsToTime(timeToNextStop * 3600)}</td></tr>`;
    }

    route.legs.forEach((leg, i) => {
        if (i < sequence.length - 1) {
            const nextLegDistance = route.legs[i + 1] ? (route.legs[i + 1].distance.value / 1609.34).toFixed(2) : '';
            const nextLegTime = route.legs[i + 1] ? (route.legs[i + 1].duration.value / 3600) : '';

            resultsHtml += `<tr><td>Delivery ${i + 1}</td><td>${sequence[i + 1].name}</td><td>${nextLegDistance > 0 ? `${nextLegDistance} mi` : ''}</td><td>${nextLegTime ? `${formatSecondsToTime(nextLegTime * 3600)} ` : ''}</td></tr>`;
            if (i === 0) {
                pick1 = leg.distance.value / 1609.34;
            } else if (i === sequence.length - 2) {
                lname = sequence[i + 1].name;
            }
            numberofstops = i + 1;
        }
    });

    resultsHtml += `</tbody></table>`;
    document.getElementById('results').innerHTML = resultsHtml;

    $('#loading').hide();
    $('#numstop').val((numberofstops).toFixed(0));
    $('#totalstop').val(((summary.totalDistance / 1609.34).toFixed(0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    $('#additionalMiles').val(((parseFloat(($('#totalstop').val()).replace(/[,]/g, "")) - parseFloat(($('#1p1dM').val()).replace(/[,]/g, ""))).toFixed(0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

    $('#map').show();

    $(document).ready(function () {
        var table = $('#myTable').DataTable({
            "order": [],
            "paging": false,
            "searching": false,
            "info": false
        });

        $("#myTable tbody").sortable({
            helper: fixHelper,
            stop: function (event, ui) {
                var newData = [];
                $('#myTable tbody tr').each(function () {
                    var row = table.row(this).data();
                    newData.push(row);
                });
                const draggedIndex = ui.item.index(); // Get the index of the dragged row
                table.clear().rows.add(newData).draw();
                recalculateRoute(newData, draggedIndex); // Pass the dragged index to recalculateRoute
                console.log('Updated Table Data:', newData);
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


async function recalculateRoute(newData, draggedIndex) {
    $('#loading').show();
    const fixedPart = newData.slice(0, draggedIndex + 1);
    const recalculatingPart = newData.slice(draggedIndex + 1);

    const fixedCoordinates = [];
    const recalculatingCoordinates = [];

    for (let i = 0; i <= draggedIndex; i++) {
        const coords = await getCoordinatesFromText(fixedPart[i][1]);
        if (coords) {
            fixedCoordinates.push({
                location: new google.maps.LatLng(coords.location.lat, coords.location.lng),
                name: fixedPart[i][1]
            });
        }
    }

    for (let i = draggedIndex + 1; i < newData.length; i++) {
        const coords = await getCoordinatesFromText(recalculatingPart[i - (draggedIndex + 1)][1]);
        if (coords) {
            recalculatingCoordinates.push({
                location: new google.maps.LatLng(coords.location.lat, coords.location.lng),
                name: recalculatingPart[i - (draggedIndex + 1)][1]
            });
        }
    }

    if (fixedCoordinates.length > 0 && recalculatingCoordinates.length > 0) {
        const directionsService = new google.maps.DirectionsService();

        findShortestPath(directionsService, fixedCoordinates[fixedCoordinates.length - 1], recalculatingCoordinates)
            .then(sequence => {
                const combinedSequence = fixedCoordinates.concat(sequence.slice(1));
                const waypoints = combinedSequence.slice(1).map(dest => ({
                    location: dest.location,
                    stopover: true
                }));

                calculateDistance(combinedSequence[0].location, combinedSequence[combinedSequence.length - 1].location).then(distance => {
                    $('#1p1dM').val((distance).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                    // Store this distance in a variable or use it as needed

                    directionsService.route({
                        origin: combinedSequence[0].location,
                        destination: combinedSequence[combinedSequence.length - 1].location,
                        waypoints: waypoints.slice(0, -1), // All except the last waypoint
                        travelMode: google.maps.TravelMode.DRIVING,
                    }, (response, status) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            const directionsRenderer = new google.maps.DirectionsRenderer();
                            directionsRenderer.setMap(new google.maps.Map(document.getElementById("map")));
                            directionsRenderer.setDirections(response);
                            updateTable(response.routes[0], { name: newData[0][1], location: fixedCoordinates[0].location }, combinedSequence);
                        } else {
                            console.error(`Directions request failed due to ${status}`);
                        }
                    });
                }).catch(error => {
                    console.error(`Error calculating distance: ${error}`);
                });
            });
    } else {
        $('#loading').hide();
        alert("No valid coordinates found for recalculating route.");
    }
}

function formatSecondsToTime(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = (seconds % 60).toFixed(0);
    hrs = hrs < 10 ? '0' + hrs : hrs;
    mins = mins < 10 ? '0' + mins : mins;
    secs = secs < 10 ? '0' + secs : secs;
    return hrs + ' hours ' + mins + ' mins';
}