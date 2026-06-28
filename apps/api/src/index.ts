/**
 * Rabit API Server
 *
 * Handles:
 * - Auth (email OTP, OAuth, session management)
 * - Key share storage (encrypted auth shares)
 * - On-ramp/off-ramp order management
 */

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { shareRouter } from './routes/share.js';
import { onrampRouter } from './routes/onramp.js';
import { offrampRouter } from './routes/offramp.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiKeyAuth } from './middleware/api-key.js';
import { usageLogger } from './middleware/usage-logger.js';
import { logger } from './utils/logger.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// API routes (all require API key)
app.use('/auth', apiKeyAuth, usageLogger, authRouter);
app.use('/auth/share', apiKeyAuth, usageLogger, shareRouter);
app.use('/onramp', apiKeyAuth, usageLogger, onrampRouter);
app.use('/offramp', apiKeyAuth, usageLogger, offrampRouter);

// Dashboard / admin routes — gated by user JWT inside the router.
// No X-API-Key requirement; the dashboard talks to these directly.
app.use('/admin', adminRouter);

// Error handler
app.use(errorHandler);

// Don't let an async rejection inside a handler kill the whole process.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
  });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
});

app.listen(PORT, () => {
  logger.info(`Rabit API server running on port ${PORT}`);
});

export default app;
