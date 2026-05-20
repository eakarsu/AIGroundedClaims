const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 4057;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4056').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIGroundedClaims', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);

// CRUD entities
app.use('/api/documents', require('./routes/Documents'));
app.use('/api/claims', require('./routes/Claims'));
app.use('/api/source-corpora', require('./routes/SourceCorpora'));
app.use('/api/grounding-reports', require('./routes/GroundingReports'));
app.use('/api/signatures', require('./routes/Signatures'));
app.use('/api/redaction-logs', require('./routes/RedactionLogs'));

// AI + cross-cutting
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/api', require('./routes/groundedExtras'));

// Custom Views (mounted BEFORE any 404 handler)
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => console.log(`\nGrounded Claims Verifier API on http://localhost:${PORT}\n`));
