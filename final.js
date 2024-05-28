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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleapikey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API script'));
      document.head.appendChild(script);
    });
  }


 async function getCoordinates() {
      const pickup = $('#pickup').val()
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pickup)}&key=${googleapikey}`;

      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const place = data.results[0].formatted_address;
          const coordinates = data.results[0].geometry.location;
          console.log(`Place: ${place}`);
          console.log(`Coordinates: Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}`);
          return { label: place, coords: [coordinates.lat, coordinates.lng] };
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
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeInput)}&key=AIzaSyA3r0p1kyloJSECy3wk1tUQS8cAyTomxfY`;

      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const place = data.results[0].formatted_address;
          const coordinates = data.results[0].geometry.location;
          console.log(`Place: ${place}`);
          console.log(`Coordinates: Latitude: ${coordinates.lat}, Longitude: ${coordinates.lng}`);
          return { label: place, coords: [coordinates.lat, coordinates.lng] };
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
    const waypoints = [new google.maps.LatLng(pickup.coords[0], pickup.coords[1])];
    for (let dest of destinationCoordinates) {
      waypoints.push(new google.maps.LatLng(dest.coords[0], dest.coords[1]));
    }
    mapRoute(waypoints, pickup, destinationCoordinates);
  }
}

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

function mapRoute(waypoints, pickup, destinations) {
  if (!map) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: waypoints[0],
      zoom: 13
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
  }

  const request = {
    origin: waypoints[0],
    destination: waypoints[waypoints.length - 1],
    waypoints: waypoints.slice(1, -1).map(location => ({ location, stopover: true })),
    travelMode: 'DRIVING'
  };

  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      directionsRenderer.setDirections(result);

      const route = result.routes[0];
      const summary = route.legs.reduce((acc, leg) => {
        acc.totalDistance += leg.distance.value;
        acc.totalTime += leg.duration.value;
        return acc;
      }, { totalDistance: 0, totalTime: 0 });

      const totalDistance = (summary.totalDistance / 1609.34); // Convert meters to miles
      const totalTime = (summary.totalTime / 3600).toFixed(2); // Convert seconds to hours
      let pick1;
      let last;
      let pickname = pickup.label; let lname; let numberofstops;


      let resultsHtml = `<p>Total Distance: ${totalDistance} miles</p>`;
      resultsHtml += `<p>Total Time: ${totalTime} hours</p>`;
      resultsHtml += `<p id='pickdrop' >1p1d: miles</p>`;
      resultsHtml += `<table id="myTable" class="display"><thead><tr><th>Stop</th><th>Location</th><th>Distance to Next Stop</th><th>Time to Next Stop</th></tr></thead><tbody>`;

      if (route.legs.length > 0) {
        const distanceToNextStop = (route.legs[0].distance.value / 1609.34).toFixed(2);
        const timeToNextStop = (route.legs[0].duration.value / 3600).toFixed(2);
        resultsHtml += `<tr><td>Pick Up</td><td>${pickup.label}</td><td>${distanceToNextStop} mi</td><td>${timeToNextStop} hours</td></tr>`;
      }


      route.legs.forEach((leg, i) => {
        if (i < destinations.length) {
            const nextLegDistance = route.legs[i + 1] ? (route.legs[i + 1].distance.value / 1609.34).toFixed(2) : '';
            const nextLegTime = route.legs[i + 1] ? (route.legs[i + 1].duration.value / 3600).toFixed(2) : '';

            resultsHtml += `<tr><td>Delivery ${i + 1}</td><td>${destinations[i].label}</td><td>${nextLegDistance ? `${nextLegDistance} mi` : ''}</td><td>${nextLegTime ? `${nextLegTime} hours` : ''}</td></tr>`;

            if (i === 0) {
                pick1 = leg.distance.value / 1609.34;
            } else if (i === destinations.length - 1) {
                last = leg.distance.value / 1609.34;
                lname = destinations[i].label;
            }

            numberofstops = i + 1;
        }
      });
      
      resultsHtml += `</tbody></table>`;
      document.getElementById('results').innerHTML = resultsHtml;

      $('#pickdrop').show();
      $('#pickdrop').text(`1p1d: ${(pick1+last).toFixed(2)} miles`);
      $('#pickupcity').val(pickname);
      $('#deliverycity').val(lname);
      $('#1p1dM').val(pick1+last);
      $('#numstop').val(numberofstops);
      $('#totalstop').val(summary.totalDistance / 1609.34);

      // Initialize DataTable
      $(document).ready(function () {
        var table = $('#myTable').DataTable({
          "order": [] // Disable initial sorting
        });

        $("#myTable tbody").sortable({
          helper: fixHelper,
          stop: function (event, ui) {
            var newData = [];
            $('#myTable tbody tr').each(function () {
              var row = table.row(this).data();
              newData.push(row);
            });
            table.clear().rows.add(newData).draw();
            recalculateRoute(newData); // Recalculate route based on new data
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
  });
}

async function recalculateRoute(newData) {
  const pickup = await getCoordinates();
  let destinationCoordinates = [];

  for (let i = 1; i < newData.length; i++) {
    const coords = await getCoordinatesFromText(newData[i][1]);
    if (coords) {
      destinationCoordinates.push(coords);
    }
  }

  if (pickup && destinationCoordinates.length > 0) {
    const waypoints = [new google.maps.LatLng(pickup.coords[0], pickup.coords[1])];
    for (let dest of destinationCoordinates) {
      waypoints.push(new google.maps.LatLng(dest.coords[0], dest.coords[1]));
    }
    mapRoute(waypoints, pickup, destinationCoordinates);
  }
}
