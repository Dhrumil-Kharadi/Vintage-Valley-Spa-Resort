const axios = require('axios');

async function testBooking() {
  const payload = {
    "RES_Request": {
      "Request_Type": "InsertBooking",
      "Authentication": {
        "HotelCode": "46924",
        "AuthCode": "5295697129d7c0f7f5-13a2-11f1-9"
      },
      "BookingData": {
        "check_in_date": "2026-05-16",
        "check_out_date": "2026-05-17",
        "Booking_Payment_Mode": "0",
        "Email_Address": "test@example.com",
        "MobileNo": "9999999999",
        "Room_Details": {
          "Room_1": {
            "Rateplan_Id": "4692400000000000001", 
            "Ratetype_Id": "4692400000000000003", 
            "Roomtype_Id": "4692400000000000001",
            "baserate": "4703",
            "extradultrate": "0",
            "extrachildrate": "0",
            "number_adults": "2",
            "number_children": "0",
            "First_Name": "Test",
            "Last_Name": "User"
          }
        }
      }
    }
  };

  try {
    const res = await axios.post("https://live.ipms247.com/index.php/page/service.kioskconnectivity", payload);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testBooking();
