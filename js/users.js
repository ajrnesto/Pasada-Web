import { db, auth, storage } from '../js/firebase.js';
import { onAuthStateChanged } from '../node_modules/firebase/firebase-auth.js';
import { doc, collection, getDoc, onSnapshot, getDocs, setDoc, updateDoc, increment, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref as sRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { capitalizeFirstLetter, parseButtonAction, showModal } from '../js/utils.js';

const modalViewHistory = document.querySelector("#modalViewHistory");
const tvEmptyHistory = document.querySelector("#tvEmptyHistory");
const tableHistory = document.querySelector("#tableHistory");
const tvUserName = document.querySelector("#tvUserName");
const tbodyRides = document.querySelector("#tbodyRides");

const tbodyUsers = document.querySelector("#tbodyUsers");
const ordersContainer = document.querySelector("#ordersContainer");
const imgId = document.querySelector("#imgId");

const menuFilter = document.querySelector("#menuFilter");
const etSearchId = document.querySelector("#etSearchId");
const etFirstName = document.querySelector("#etFirstName");
const etLastName = document.querySelector("#etLastName");
const btnFilter = document.querySelector("#btnFilter");

menuFilter.addEventListener("change", () => {
	if (menuFilter.value == "User ID") {
		etSearchId.classList.toggle("d-none", false);
		etFirstName.classList.toggle("d-none", true);
		etFirstName.value = "";
		etLastName.classList.toggle("d-none", true);
		etLastName.value = "";
	}
	else {
		etSearchId.classList.toggle("d-none", true);
		etSearchId.value = "";
		etFirstName.classList.toggle("d-none", false);
		etLastName.classList.toggle("d-none", false);
	}
})

onAuthStateChanged(auth, user => {
	const docRef = doc(db, "users", user.uid);
	getDoc(docRef).then(userSnap => {
		const userType = userSnap.data().userType;
	});
});

window.addEventListener("load", function() {
	getUsersData();
});

btnFilter.addEventListener("click", function() {
	getUsersData();
});

function getUsersData() {
	let qryUsers = null;
	
	const id = etSearchId.value;
	const firstName = etFirstName.value.toUpperCase();
	const lastName = etLastName.value.toUpperCase();

	if (!id && !firstName && !lastName) {
		qryUsers = query(collection(db, "users"));
	}
	else if (id && !firstName && !lastName) {
		qryUsers = query(collection(db, "users"), where("uid", "==", id));	
	}
	else if (!id && firstName && !lastName) {
		qryUsers = query(collection(db, "users"), where("firstName", "==", firstName));	
	}
	else if (!id && !firstName && lastName) {
		qryUsers = query(collection(db, "users"), where("lastName", "==", lastName));	
	} 
	else if (!id && firstName && lastName) {
		qryUsers = query(collection(db, "users"), where("firstName", "==", firstName), where("lastName", "==", lastName));	
	} 
	
	onSnapshot(qryUsers, (users) => {
		// clear table
		tbodyUsers.innerHTML = '';

		console.log("Users size: "+users.size);
		if (users.size == 0) {
			tbodyUsers.innerHTML = '<div class="col-12 text-center mt-4"><h4>No Users to Display</h4></div>';
		}
		else {
			tbodyUsers.innerHTML = '';
		}
			
		users.forEach(user => {
			if (user.data().userType != 2) {
				renderUsers(
					user.id,
					user.data().firstName,
					user.data().lastName,
					user.data().email,
					user.data().mobile,
					user.data().userType,
					user.data().isVerified,
					user.data().idFileName
				);
			}
		});
	});
}

function renderUsers(id, firstName, lastName, email, mobile, userType, isVerified, idFileName) {
	const newRow = document.createElement('tr');
	const cellId = document.createElement('td');
	const imgId = document.createElement('img');
	const cellName = document.createElement('td');
	const cellMobile = document.createElement('td');
	const cellEmail = document.createElement('td');
	const cellUserType = document.createElement('td');
	const cellTotalRevenue = document.createElement('td');
	const cellTotalSpent = document.createElement('td');
	const cellHistory = document.createElement('td');
	const btnHistoryAction = document.createElement('button');
	const cellVerification = document.createElement('td');
	const btnVerification = document.createElement('button');
	const tvVerificationMessage = document.createElement('p');

	if (idFileName == null){
		imgId.src = "https://via.placeholder.com/150?text=No+Image";
	}
	else {
		imgId.style.cursor = "pointer";
		getDownloadURL(sRef(storage, 'id/'+idFileName))
			.then((url) => {
				imgId.src = url;
				imgId.onclick = function() {
					viewId(url);
				}
			});
	}
	imgId.className = "col-12 rounded";
	imgId.style.width = "50px";
	imgId.style.height = "50px";
	imgId.style.objectFit = "cover";

	cellName.innerHTML = firstName + " " + lastName + "<br>ID: " + id;
	cellMobile.innerHTML = mobile;
	cellEmail.innerHTML = email;

	btnHistoryAction.className = "btn btn-no-border btn-primary";
	btnHistoryAction.innerHTML = "View";
	btnHistoryAction.onclick = function() {
		viewUserHistory(id, firstName, lastName, userType);
	}

	btnVerification.className = "btn btn-no-border btn-success d-none";
	btnVerification.innerHTML = "Verify";
	tvVerificationMessage.className = "text-success";
	tvVerificationMessage.innerHTML = "Verified";
	if (userType == 1) {
		if (!isVerified) {
			btnVerification.classList.toggle("d-none", false);
			tvVerificationMessage.classList.toggle("d-none", true);
		}
		else {
			btnVerification.classList.toggle("d-none", true);
			tvVerificationMessage.classList.toggle("d-none", false);
		}
	}
	else {
		tvVerificationMessage.classList.toggle("d-none", true);
	}

	btnVerification.onclick = function() {
		verifyUser(id);
	}

	if (userType == 0) {
		cellUserType.innerHTML = "Passenger";
		cellTotalSpent.innerHTML = "₱0.00";
		cellTotalRevenue.innerHTML = "--";

		const qryRides = query(collection(db, "rides"), where("userUid", "==", id));
		getDocs(qryRides).then((rides) => {
			let totalSpent = 0;
			rides.forEach((ride) => {
				totalSpent += (ride.data().distance.inMeters < 1000) ? 50 : 50 + Math.floor(ride.data().distance.inMeters / 1000);
			});
			cellTotalSpent.innerHTML = "₱" + totalSpent + ".00";
		});
	}
	else if (userType == 1) {
		cellUserType.innerHTML = "Rider";
		cellTotalRevenue.innerHTML = "₱0.00";
		cellTotalSpent.innerHTML = "--";

		const qryRides = query(collection(db, "rides"), where("riderUid", "==", id));
		getDocs(qryRides).then((rides) => {
			let totalIncome = 0;
			rides.forEach((ride) => {
				totalIncome += (ride.data().distance.inMeters < 1000) ? 50 : 50 + Math.floor(ride.data().distance.inMeters / 1000);
			});
			cellTotalRevenue.innerHTML = "₱" + totalIncome + ".00";
		});
	}
	
	newRow.appendChild(cellId);
	cellId.appendChild(imgId);
	newRow.appendChild(cellName);
	newRow.appendChild(cellMobile);
	newRow.appendChild(cellEmail);
	newRow.appendChild(cellUserType);
	newRow.appendChild(cellTotalRevenue);
	newRow.appendChild(cellTotalSpent);
	newRow.appendChild(cellHistory);
	cellHistory.appendChild(btnHistoryAction);
	newRow.appendChild(cellVerification);
	cellVerification.appendChild(btnVerification);
	cellVerification.appendChild(tvVerificationMessage);

	tbodyUsers.append(newRow);
}

function verifyUser(userId) {
	updateDoc(doc(db, "users", userId), {
		isVerified: true
	});
}

function viewId(url) {
	imgId.src = url;

	showModal('#modalViewId');
}

function viewUserHistory(userId, firstName, lastName, userType) {
	showModal("#modalViewHistory");
	tvUserName.innerHTML = firstName + " " + lastName;

	let qryRides;

	if (userType == 0) {
		qryRides = query(collection(db, "rides"), where("passengerUid", "==", userId), orderBy("timestampStart", "desc"));
	}
	else {
		qryRides = query(collection(db, "rides"), where("riderUid", "==", userId), orderBy("timestampStart", "desc"));
	}
	getDocs(qryRides).then((rides) => {
		// clear table
		tbodyRides.innerHTML = '';

		if (rides.size == 0) {
			tvEmptyHistory.classList.toggle("d-none", false);
			tableHistory.classList.toggle("d-none", true);
		}
		else {
			tvEmptyHistory.classList.toggle("d-none", true);
			tableHistory.classList.toggle("d-none", false);
		}
			
		rides.forEach(snapRides => {
			renderRides(
				snapRides.id,
				snapRides.data().userUid,
				snapRides.data().riderUid,
				snapRides.data().userLocation,
				snapRides.data().destination,
				snapRides.data().distance,
				snapRides.data().duration,
				snapRides.data().modesOfTransport,
				snapRides.data().status,
				snapRides.data().timestampEnd,
				snapRides.data().timestampStart
			);
		});
	});
}
function renderRides(id, passengerUid, riderUid, userLocation, destination, distance, duration, modesOfTransport, status, timestampEnd, timestampStart) {
	
	const newRow = document.createElement('tr');
	const cellId = document.createElement('td');
	const cellDate = document.createElement('td');
	const cellFrom = document.createElement('td');
	const cellTo = document.createElement('td');
	const cellPassenger = document.createElement('td');
	const cellRider = document.createElement('td');
	const cellDistance = document.createElement('td');
	const cellDuration = document.createElement('td');
	const cellFare = document.createElement('td');
	const cellStatus = document.createElement('td');
	const cellRoute = document.createElement('td');
	const btnViewRoute = document.createElement('button');
	
	btnViewRoute.className = "btn btn-no-border btn-success";
	btnViewRoute.innerHTML = "View in Map";


	cellId.innerHTML = id;
	const date = new Date(timestampStart);
	cellDate.innerHTML = date.toLocaleString();
	cellStatus.innerHTML = capitalizeFirstLetter(status);
	cellDistance.innerHTML = distance.humanReadable;
	cellDuration.innerHTML = duration.humanReadable;

	getDoc(doc(db, "users", passengerUid)).then((user) => {
		if (user.data() == null) {
			cellPassenger.innerHTML = "<s>Deleted user</s>";
			return;
		}
		const firstName = user.data().firstName;
		const lastName = user.data().lastName;
		cellPassenger.innerHTML = firstName + " " + lastName;
	});

	getDoc(doc(db, "users", riderUid)).then((user) => {
		if (user.data() == null) {
			cellRider.innerHTML = "<s>Deleted user</s>";
			return;
		}
		const firstName = user.data().firstName;
		const lastName = user.data().lastName;
		cellRider.innerHTML = firstName + " " + lastName;
	});

	// route
	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.latitude},${userLocation.longitude}&key=${"AIzaSyB6Kid0I9Q0ZYxHWtFg5wkEvDDjAkuVJQc"}`;
	fetch(url)
	.then(response => response.json())
	.then(data => {
		const currentLocationAddress = data.plus_code.compound_code;
		cellFrom.innerHTML = currentLocationAddress.replace(", Negros Oriental, Philippines", "");
		cellTo.innerHTML = destination.name
	})
	.catch(err => console.warn(err.message));

	cellFare.innerHTML = "₱" + (distance.inMeters < 1000 ? 50 : 50 + (15 * Math.floor(distance.inMeters / 1000))) + ".00";

	btnViewRoute.innerHTML = "View in Map";
	btnViewRoute.onclick = function() { viewRoute(userLocation, destination) }

	newRow.appendChild(cellId);
	newRow.appendChild(cellDate);
	newRow.appendChild(cellFrom);
	newRow.appendChild(cellTo);
	newRow.appendChild(cellPassenger);
	newRow.appendChild(cellRider);
	newRow.appendChild(cellDistance);
	newRow.appendChild(cellDuration);
	newRow.appendChild(cellFare);
	newRow.appendChild(cellStatus);
	newRow.appendChild(cellRoute);
		cellRoute.appendChild(btnViewRoute);

	tbodyRides.append(newRow);
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