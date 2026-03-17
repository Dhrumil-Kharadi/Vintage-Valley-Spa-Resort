import axios from 'axios';
import fs from 'fs';
import path from 'path';

// EZEE API Configuration from USER_REQUEST
const EZEE_BASE_URL = 'https://live.ipms247.com/';
const EZEE_HOTEL_CODE = '46924';
const EZEE_API_KEY = '5295697129d7c0f7f5-13a2-11f1-9';

/**
 * Fetch all room data including CP, EP, MAP prices from EZEE API
 */
async function fetchEzeeAllData() {
  const allData: any[] = [];
  
  // Define the date range for fetching availability/pricing (e.g., next 7 days)
  const today = new Date();
  const checkInDate = today.toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const checkOutDate = nextWeek.toISOString().split('T')[0];

  console.log(`🚀 Starting Ezee API fetch for period: ${checkInDate} to ${checkOutDate}`);

  // Base URL for the reservation API
  const apiUrl = `${EZEE_BASE_URL}booking/reservation_api/listing.php`;

  try {
    // Parameters for RoomList request
    const params = {
      request_type: 'RoomList',
      HotelCode: EZEE_HOTEL_CODE,
      APIKey: EZEE_API_KEY,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_adults: '1',
      number_children: '0',
      num_rooms: '1',
      property_configuration_info: '1',
      showtax: '1',
      show_only_available_rooms: '0',
      language: 'en'
    };

    console.log('📡 Sending request to Ezee API...');
    const response = await axios.get(apiUrl, { params });

    if (response.data && Array.isArray(response.data)) {
      console.log(`✅ Successfully fetched ${response.data.length} room/package entries.`);
      
      // Save the raw data to data.json
      const outputPath = path.join(__dirname, 'data.json');
      fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2), 'utf8');
      console.log(`💾 Data saved to: ${outputPath}`);

      // Log a quick summary of what was found
      const planTypes = new Set();
      response.data.forEach((room: any) => {
        const name = room.Room_Name || '';
        if (name.includes('EP')) planTypes.add('EP');
        if (name.includes('CP')) planTypes.add('CP');
        if (name.trim().endsWith('MAP')) planTypes.add('MAP'); // Sometimes it's just MAP at the end
        if (name.includes('MAP ')) planTypes.add('MAP');
      });

      console.log('\n📊 Summary of plans found:');
      console.log(`- Detected plans: ${Array.from(planTypes).join(', ') || 'None specifically tagged'}`);
      console.log(`- Total room entries: ${response.data.length}`);
      
    } else {
      console.error('❌ Unexpected API response format or empty data:', response.data);
    }

  } catch (error: any) {
    console.error('❌ Error fetching from Ezee API:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Run the fetch function
fetchEzeeAllData();
