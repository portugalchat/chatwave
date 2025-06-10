import { cpus } from 'os';

// Production configuration for 1M+ users
export const PRODUCTION_CONFIG = {
  // Server Configuration
  SERVER: {
    PORT: process.env.PORT || 8080,
    HOST: '0.0.0.0',
    WORKERS: process.env.WEB_CONCURRENCY || cpus().length,
    KEEP_ALIVE_TIMEOUT: 65000,
    HEADERS_TIMEOUT: 66000,
    MAX_CONNECTIONS: 10000,
    BODY_LIMIT: '10mb'
  },

  // Database Configuration
  DATABASE: {
    MAX_CONNECTIONS: 100,
    IDLE_TIMEOUT: 30000,
    CONNECTION_TIMEOUT: 2000,
    QUERY_TIMEOUT: 5000,
    SSL: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  // Redis Configuration
  REDIS: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    CONNECTION_TIMEOUT: 2000,
    COMMAND_TIMEOUT: 1000,
    PIPELINE_BATCH_SIZE: 100
  },

  // WebSocket Configuration
  WEBSOCKET: {
    MAX_CONNECTIONS: 50000,
    PING_INTERVAL: 30000,
    PONG_TIMEOUT: 5000,
    MAX_PAYLOAD: 1024 * 1024, // 1MB
    COMPRESSION: true
  },

  // Rate Limiting
  RATE_LIMITS: {
    MESSAGES_PER_MINUTE: 30,
    REQUESTS_PER_MINUTE: 100,
    MATCHMAKING_PER_MINUTE: 10,
    FILE_UPLOAD_PER_HOUR: 20
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    USER_PROFILE: 3600,      // 1 hour
    FRIENDS_LIST: 1800,      // 30 minutes
    CHAT_SESSION: 7200,      // 2 hours
    MATCHMAKING_QUEUE: 300,  // 5 minutes
    WEBSOCKET_SESSION: 1800  // 30 minutes
  },

  // Monitoring
  MONITORING: {
    HEALTH_CHECK_INTERVAL: 30000,
    METRICS_COLLECTION_INTERVAL: 60000,
    LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    ALERT_THRESHOLDS: {
      CPU_USAGE: 80,
      MEMORY_USAGE: 85,
      ERROR_RATE: 1,
      RESPONSE_TIME: 500
    }
  },

  // Security
  SECURITY: {
    CORS_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    HELMET_CONFIG: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  }
};

export default PRODUCTION_CONFIG;