const destinations = [
    
    { name: "Chicago, IL", location: { lat: 41.8781, lng: -87.6298 } },
    { name: "Boston, MA", location: { lat: 42.3601, lng: -71.0589 } },
    { name: "Houston, TX", location: { lat: 29.7604, lng: -95.3698 } },
    { name: "Charleston, WV", location: { lat: 38.3498, lng: -81.6326 } },
    { name: "Nashville, TN", location: { lat: 36.1627, lng: -86.7816 } }
];

const startPoint = { name: "Dallas, TX", location: { lat: 32.7767, lng: -96.7970 } };

function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: startPoint.location,
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    findShortestPath(directionsService, startPoint, destinations).then(sequence => {
        const waypoints = sequence.slice(1).map(dest => ({
            location: dest.location,
            stopover: true
        }));

        directionsService.route({
            origin: sequence[0].location,
            destination: sequence[sequence.length - 1].location,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
            } else {
                console.error(`Directions request failed due to ${status}`);
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

        const results = await Promise.all(destinationPromises);
        results.sort((a, b) => a.duration - b.duration);
        const nextPoint = results[0].destination;

        sequence.push(nextPoint);
        current = nextPoint;
        remaining = remaining.filter(dest => dest !== nextPoint);
    }

    return sequence;
}

window.initMap = initMap;
