/**
 * Fetch LIVE eZee room data and save to checkdata.json
 * 
 * Usage:
 *   node fetch_ezee_rooms_live.js                     → defaults: tomorrow to day-after
 *   node fetch_ezee_rooms_live.js 2026-05-09 2026-05-10  → custom dates
 *   node fetch_ezee_rooms_live.js 2026-05-09 2026-05-12 2 0 1  → dates + adults + children + rooms
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://live.ipms247.com/';
const HOTEL_CODE = '46924';
const API_KEY = '5295697129d7c0f7f5-13a2-11f1-9';
const OUTPUT_FILE = path.join(__dirname, 'checkdata.json');

// Parse CLI args
const args = process.argv.slice(2);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(tomorrow);
dayAfter.setDate(dayAfter.getDate() + 1);

const toIso = (d) => d.toISOString().slice(0, 10);

const checkIn = args[0] || toIso(tomorrow);
const checkOut = args[1] || toIso(dayAfter);
const adults = args[2] || '1';
const children = args[3] || '0';
const numRooms = args[4] || '1';

async function fetchLiveRooms() {
  const url = `${BASE_URL}booking/reservation_api/listing.php`;

  const params = {
    request_type: 'RoomList',
    HotelCode: HOTEL_CODE,
    APIKey: API_KEY,
    check_in_date: checkIn,
    check_out_date: checkOut,
    number_adults: adults,
    number_children: children,
    num_rooms: numRooms,
    promotion_code: '',
    property_configuration_info: '0',
    showtax: '0',
    show_only_available_rooms: '0',
    language: 'en',
    packagefor: 'DESKTOP',
    promotionfor: 'DESKTOP',
  };

  const fullUrl = `${url}?${new URLSearchParams(params).toString()}`;

  console.log('🔍 Fetching eZee rooms LIVE...');
  console.log(`   Check-in:  ${checkIn}`);
  console.log(`   Check-out: ${checkOut}`);
  console.log(`   Adults: ${adults}, Children: ${children}, Rooms: ${numRooms}`);
  console.log(`   URL: ${fullUrl.replace(API_KEY, '***')}\n`);

  const res = await axios.get(url, { params, timeout: 15000 });
  const data = res.data;

  const rooms = Array.isArray(data) ? data :
    Array.isArray(data?.RoomList) ? data.RoomList :
    Array.isArray(data?.Room_List) ? data.Room_List :
    Array.isArray(data?.rooms) ? data.rooms : [];

  console.log(`✅ Got ${rooms.length} room(s) from eZee\n`);

  // Print summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ROOM SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  for (const r of rooms) {
    const name = r.Room_Name || '';
    const typeName = r.Roomtype_Name || '';
    const avail = r.min_ava_rooms ?? '?';
    const roomtypeId = r.roomtypeunkid || '';
    const ratetypeId = r.ratetypeunkid || '';
    const roomrateId = r.roomrateunkid || '';
    const rackRate = r.room_rates_info?.rack_rate || '';
    const dayWise = r.room_rates_info?.day_wise_beforediscount || [];
    const avg = r.room_rates_info?.avg_per_night_after_discount || '';

    console.log(`\n  📦 ${name}`);
    console.log(`     Type: ${typeName}`);
    console.log(`     Avail: ${avail} rooms`);
    console.log(`     IDs → roomtype: ${roomtypeId} | ratetype: ${ratetypeId} | rateplan: ${roomrateId}`);
    console.log(`     Rack Rate: ₹${rackRate}`);
    console.log(`     Day-wise rates: ${JSON.stringify(dayWise)}`);
    console.log(`     Avg/night (after discount): ₹${avg}`);

    // Extra adult/child rates
    const extraAdult = r.extra_adult_rates_info?.rack_rate || '0';
    const extraChild = r.extra_child_rates_info?.rack_rate || '0';
    console.log(`     Extra Adult: ₹${extraAdult} | Extra Child: ₹${extraChild}`);

    // Plan detection
    const upper = name.toUpperCase();
    const plan = upper.includes('MAP') ? 'MAP' : upper.includes('CP') ? 'CP' : upper.includes('EP') ? 'EP' : 'UNKNOWN';
    console.log(`     Detected Plan: ${plan}`);
  }

  // Unique IDs
  const uniqueRateTypes = [...new Set(rooms.map(r => r.ratetypeunkid))];
  const uniqueRoomTypes = [...new Set(rooms.map(r => r.roomtypeunkid))];

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ID ANALYSIS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Unique Ratetype_Id(s): ${JSON.stringify(uniqueRateTypes)}`);
  console.log(`  Unique Roomtype_Id(s): ${JSON.stringify(uniqueRoomTypes)}`);
  console.log(`  CP/MAP variants found: ${rooms.some(r => {
    const n = (r.Room_Name || '').toUpperCase();
    return n.includes('CP') || n.includes('MAP');
  }) ? 'YES ✅' : 'NO ❌ (only EP configured in eZee)'}`);

  // Save to checkdata.json
  const output = {
    fetchInfo: {
      timestamp: new Date().toISOString(),
      url: fullUrl.replace(API_KEY, '***REDACTED***'),
      status: res.status,
      totalRooms: rooms.length,
      hotelCode: HOTEL_CODE,
      currency: rooms[0]?.currency_code || 'INR',
      checkIn,
      checkOut,
      adults: Number(adults),
      children: Number(children),
      rooms: Number(numRooms),
    },
    apiResponse: rooms,
    summary: {
      roomTypes: rooms.map(r => ({
        roomName: r.Room_Name || '',
        roomType: r.Roomtype_Name || '',
        maxAdults: Number(r.Room_Max_adult || r.max_adult_occupancy || 0),
        maxChildren: Number(r.Room_Max_child || r.max_child_occupancy || 0),
        availableRooms: Number(r.min_ava_rooms ?? 0),
        avgRatePerNight: Number(r.room_rates_info?.avg_per_night_after_discount || 0),
        rackRate: r.room_rates_info?.rack_rate || '',
        currency: r.currency_code || 'INR',
        roomtypeunkid: r.roomtypeunkid || '',
        ratetypeunkid: r.ratetypeunkid || '',
        roomrateunkid: r.roomrateunkid || '',
      })),
    },
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 Saved to ${OUTPUT_FILE}`);
  console.log('Done!\n');
}

fetchLiveRooms().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
