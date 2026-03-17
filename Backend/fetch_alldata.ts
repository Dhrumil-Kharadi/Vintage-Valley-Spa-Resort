import fs from 'fs';
import path from 'path';

async function fetchAndSaveData() {
  try {
    console.log('Fetching data from http://localhost:8080/api/rooms...');
    const response = await fetch('http://localhost:8080/api/rooms');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the JSON data with 2-space indentation
    const formattedJson = JSON.stringify(data, null, 2);
    
    // Save to backend directory
    const backendPath = path.join(__dirname, 'alldata.json');
    fs.writeFileSync(backendPath, formattedJson, 'utf8');
    console.log(`Successfully saved data to: ${backendPath}`);
    
    // Save to frontend directory
    const frontendPath = path.join(__dirname, '..', 'Frontend', 'alldata.json');
    fs.writeFileSync(frontendPath, formattedJson, 'utf8');
    console.log(`Successfully saved data to: ${frontendPath}`);
    
    console.log('All data fetched and saved successfully!');
  } catch (error) {
    console.error('Failed to fetch and save data:', error);
  }
}

fetchAndSaveData();
