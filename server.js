const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Session tracking for time-based hints
const sessions = new Map();

// Fake authentication (intentionally weak)
const users = {
  'admin': 'admin123',
  'developer': 'dev2023',
  'guest': 'guest'
};

// Middleware to track session time
app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || uuidv4();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { startTime: Date.now(), attempts: 0 });
  }
  req.sessionId = sessionId;
  res.setHeader('X-Session-Id', sessionId);
  next();
});

// Stage 1: Login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fake login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username] === password) {
    res.json({ 
      success: true, 
      token: Buffer.from(`${username}:${Date.now()}`).toString('base64'),
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Stage 1: Hidden endpoint - IDOR vulnerability
// Accessible without proper authentication
app.get('/api/build/logs', (req, res) => {
  const buildId = req.query.id || '1001';
  
  // Intentional IDOR - no auth check
  // Multiple build IDs, only one has the payload
  const logs = {
    '1001': {
      buildId: '1001',
      status: 'success',
      timestamp: '2026-04-15T10:23:45Z',
      logs: 'Build completed successfully\nTests passed: 142/142\nDeployment: staging'
    },
    '1002': {
      buildId: '1002',
      status: 'success',
      timestamp: '2026-04-16T14:12:33Z',
      logs: 'Build completed successfully\nTests passed: 138/142\nDeployment: production'
    },
    '1337': {
      buildId: '1337',
      status: 'failed',
      timestamp: '2026-04-10T03:47:21Z',
      logs: 'Build failed\nError in deployment script\nArtifact backup created',
      artifact: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8')
    }
  };
  
  const log = logs[buildId];
  if (log) {
    res.json(log);
  } else {
    res.status(404).json({ error: 'Build not found' });
  }
});

// Alternative hidden endpoint
app.get('/debug/export', (req, res) => {
  // Another way to get the artifact
  const token = req.headers['authorization'];
  
  // Weak token check (can be bypassed)
  if (!token || !token.includes('dev')) {
    // Still returns data with a "warning"
    res.json({
      warning: 'Unauthorized access logged',
      data: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8'),
      note: 'This endpoint is deprecated and will be removed'
    });
  } else {
    res.json({
      data: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8')
    });
  }
});

// Time-based hint system
app.get('/api/hints', (req, res) => {
  const session = sessions.get(req.sessionId);
  const elapsed = (Date.now() - session.startTime) / 1000 / 60; // minutes
  
  const hints = [];
  if (elapsed > 30) hints.push('Try enumerating build IDs. Not all builds are created equal.');
  if (elapsed > 60) hints.push('Images can contain more than meets the eye. Check the file structure.');
  if (elapsed > 90) hints.push('Developers often reuse passwords. Check the build scripts.');
  if (elapsed > 120) hints.push('Network packets can be reassembled. Look for patterns in DNS or HTTP.');
  
  res.json({ hints, elapsed: Math.floor(elapsed) });
});

// Decoy endpoints to waste time
app.get('/api/users', (req, res) => {
  res.json({ error: 'Forbidden', code: 403 });
});

app.get('/api/config', (req, res) => {
  res.json({ 
    version: '2.1.4',
    environment: 'production',
    features: ['auto-deploy', 'rollback', 'monitoring'],
    flag: 'flag{this_is_a_decoy_flag_keep_looking}'
  });
});

app.get('/admin/dashboard', (req, res) => {
  res.status(403).sendFile(path.join(__dirname, 'public', '403.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CI/CD Challenge Server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure to run 'npm run generate' first to create artifacts`);
});
