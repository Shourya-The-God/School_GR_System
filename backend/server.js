import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { logger } from './utils/logger.js';
import prisma from './db.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  logger.info(`================================================`);
  logger.info(` School General Register (GR) System`);
  logger.info(` Server running at: http://localhost:${PORT}`);
  logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`================================================`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
