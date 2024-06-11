import { db, auth, storage } from '../js/firebase.js';
import { onAuthStateChanged } from '../node_modules/firebase/firebase-auth.js';
import { doc, collection, collectionGroup, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, increment, query, where, orderBy, startAt, endAt, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "../node_modules/firebase/firebase-storage.js";
import { blockNonAdmins, capitalizeFirstLetter, parseButtonAction, showModal, hideModal, resetValidation, invalidate } from '../js/utils.js';

let directionsDisplay = null;
const ridesContainer = document.querySelector("#ridesContainer");
const menuFilter = document.querySelector('#menuFilter');
const etSearchId = document.querySelector('#etSearchId');
const btnSearchId = document.querySelector('#btnSearchId');

const btnActiveRides = document.querySelector('#btnActiveRides');
const btnRidesArchive = document.querySelector('#btnRidesArchive');

const etMinimumFare = document.querySelector("#etMinimumFare");
const etRatePerExtraKm = document.querySelector("#etRatePerExtraKm");
const btnSaveRates = document.querySelector("#btnSaveRates");

etMinimumFare.addEventListener("input", () => {
	btnSaveRates.classList.toggle("d-none", false);
});

etRatePerExtraKm.addEventListener("input", () => {
	btnSaveRates.classList.toggle("d-none", false);
});

btnSaveRates.addEventListener("click", () => {
	btnSaveRates.classList.toggle("d-none", true);

	updateDoc(doc(db, "rates", "rates"), {
		minimumFare: Number(etMinimumFare.value),
		extraFarePerKm: Number(etRatePerExtraKm.value)
	});
})

btnActiveRides.addEventListener("click", () => {
	getRides();
});

btnRidesArchive.addEventListener("click", () => {
	getRides();
});

// function initGoogleMapsAPI(){
//   const element = document.createElement("script");
//   element.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDi67EqoPXOjXwKYW2Q-Ehc2Mif_cMGLKM&callback=initMap";
//   document.body.appendChild(element);
// }

// window.addEventListener("DOMContentLoaded",initGoogleMapsAPI,false);

let unsubRidesListener = null;

onAuthStateChanged(auth, user => {
	blockNonAdmins(user);
});

window.addEventListener("load", function() {
	getRides();
	getRates();
});

btnSearchId.addEventListener("click", function() {
	if (unsubRidesListener != null) {
		unsubRidesListener();
	}

	getRides();
});

function getRates() {
	// get minimum fare
	onSnapshot(doc(db, "rates", "rates"), (rates) => {
		if (rates.data() == null) {
			return;
		}
		const minFare = rates.data().minimumFare;
		const extraFarePerKm = rates.data().extraFarePerKm;

		etMinimumFare.value = minFare;
		etRatePerExtraKm.value = extraFarePerKm;
	});
}

function getRides() {
	const filter = menuFilter.value;
	const searchKey = etSearchId.value;
	const tab = btnActiveRides.checked==true?"active":"archive";
	let statuses = tab=="active"?["en_route_pickup", "en_route_destination"]:["completed", "cancelled"];

	let qryRides = null;
	
	if (!searchKey) {
		qryRides = query(collection(db, "rides"), where("status", "in", statuses));
	}
	else {
		if (filter == "Ride ID") {
			console.log("Filter: Ride ID");
			qryRides = query(collection(db, "rides"), where("uid", "==", searchKey), where("status", "in", statuses));
		}
		else if (filter == "Passenger ID") {
			console.log("Filter: Passenger ID");
			qryRides = query(collection(db, "rides"), where("userUid", "==", searchKey), where("status", "in", statuses));
		}
		else if (filter == "Rider ID") {
			console.log("Filter: Rider ID");
			qryRides = query(collection(db, "rides"), where("riderUid", "==", searchKey), where("status", "in" , statuses));
		}
	}
	
	unsubRidesListener = onSnapshot(qryRides, (snapRides) => {
		// clear table
		ridesContainer.innerHTML = '';
		if (snapRides.size == 0) {
			document.querySelector("#tvEmptyActiveRides").classList.toggle("d-none", false);
		}
		else {
			document.querySelector("#tvEmptyActiveRides").classList.toggle("d-none", true);
		}

		snapRides.forEach(product => {
      renderRides(
				product.id,
				product.data().userUid,
				product.data().riderUid,
				product.data().userLocation,
				product.data().destination,
				product.data().distance,
				product.data().duration,
				product.data().modesOfTransport,
				product.data().status,
				product.data().timestampEnd,
				product.data().timestampStart
			);
    });
	});
}

function renderRides(id, passengerUid, riderUid, userLocation, destination, distance, duration, modesOfTransport, status, timestampEnd, timestampStart) {
	const cardContainer = document.createElement('div');
		const card = document.createElement('div');
			const cardHeader = document.createElement('div');
				const tvId = document.createElement('p');
				const cardHeaderLeft = document.createElement('div');
					const tvRoute = document.createElement('h5');
				const cardHeaderRight = document.createElement('div');
					const divTimestamp = document.createElement('div');
						const tvTimestamp = document.createElement('div');
					const divStatus = document.createElement('p');
						const tvStatus = document.createElement('p');
					const divButtonContainer = document.createElement('div');
						const btnAction = document.createElement('button');
			const cardBody = document.createElement('div');
				const cardBodyLeft = document.createElement('div');
					const tvDistanceAndDuration = document.createElement('p');
				const cardBodyRight = document.createElement('div');
					const tvPassengerName = document.createElement('h6');
					const tvPassengerId = document.createElement('p');
					const tvRiderName = document.createElement('h6');
					const tvRiderId = document.createElement('p');
			const cardFooter = document.createElement('div');
				const tvFare = document.createElement('h6');

	tvId.className = "col-6 text-start text-primary fs-6";
	cardContainer.className = "row container mx-auto col p-4 justify-content-center";
	card.className = "rounded bg-light col-12 text-center p-4";
	cardHeader.className = "row";
	divTimestamp.className = "p-0 my-0";
	divStatus.className = "p-0";
	tvTimestamp.className = "col-12 text-end text-dark fs-6";
	tvStatus.className = "col-12 text-end text-danger fs-6";
	tvRoute.className = "col-12 text-center text-primary";
	cardBody.className = "row";
	cardHeaderLeft.className = "row col-12";
	cardHeaderRight.className = "row col-6";
	cardBodyLeft.className = "row col-6";
	tvDistanceAndDuration.className = "col-12 text-start text-dark pb-0";
	cardBodyRight.className = "row col-6";
	tvPassengerName.className = "text-secondary col-12 text-start my-0";
	tvRiderName.className = "text-secondary col-12 text-start my-0";
	tvPassengerId.className = "col-12 text-start text-dark fs-6";
	tvRiderId.className = "col-12 text-start text-dark fs-6";
	divButtonContainer.className = "col-12 text-start";
	btnAction.className = "btn btn-secondary text-white";
	cardFooter.className = "row";
	tvFare.className = "text-primary col-12 text-start mt-2";

	tvId.innerHTML = "Ride ID: " + id;
	const date = new Date(timestampStart);
	tvTimestamp.innerHTML = date.toLocaleString();
	tvStatus.innerHTML = capitalizeFirstLetter(status);
	tvDistanceAndDuration.innerHTML = "Distance: " + distance.humanReadable + "<br/>Duration: " + duration.humanReadable;
	btnAction.innerHTML = "View in Map";
	btnAction.onclick = function() { viewRoute(userLocation, destination) }

	getDoc(doc(db, "users", passengerUid)).then((user) => {
		if (user.data() == null) {
			tvPassengerName.innerHTML = "<s>Deleted user</s>";
			return;
		}
		const firstName = user.data().firstName;
		const lastName = user.data().lastName;
		tvPassengerName.innerHTML = "Passenger: " + firstName + " " + lastName;
		tvPassengerId.innerHTML = passengerUid;
	});

	getDoc(doc(db, "users", riderUid)).then((user) => {
		if (user.data() == null) {
			tvRiderName.innerHTML = "<s>Deleted user</s>";
			return;
		}
		const firstName = user.data().firstName;
		const lastName = user.data().lastName;
		tvRiderName.innerHTML = "Rider: " + firstName + " " + lastName;
		tvRiderId.innerHTML = riderUid;
	});

	// start location
	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.latitude},${userLocation.longitude}&key=${"AIzaSyB6Kid0I9Q0ZYxHWtFg5wkEvDDjAkuVJQc"}`;
	fetch(url)
	.then(response => response.json())
	.then(data => {
		const currentLocationAddress = data.plus_code.compound_code;
		tvRoute.innerHTML = "Trip from " + currentLocationAddress.replace(", Negros Oriental, Philippines", "") 	+ " -> to " + destination.name
	})
	.catch(err => console.warn(err.message));

	getDoc(doc(db, "rates", "rates")).then((rates) => {
		const minFare = rates.data().minimumFare;
		const extraFarePerKm = rates.data().extraFarePerKm;

		const estimatedFare = distance.inMeters < 1000 ? minFare : minFare + (extraFarePerKm * Math.floor(distance.inMeters / 1000));
		tvFare.innerHTML = "Estimated Fare: ₱" + Number(estimatedFare).toFixed(2);
	});

	cardContainer.appendChild(card);
		card.appendChild(cardHeader);
			cardHeader.appendChild(tvId);
			cardHeader.appendChild(cardHeaderRight);
				cardHeaderRight.appendChild(divTimestamp);
					divTimestamp.appendChild(tvTimestamp);
				cardHeaderRight.appendChild(divStatus);
					divStatus.appendChild(tvStatus);
			cardHeader.appendChild(cardHeaderLeft);
				cardHeaderLeft.appendChild(tvRoute);
		card.appendChild(cardBody);
			cardBody.appendChild(cardBodyLeft);
				cardBodyLeft.appendChild(tvDistanceAndDuration);
				cardBodyLeft.appendChild(divButtonContainer);
					divButtonContainer.appendChild(btnAction);
			cardBody.appendChild(cardBodyRight);
				cardBodyRight.appendChild(tvPassengerName);
				cardBodyRight.appendChild(tvPassengerId);
				cardBodyRight.appendChild(tvRiderName);
				cardBodyRight.appendChild(tvRiderId);
		card.appendChild(cardFooter);
			cardFooter.appendChild(tvFare);

	ridesContainer.prepend(cardContainer);
}

function viewRoute(userLocation, destination) {
	showModal("#modalViewRoute");
	initMap(userLocation, destination);
}

// Initialize and add the map
let map;

async function initMap(userLocation, destination) {
  const { Map } = await google.maps.importLibrary("maps");

  // The location of Siaton
  const centerOfSiaton = { lat: 9.064356662015047, lng: 123.03462204959553 };

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();

	 // The map, centered at Siaton
	 map = new Map(document.getElementById("map"), {
    zoom: 16,
    center: centerOfSiaton,
    mapId: "DEMO_MAP_ID",
  });

	directionsRenderer.setMap(map);
	calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destination);
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, startLocation, destination) {
	directionsService.route({
		origin: {lat: startLocation.latitude, lng: startLocation.longitude},
		destination: {lat: destination.latitude, lng: destination.longitude},
		travelMode: 'DRIVING'
	}, function(response, status) {
		if (status === 'OK') {
			directionsDisplay.setDirections(response);
		} else {
			window.alert('Directions request failed due to ' + status);
		}
	});
}