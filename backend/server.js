const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 4057;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || 'http://localhost:4056').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIGroundedClaims', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);

// Legacy generic CRUD, unscoped bulk import, AI, and sample-monitor routes are
// quarantined until their tenant and evidence contracts are migrated.
app.use('/api/verification-workflow', require('./routes/claimVerificationWorkflow'));

app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`\nGrounded Claims Verifier API on http://localhost:${PORT}\n`));
}

module.exports = app;
