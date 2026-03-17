import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Credentials provided by the user
const EZEE_BASE_URL = 'https://live.ipms247.com/';
const EZEE_HOTEL_CODE = '46924';
const EZEE_API_KEY = '5295697129d7c0f7f5-13a2-11f1-9';

async function fetchEzeeData() {
  const allData: Record<string, any> = {};
  
  // Helper to build URL
  const buildUrl = (requestType: string, extraParams: Record<string, string> = {}) => {
    const url = new URL('booking/reservation_api/listing.php', EZEE_BASE_URL);
    url.searchParams.set('request_type', requestType);
    url.searchParams.set('HotelCode', EZEE_HOTEL_CODE);
    url.searchParams.set('APIKey', EZEE_API_KEY);
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  };

  // 1. Fetch RoomList (standard availability and pricing)
  console.log('Fetching Ezee RoomList...');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const roomListUrl = buildUrl('RoomList', {
    check_in_date: '2026-05-10', // Checking a future date
    check_out_date: '2026-05-12',
    number_adults: '1',
    number_children: '0',
    num_rooms: '1',
    property_configuration_info: '1',
    showtax: '1',
    show_only_available_rooms: '0', // Show even if sold out
    language: 'en'
  });

  try {
    const res = await axios.get(roomListUrl);
    allData['RoomList'] = res.data;
    console.log('✓ Fetched RoomList');
  } catch (err: any) {
    console.error('✗ Failed to fetch RoomList:', err.message);
    allData['RoomList'] = { error: err.message };
  }

  // 2. Try common Ezee request types if they exist
  const otherTypes = [
    'RoomTypeList', 
    'HotelList', 
    'RateTypeList', 
    'PackageList',
    'Inventory',
    'PropertyInfo',
    'RatePlan',
    'RoomType'
  ];
  for (const type of otherTypes) {
    console.log(`Fetching Ezee ${type}...`);
    try {
      const res = await axios.get(buildUrl(type, { language: 'en', publishtoweb: '1' }));
      allData[type] = res.data;
      console.log(`✓ Fetched ${type}`);
    } catch (err: any) {
      console.log(`- ${type} might not be supported or error: ${err.message}`);
    }
  }

  // Save to file
  const outputPath = path.join(__dirname, 'ezee_alldata.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf8');
  console.log(`\nSuccessfully saved all Ezee data to: ${outputPath}`);
  
  // Also save to frontend for easy access
  const frontendPath = path.join(__dirname, '..', 'Frontend', 'ezee_alldata.json');
  fs.writeFileSync(frontendPath, JSON.stringify(allData, null, 2), 'utf8');
  console.log(`Successfully saved all Ezee data to: ${frontendPath}`);
}

fetchEzeeData();
