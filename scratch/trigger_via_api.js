const fs = require('fs');
const path = require('path');

async function trigger() {
  const projectPath = 'c:\\Users\\yezir\\.gemini\\antigravity\\scratch\\signal-arena';
  const prdPath = path.join(projectPath, 'docs', 'prd.md');
  const apiUrl = 'http://localhost:50701/api/commit?project_path=' + encodeURIComponent(projectPath);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('testingTypes', 'frontend');
  form.append('testingTypes', 'codebase');
  form.append('frontendUrl', 'http://localhost:3000');
  form.append('prd', fs.createReadStream(prdPath));

  console.log('Sending request to', apiUrl);
  
  const response = await new Promise((resolve, reject) => {
    form.submit(apiUrl, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });

  console.log('Response status:', response.statusCode);
  if (response.statusCode >= 200 && response.statusCode < 300) {
    console.log('Test triggered successfully!');
  } else {
    console.error('Failed to trigger test.');
  }
}

trigger().catch(console.error);
