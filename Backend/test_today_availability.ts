import axios from "axios";

const BASE_URL = "https://live.ipms247.com/";
const HOTEL_CODE = "46924";
const API_KEY = "5295697129d7c0f7f5-13a2-11f1-9";

async function fetchAvailability() {
  const checkIn = "2026-03-17";
  const checkOut = "2026-03-18";
  
  console.log(`Fetching live availability for TODAY (${checkIn} to ${checkOut})...`);
  const url = `${BASE_URL}booking/reservation_api/listing.php?request_type=RoomList&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&check_in_date=${checkIn}&check_out_date=${checkOut}&number_adults=1&number_children=0&num_rooms=1`;
  
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const rooms = Array.isArray(res.data) ? res.data : [];
    
    console.log(`\nFound ${rooms.length} room types:`);
    for (const r of rooms) {
      const avail = r.available_rooms?.[checkIn] ?? r.min_ava_rooms;
      console.log(`- ${r.Room_Name}: ${avail} available`);
    }
  } catch (err: any) {
    console.error("Error fetching:", err.message);
  }
}

fetchAvailability();
