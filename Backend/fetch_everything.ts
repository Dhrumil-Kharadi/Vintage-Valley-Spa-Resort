import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:8080/api';

const ENDPOINTS = [
  '/rooms',
  '/promos',
  '/tariff'
  // Note: /rooms-live, /bookings, /auth, /admin, and /inquiries 
  // either require auth, POST data, or are not returning a simple list of data
];

async function fetchAllData() {
  const allData: Record<string, any> = {};

  console.log(`Starting to fetch data from ${ENDPOINTS.length} endpoints...`);

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Fetching ${endpoint}...`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        console.warn(`Warning: HTTP error! status: ${response.status} for ${endpoint}`);
        allData[endpoint] = { error: `HTTP ${response.status}` };
        continue;
      }
      
      const data = await response.json();
      allData[endpoint] = data;
      console.log(`✓ Successfully fetched data for ${endpoint}`);
    } catch (error: any) {
      console.error(`✗ Failed to fetch data for ${endpoint}:`, error.message);
      allData[endpoint] = { error: error.message };
    }
  }

  // Format the JSON data with 2-space indentation
  const formattedJson = JSON.stringify(allData, null, 2);
  
  // Save to backend directory
  const backendPath = path.join(__dirname, 'alldata_complete.json');
  fs.writeFileSync(backendPath, formattedJson, 'utf8');
  console.log(`\nSuccessfully saved complete data to: ${backendPath}`);
  
  // Save to frontend directory
  const frontendPath = path.join(__dirname, '..', 'Frontend', 'alldata_complete.json');
  fs.writeFileSync(frontendPath, formattedJson, 'utf8');
  console.log(`Successfully saved complete data to: ${frontendPath}`);
}

fetchAllData();
