import axios from "axios";

const BASE_URL = "https://live.ipms247.com/";
const HOTEL_CODE = "46924";
const API_KEY = "5295697129d7c0f7f5-13a2-11f1-9";
const CHECK_IN = "2026-03-17";
const CHECK_OUT = "2026-03-18";

async function fetchAvailability(): Promise<any> {
  const url = `${BASE_URL}booking/reservation_api/listing.php?request_type=RoomList&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&check_in_date=${CHECK_IN}&check_out_date=${CHECK_OUT}&number_adults=2&number_children=0&num_rooms=1`;
  const res = await axios.get(url, { timeout: 15000 });
  const rooms = Array.isArray(res.data) ? res.data : [];
  
  // Find Deluxe Studio Suite - EP
  const suite = rooms.find((r: any) => String(r.Room_Name).toLowerCase().includes("deluxe studio suite"));
  return suite;
}

async function runInventoryTest() {
  console.log(`\n=== STEP 1: INITIAL AVAILABILITY (${CHECK_IN} to ${CHECK_OUT}) ===`);
  const initialRoom = await fetchAvailability();
  if (!initialRoom) {
    console.log("Deluxe Studio Suite not found in availability.");
    return;
  }
  
  const initialCount = initialRoom.available_rooms?.[CHECK_IN] ?? initialRoom.min_ava_rooms;
  console.log(`Initial Available Rooms: ${initialCount}`);
  
  const rackRate = String(parseFloat(String(initialRoom.room_rates_info?.rack_rate || "0")));

  console.log(`\n=== STEP 2: CREATING BOOKING (InsertBooking) ===`);
  const bookingData = {
    Room_Details: {
      Room_1: {
        Rateplan_Id: String(initialRoom.roomrateunkid),
        Ratetype_Id: String(initialRoom.ratetypeunkid),
        Roomtype_Id: String(initialRoom.roomtypeunkid),
        baserate: rackRate,
        extradultrate: "0",
        extrachildrate: "0",
        number_adults: "2",
        number_children: "0",
        Title: "",
        First_Name: "test",
        Last_Name: "user",
        Gender: "",
        SpecialRequest: "",
      },
    },
    check_in_date: CHECK_IN,
    check_out_date: CHECK_OUT,
    Booking_Payment_Mode: "0",
    Email_Address: "dhumil05@gmail.com",
    Source_Id: "",
    MobileNo: "9924530178",
    Address: "",
    State: "",
    Country: "",
    City: "",
    Zipcode: "",
    Fax: "",
    Device: "",
    Languagekey: "en",
    paymenttypeunkid: "",
  };

  const insertFormData = new URLSearchParams();
  insertFormData.append("request_type", "InsertBooking");
  insertFormData.append("HotelCode", HOTEL_CODE);
  insertFormData.append("APIKey", API_KEY);
  insertFormData.append("BookingData", JSON.stringify(bookingData));

  const insertRes = await axios.post(
    `${BASE_URL}booking/reservation_api/listing.php`,
    insertFormData.toString(),
    { timeout: 30000, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  
  const insertData = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
  console.log("Insert Response:", JSON.stringify(insertData));
  
  const reservationNo = insertData.ReservationNo;
  if (!reservationNo) {
    console.log("Booking failed, cannot continue.");
    return;
  }

  console.log(`\n=== STEP 3: CONFIRMING BOOKING (ProcessBooking ${reservationNo}) ===`);
  // Often inventory is only deducted AFTER ProcessBooking confirms it
  const processData = {
    Action: "ConfirmBooking",
    ReservationNo: String(reservationNo),
    Inventory_Mode: "REGULAR", // or ALLOCATED
    Error_Text: "",
  };
  
  const processFormData = new URLSearchParams();
  processFormData.append("request_type", "ProcessBooking");
  processFormData.append("HotelCode", HOTEL_CODE);
  processFormData.append("APIKey", API_KEY);
  processFormData.append("Process_Data", JSON.stringify(processData));

  const processRes = await axios.post(
    `${BASE_URL}booking/reservation_api/listing.php`,
    processFormData.toString(),
    { timeout: 30000, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  console.log("Process Response:", JSON.stringify(processRes.data));

  // Wait 3 seconds to let eZee cache clear
  console.log("\nWaiting 3 seconds for eZee to update inventory...");
  await new Promise(r => setTimeout(r, 3000));

  console.log(`\n=== STEP 4: FINAL AVAILABILITY (${CHECK_IN} to ${CHECK_OUT}) ===`);
  const finalRoom = await fetchAvailability();
  const finalCount = finalRoom.available_rooms?.[CHECK_IN] ?? finalRoom.min_ava_rooms;
  console.log(`Final Available Rooms: ${finalCount}`);
  
  console.log("\n=== CONCLUSION ===");
  if (Number(finalCount) < Number(initialCount)) {
    console.log(`✅ SUCCESS! Inventory decreased from ${initialCount} to ${finalCount}`);
  } else {
    console.log(`❌ FAILED! Inventory stayed at ${initialCount} (did not decrease)`);
  }
}

runInventoryTest().catch((e) => {
  console.log("Error:", e.response?.data ? JSON.stringify(e.response.data) : e.message);
});
