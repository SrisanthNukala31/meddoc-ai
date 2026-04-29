const fs = require('fs');
const FormData = require('form-data');
const { default: fetch } = require('node-fetch');

async function testAPI() {
  try {
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream('realistic-xray.png'));
    
    console.log('Testing API...');
    
    const response = await fetch('http://localhost:8000/analyze-xray', {
      method: 'POST',
      body: form
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
