import axios from "axios";

const BASE_URL = "https://live.ipms247.com/";
const HOTEL_CODE = "46924";
const API_KEY = "5295697129d7c0f7f5-13a2-11f1-9";

async function test() {
  const bookingData = {
    Room_Details: {
      Room_1: {
        Rateplan_Id: "4692400000000000016",
        Ratetype_Id: "4692400000000000001",
        Roomtype_Id: "4692400000000000003",
        baserate: "12500",
        extradultrate: "0",
        extrachildrate: "0",
        number_adults: "2",
        number_children: "0",
        Title: "",
        First_Name: "user",
        Last_Name: "2",
        Gender: "",
        SpecialRequest: "",
      },
    },
    check_in_date: "2026-03-24",
    check_out_date: "2026-03-25",
    Booking_Payment_Mode: "0",
    Email_Address: "dhumil05@gmail.com",
    Source_Id: "", // TRYING EMPTY
    MobileNo: "9924530178",
    Address: "",
    State: "",
    Country: "",
    City: "",
    Zipcode: "",
    Fax: "",
    Device: "",
    Languagekey: "en",
    paymenttypeunkid: "", // TRYING EMPTY
  };

  const formData = new URLSearchParams();
  formData.append("request_type", "InsertBooking");
  formData.append("HotelCode", HOTEL_CODE);
  formData.append("APIKey", API_KEY);
  formData.append("BookingData", JSON.stringify(bookingData));

  console.log("=== TRYING WITHOUT SOURCE_ID AND PAYMENTTYPEUNKID ===");
  const res = await axios.post(
    `${BASE_URL}booking/reservation_api/listing.php`,
    formData.toString(),
    { timeout: 30000, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  console.log("=== RESPONSE ===");
  console.log(JSON.stringify(res.data, null, 2));
}

test().catch((e) => {
  console.log("Error:", e.response?.data ? JSON.stringify(e.response.data, null, 2) : e.message);
});
