import axios from "axios";

const BASE_URL = "https://live.ipms247.com/";
const HOTEL_CODE = "46924";
const API_KEY = "5295697129d7c0f7f5-13a2-11f1-9";

async function fetchAvailability() {
  const checkIn = "2026-03-18";
  const checkOut = "2026-03-19";
  
  console.log(`Fetching availability for ${checkIn} to ${checkOut}...`);
  const url = `${BASE_URL}booking/reservation_api/listing.php?request_type=RoomList&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&check_in_date=${checkIn}&check_out_date=${checkOut}&number_adults=1&number_children=0&num_rooms=1`;
  
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const rooms = Array.isArray(res.data) ? res.data : [];
    
    for (const r of rooms) {
      console.log(`\nRoom: ${r.Room_Name}`);
      console.log(`Min Available overall: ${r.min_ava_rooms}`);
      console.log(`Available by date:`, JSON.stringify(r.available_rooms));
    }
  } catch (err: any) {
    console.error("Error fetching", err.message);
  }
}

fetchAvailability();
