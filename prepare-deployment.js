#!/usr/bin/env node

// Script to prepare deployment package for Azure Web App
// This script creates a deployment package with only the necessary files

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing deployment package for Azure Web App...');

// List of files and directories to include in the deployment package
const includeItems = [
  'index.js',
  'package.json',
  'package-lock.json',
  'startup.js',
  'deploy-azure.js',
  'health-check.js',
  'DEPLOYMENT.md',
  'AZURE_DEPLOYMENT_SUMMARY.md',
  'src/',
  'public/'
];

// List of files and directories to exclude
const excludeItems = [
  'node_modules/',
  '.git/',
  '.vscode/',
  '*.log',
  '.env',
  'tsconfig.json',
  '*.ts',
  '*.md', // We'll keep only specific markdown files
  'test-*',
  'check-*',
  'analyze-*',
  'monitor-*',
  'minimal-*',
  'server.js',
  'combined.js'
];

// Create deployment directory
const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

console.log('Copying files to deployment directory...');

// Copy items to deployment directory
includeItems.forEach(item => {
  const sourcePath = path.join(__dirname, item);
  const destPath = path.join(deployDir, item);
  
  if (fs.existsSync(sourcePath)) {
    // Use system copy command for better handling of directories
    try {
      if (process.platform === 'win32') {
        execSync(`xcopy "${sourcePath}" "${destPath}" /E /I /H /Y`, { stdio: 'inherit' });
      } else {
        execSync(`cp -r "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
      }
      console.log(`Copied: ${item}`);
    } catch (error) {
      console.warn(`Failed to copy ${item}:`, error.message);
    }
  } else {
    console.warn(`Source not found: ${item}`);
  }
});

console.log('Creating deployment package...');

// Create zip file
const zipFile = path.join(__dirname, 'aiva-backend-azure-deployment.zip');
try {
  if (process.platform === 'win32') {
    execSync(`powershell Compress-Archive -Path "${deployDir}\\*" -DestinationPath "${zipFile}" -Force`, { stdio: 'inherit' });
  } else {
    execSync(`cd "${deployDir}" && zip -r "${zipFile}" .`, { stdio: 'inherit' });
  }
  console.log(`✅ Deployment package created: ${zipFile}`);
} catch (error) {
  console.error('Failed to create deployment package:', error.message);
}

console.log('Deployment preparation completed!');
console.log('Next steps:');
console.log('1. Upload the deployment package to Azure Web App');
console.log('2. Configure Application Settings in Azure Portal');
console.log('3. Start the application');