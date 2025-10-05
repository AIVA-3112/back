# AIVA Backend API - Azure Deployment Guide

This guide explains how to deploy the AIVA Backend API to Azure Web App.

## Prerequisites

1. Azure Subscription
2. Azure SQL Database
3. Azure Storage Account
4. Azure OpenAI Service
5. Node.js (version 16 or higher)

## Deployment Steps

### 1. Prepare the Application

Run the deployment preparation script:

```bash
node deploy-azure.js
```

This script will:
- Create a template `.env` file if it doesn't exist
- Update `package.json` with the correct start script

### 2. Configure Environment Variables

Update the `.env` file with your actual Azure configuration values:

```env
# Database Configuration
SQL_SERVER=your-sql-server.database.windows.net
SQL_DATABASE=your-database-name
SQL_USERNAME=your-username
SQL_PASSWORD=your-password

# Azure Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Settings
NODE_ENV=production
PORT=80
```

### 3. Install Dependencies

Install production dependencies only:

```bash
npm install --production
```

### 4. Test Locally

Test the application locally:

```bash
npm start
```

Visit `http://localhost:80/health` to verify the application is running.

### 5. Deploy to Azure Web App

#### Option 1: Using Azure CLI

1. Install Azure CLI if you haven't already
2. Login to Azure:
   ```bash
   az login
   ```
3. Create a resource group (if needed):
   ```bash
   az group create --name myResourceGroup --location "East US"
   ```
4. Create an App Service plan (if needed):
   ```bash
   az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1 --is-linux
   ```
5. Create a web app:
   ```bash
   az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myAIVAApp --runtime "NODE:16-lts"
   ```
6. Deploy the application:
   ```bash
   az webapp deployment source config-zip --resource-group myResourceGroup --name myAIVAApp --src deploy.zip
   ```

#### Option 2: Using Azure Portal

1. Go to the Azure Portal
2. Create a new Web App
3. Configure the deployment source (GitHub, Azure DevOps, or ZIP upload)
4. Set the application settings with your environment variables
5. Deploy the application

### 6. Configure Application Settings in Azure

In the Azure Portal, go to your Web App > Settings > Configuration > Application settings and add the following settings:

- `SQL_SERVER`: your SQL server name
- `SQL_DATABASE`: your database name
- `SQL_USERNAME`: your database username
- `SQL_PASSWORD`: your database password
- `AZURE_STORAGE_ACCOUNT_NAME`: your storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: your storage account key
- `AZURE_OPENAI_ENDPOINT`: your Azure OpenAI endpoint
- `AZURE_OPENAI_API_KEY`: your Azure OpenAI API key
- `JWT_SECRET`: your JWT secret
- `NODE_ENV`: production

### 7. Verify Deployment

After deployment, visit your app's URL with `/health` appended to verify it's running correctly:

```
https://your-app-name.azurewebsites.net/health
```

## Health Monitoring

The application includes a health check endpoint at `/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2023-05-01T12:00:00.000Z",
  "service": "AIVA Backend API",
  "version": "1.0.0",
  "environment": "production"
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify your SQL server settings
   - Ensure the database firewall allows connections from Azure services
   - Check that the database user has proper permissions

2. **Storage Access Issues**
   - Verify your storage account name and key
   - Ensure the storage account exists and is accessible

3. **OpenAI API Issues**
   - Verify your endpoint URL and API key
   - Check that your OpenAI resource is properly configured

4. **Authentication Errors**
   - Ensure the JWT_SECRET is set and secure
   - Verify that the authentication middleware is working correctly

### Logs

Check the application logs in the Azure Portal under your Web App > Monitoring > Log stream.

## Scaling

For production usage, consider:

1. Scaling up the App Service plan
2. Using Azure Application Insights for monitoring
3. Setting up auto-scaling rules
4. Configuring custom domains and SSL certificates

## Security Considerations

1. Use strong, unique passwords for all services
2. Rotate API keys regularly
3. Use Azure Key Vault for managing secrets
4. Enable HTTPS only
5. Configure proper authentication and authorization
6. Regularly update dependencies