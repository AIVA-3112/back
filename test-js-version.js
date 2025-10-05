#!/usr/bin/env node

// Test script to verify the JavaScript version of the AIVA Backend API works correctly

const fs = require('fs');
const path = require('path');

console.log('Testing JavaScript version of AIVA Backend API...');

// Check if index.js exists
const indexPath = path.join(__dirname, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.js file not found');
  process.exit(1);
}

console.log('✅ index.js file found');

// Check if required dependencies are installed
try {
  // Try to import some of the key dependencies
  require('express');
  require('cors');
  require('helmet');
  require('dotenv');
  require('jsonwebtoken');
  require('joi');
  require('mssql');
  
  console.log('✅ Required dependencies are available');
} catch (error) {
  console.warn('⚠️  Some dependencies may not be installed yet. Run "npm install" to install them.');
}

// Check if package.json has the correct main entry
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageJson.main === 'index.js') {
      console.log('✅ package.json main entry is correctly set to index.js');
    } else {
      console.warn('⚠️  package.json main entry is not set to index.js');
    }
    
    if (packageJson.scripts && packageJson.scripts.start === 'node index.js') {
      console.log('✅ package.json start script is correctly set to "node index.js"');
    } else {
      console.warn('⚠️  package.json start script is not set to "node index.js"');
    }
  } catch (error) {
    console.warn('⚠️  Error parsing package.json:', error.message);
  }
} else {
  console.warn('⚠️  package.json not found');
}

console.log('\nTo test the application:');
console.log('1. Make sure all dependencies are installed: npm install --production');
console.log('2. Set up your environment variables in .env file');
console.log('3. Run the application: npm start');
console.log('4. Visit http://localhost:3002/health to verify it\'s working');