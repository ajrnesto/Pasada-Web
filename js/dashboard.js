import { db, auth, storage } from '../js/firebase.js';
import { onAuthStateChanged } from '../node_modules/firebase/firebase-auth.js';
import { doc, collection, getDoc, getDocs, addDoc, updateDoc, increment, deleteDoc, Timestamp, arrayUnion, deleteField, query, where, orderBy, startAt, endAt, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, getDownloadURL, deleteObject, connectStorageEmulator } from "../node_modules/firebase/firebase-storage.js";
import { blockEmployees, showModal, hideModal, resetValidation, invalidate } from '../js/utils.js';

const cardOrders = document.querySelector("#cardOrders");
const cardRides = document.querySelector("#cardRides");
const tvPending = document.querySelector("#tvPending");
const tvPreparing = document.querySelector("#tvPreparing");
const tvReadyForPickup = document.querySelector("#tvReadyForPickup");
const tvInTransit = document.querySelector("#tvInTransit");
const tvCompleted = document.querySelector("#tvCompleted");
const tvFailedDelivery = document.querySelector("#tvFailedDelivery");
const tvRevenue = document.querySelector("#tvRevenue");
const tvCategories = document.querySelector("#tvCategories");
const tvRides = document.querySelector("#tvRides");

onAuthStateChanged(auth, user => {
	blockEmployees(user);
});

cardRides.addEventListener("click", function() {
	window.location = "rides.html";
});

cardOrders.addEventListener("click", function() {
	window.location = "orders.html";
});

window.addEventListener("load", function() {
	listenToPendingOrders();
	listenToPreparingOrders();
	listenToReadyForPickupOrders();
	listenToInTransitOrders();
	listenToCompletedOrders();
	listenToFailedDeliveryOrders();
	listenToRevenue();
	listenToRides();
	listenToCategories();
});

function listenToPendingOrders() {
	const qry = query(collection(db, "orders"), where("status", "==", "Pending"));

	onSnapshot(qry, (orders) => {
		tvPending.innerHTML = orders.size;
	});
}

function listenToPreparingOrders() {
	const qry = query(collection(db, "orders"), where("status", "==", "Preparing"));

	onSnapshot(qry, (orders) => {
		tvPreparing.innerHTML = orders.size;
	});
}

function listenToReadyForPickupOrders() {
	const qry = query(collection(db, "orders"), where("status", "==", "Ready for Pick-up"));

	onSnapshot(qry, (orders) => {
		tvReadyForPickup.innerHTML = orders.size;
	});
}

function listenToInTransitOrders() {
	const qry = query(collection(db, "orders"), where("status", "==", "In Transit"));

	onSnapshot(qry, (orders) => {
		tvInTransit.innerHTML = orders.size;
	});
}

function listenToCompletedOrders() {
	const qry = query(collection(db, "orders"), where("status", "==", "Delivered/Picked-up"));

	onSnapshot(qry, (orders) => {
		tvCompleted.innerHTML = orders.size;
	});
}

function listenToFailedDeliveryOrders() {
	const qry = query(collection(db, "orders"), where("status", "==", "Failed Delivery"));

	onSnapshot(qry, (orders) => {
		tvFailedDelivery.innerHTML = orders.size;
	});
}

function listenToRevenue() {
	const now = new Date();
	const thisMonth = ("0" + (now.getMonth() + 1)).slice(-2);
	const thisYear = now.getFullYear();

	const qry = query(doc(db, "revenue", thisYear+thisMonth));

	onSnapshot(qry, (revenue) => {
		if (!revenue.exists()) {
			tvRevenue.innerHTML = "No data";
			return;
		}

		tvRevenue.innerHTML = "₱"+Number(parseFloat(revenue.data().revenue)).toFixed(2);
	});
}

function listenToRides() {
	const qry = query(collection(db, "products"));

	onSnapshot(qry, (products) => {
		tvRides.innerHTML = products.size;
	});
}

function listenToCategories() {
	const qry = query(collection(db, "categories"));

	onSnapshot(qry, (categories) => {
		tvCategories.innerHTML = categories.size;
	});
}