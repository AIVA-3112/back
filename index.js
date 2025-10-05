const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import middleware
const { requestSizeLimiter, corsOptions } = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { logger } = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('./src/middleware/auth');

// Import routes
const { authRoutes } = require('./src/routes/auth');
const { chatRoutes } = require('./src/routes/chat');
const { userRoutes } = require('./src/routes/user');
const { dataRoutes } = require('./src/routes/data');
const { fileRoutes } = require('./src/routes/files');
const { workspaceRoutes } = require('./src/routes/workspace');
const { searchRoutes } = require('./src/routes/search');
const { adminRoutes } = require('./src/routes/admin');
const { feedbackRoutes } = require('./src/routes/feedback');
const { adminDataRoutes } = require('./src/routes/adminData');
const { configRoutes } = require('./src/routes/config');
const { bookmarkRoutes } = require('./src/routes/bookmarks');
const { messageActionRoutes } = require('./src/routes/messageActions');
const { historyRoutes } = require('./src/routes/history');
const { fileAnalysisRoutes } = require('./src/routes/fileAnalysis');
const { keyVaultRoutes } = require('./src/routes/keyVault');

// Import services
const { DatabaseManager } = require('./src/config/database');
const { StorageService } = require('./src/services/storage');
const { CacheService } = require('./src/services/cache');

// Load environment variables
dotenv.config();

const app = express();

// Configure Express to trust proxy headers
// This is needed when running behind a reverse proxy like Azure App Service
app.set('trust proxy', true);

// Use port from environment variable or default to 3002
const PORT = process.env.PORT || 3002;

app.use(requestSizeLimiter);
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AIVA Backend API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AIVA Backend API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'AI-powered chat application backend',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      user: '/api/user',
      files: '/api/files',
      workspaces: '/api/workspaces',
      search: '/api/search',
      feedback: '/api/feedback',
      keyVault: '/api/admin/keyvault',
      fileAnalysis: '/api/file-analysis'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin/data', authenticateToken, requireAdmin, adminDataRoutes);
app.use('/api/admin/config', authenticateToken, requireAdmin, configRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/message-actions', messageActionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/file-analysis', fileAnalysisRoutes);
app.use('/api/admin/keyvault', authenticateToken, requireAdmin, keyVaultRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Azure services
    const { initializeAzureServices } = require('./src/services/azure');
    await initializeAzureServices();
    logger.info('✅ Azure services initialized');
    
    // Initialize ConfigurationManager to load settings from Key Vault
    const { ConfigurationManager } = require('./src/services/configurationManager');
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    logger.info('✅ Configuration Manager initialized with Key Vault integration');
    
    // Note: Database initialization is handled by Azure services
    
    // Initialize storage
    const storageService = StorageService.getInstance();
    await storageService.initialize();
    await storageService.initializeContainer();
    logger.info('✅ Storage service ready');
    
    // Initialize cache
    const cacheService = CacheService.getInstance();
    await cacheService.initialize();
    logger.info('✅ Cache service ready');
    
    app.listen(PORT, () => {
      logger.info(`🚀 AIVA Backend API running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API info: http://localhost:${PORT}/api`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Cleanup services
  const dbManager = DatabaseManager.getInstance();
  dbManager.disconnect();
  
  const cacheService = CacheService.getInstance();
  cacheService.destroy();
  
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Cleanup services
  const dbManager = DatabaseManager.getInstance();
  dbManager.disconnect();
  
  const cacheService = CacheService.getInstance();
  cacheService.destroy();
  
  process.exit(0);
});

startServer();