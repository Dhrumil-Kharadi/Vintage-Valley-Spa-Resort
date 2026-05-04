const axios = require('axios');

async function testBooking() {
  const bookingData = {
    "Room_Details": {
      "Room_1": {
        "Rateplan_Id": "4692400000000000001", // The EP rate plan which HAS inventory
        "Ratetype_Id": "4692400000000000003", // The MAP rate type for the invoice
        "Roomtype_Id": "4692400000000000001",
        "baserate": "4703",
        "extradultrate": "0",
        "extrachildrate": "0",
        "number_adults": "2",
        "number_children": "0",
        "Title": "",
        "First_Name": "Test",
        "Last_Name": "User",
        "Gender": "",
        "SpecialRequest": ""
      }
    },
    "check_in_date": "2026-05-16",
    "check_out_date": "2026-05-17",
    "Booking_Payment_Mode": "0",
    "Email_Address": "test@example.com",
    "Source_Id": "",
    "MobileNo": "9999999999",
    "Address": "",
    "State": "",
    "Country": "",
    "City": "",
    "Zipcode": "",
    "Fax": "",
    "Device": "",
    "Languagekey": "en",
    "paymenttypeunkid": ""
  };

  const params = new URLSearchParams();
  params.append("request_type", "InsertBooking");
  params.append("HotelCode", "46924");
  params.append("APIKey", "5295697129d7c0f7f5-13a2-11f1-9"); // Need actual APIKey here, let's look for it
  params.append("BookingData", JSON.stringify(bookingData));

  try {
    // Actually, I don't have the API key in the code, it uses env.EZEE_API_KEY
    console.log("Need API key to test");
  } catch (err) {
    console.error(err);
  }
}

testBooking();
