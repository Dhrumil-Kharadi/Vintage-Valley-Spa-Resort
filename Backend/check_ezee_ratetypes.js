// Quick script to fetch all room info from eZee and list available Rate Types
const axios = require('axios');

const BASE_URL = 'https://live.ipms247.com/';
const HOTEL_CODE = '46924';
const API_KEY = '5295697129d7c0f7f5-13a2-11f1-9';

async function fetchRoomInfo() {
  // Try RoomInfo request type
  const url = `${BASE_URL}booking/reservation_api/listing.php`;
  
  const params = {
    request_type: 'RoomList',
    HotelCode: HOTEL_CODE,
    APIKey: API_KEY,
    check_in_date: '2026-05-09',
    check_out_date: '2026-05-10',
    number_adults: '1',
    number_children: '0',
    num_rooms: '1',
    promotion_code: '',
    property_configuration_info: '0',
    showtax: '0',
    show_only_available_rooms: '0',
    language: 'en',
    packagefor: 'DESKTOP',
    promotionfor: 'DESKTOP',
  };

  console.log('=== Fetching ALL rooms from eZee (show_only_available_rooms=0) ===\n');
  
  const res = await axios.get(url, { params, timeout: 15000 });
  const data = res.data;
  
  const rooms = Array.isArray(data) ? data : 
                Array.isArray(data?.RoomList) ? data.RoomList : 
                Array.isArray(data?.Room_List) ? data.Room_List :
                Array.isArray(data?.rooms) ? data.rooms : [];

  console.log(`Total rooms returned: ${rooms.length}\n`);
  
  // Log ALL room variants with their IDs
  for (const r of rooms) {
    const name = r.Room_Name || r.room_name || '';
    const roomtype = r.Roomtype_Name || r.roomtype_name || '';
    const roomtypeId = r.roomtypeunkid || '';
    const ratetypeId = r.ratetypeunkid || '';
    const roomrateId = r.roomrateunkid || '';
    const rateplanId = r.room_rates_info?.rateplanunkid || roomrateId;
    const avail = r.min_ava_rooms ?? 'unknown';
    
    console.log(`Room: "${name}"`);
    console.log(`  Roomtype_Name: "${roomtype}"`);
    console.log(`  roomtypeunkid (Roomtype_Id): ${roomtypeId}`);
    console.log(`  ratetypeunkid (Ratetype_Id): ${ratetypeId}`);
    console.log(`  roomrateunkid (Rateplan_Id): ${roomrateId}`);
    console.log(`  Availability: ${avail}`);
    console.log(`  Has "EP" in name: ${name.toUpperCase().includes('EP')}`);
    console.log(`  Has "CP" in name: ${name.toUpperCase().includes('CP')}`);
    console.log(`  Has "MAP" in name: ${name.toUpperCase().includes('MAP')}`);
    console.log('');
  }
  
  // Unique rate type IDs
  const uniqueRateTypes = [...new Set(rooms.map(r => r.ratetypeunkid))];
  console.log('=== UNIQUE Ratetype_Id values ===');
  console.log(uniqueRateTypes);
  
  // Unique room type IDs
  const uniqueRoomTypes = [...new Set(rooms.map(r => r.roomtypeunkid))];
  console.log('\n=== UNIQUE Roomtype_Id values ===');
  console.log(uniqueRoomTypes);
  
  // Group by base room type
  console.log('\n=== Room variants per base type ===');
  const byType = {};
  for (const r of rooms) {
    const base = (r.Roomtype_Name || r.Room_Name || '').split(' - ')[0].trim();
    if (!byType[base]) byType[base] = [];
    byType[base].push({
      name: r.Room_Name,
      roomtypeunkid: r.roomtypeunkid,
      ratetypeunkid: r.ratetypeunkid,
      roomrateunkid: r.roomrateunkid,
    });
  }
  for (const [type, variants] of Object.entries(byType)) {
    console.log(`\n${type}: ${variants.length} variant(s)`);
    for (const v of variants) {
      console.log(`  - ${v.name} | IDs: ${v.roomtypeunkid} / ${v.ratetypeunkid} / ${v.roomrateunkid}`);
    }
  }
}

fetchRoomInfo().catch(e => console.error('Error:', e.message));
