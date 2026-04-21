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

// Stage 1: Hidden endpoint with rate limiting and puzzle
app.get('/api/build/logs', (req, res) => {
  const buildId = req.query.id || '1001';
  const session = sessions.get(req.sessionId);
  
  // Rate limiting
  if (!session.lastRequest) {
    session.lastRequest = Date.now();
    session.requestCount = 0;
  }
  
  const timeSinceLastRequest = Date.now() - session.lastRequest;
  if (timeSinceLastRequest < 2000) { // 2 second delay between requests
    return res.status(429).json({ 
      error: 'Too many requests',
      retry_after: Math.ceil((2000 - timeSinceLastRequest) / 1000)
    });
  }
  
  session.lastRequest = Date.now();
  session.requestCount++;
  
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
    '1003': {
      buildId: '1003',
      status: 'success',
      timestamp: '2026-04-17T09:15:22Z',
      logs: 'Build completed successfully\nTests passed: 145/145\nDeployment: staging'
    },
    '1004': {
      buildId: '1004',
      status: 'success',
      timestamp: '2026-04-18T16:42:11Z',
      logs: 'Build completed successfully\nTests passed: 140/145\nDeployment: production'
    }
  };
  
  const log = logs[buildId];
  if (log) {
    res.json(log);
  } else {
    res.status(404).json({ error: 'Build not found' });
  }
});

// Puzzle endpoint - must solve math puzzle to get hint
app.get('/api/puzzle', (req, res) => {
  const answer = req.query.answer;
  const session = sessions.get(req.sessionId);
  
  if (!session.puzzle) {
    // Generate random math puzzle
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 50) + 10;
    const c = Math.floor(Math.random() * 20) + 5;
    session.puzzle = {
      question: `(${a} * ${b}) + ${c}`,
      answer: (a * b) + c
    };
  }
  
  if (answer) {
    if (parseInt(answer) === session.puzzle.answer) {
      delete session.puzzle;
      return res.json({
        success: true,
        hint: 'Build IDs are not always sequential. Try numbers with special meaning in hacker culture.',
        next_step: 'Use /api/artifacts/:buildId with proper authentication'
      });
    } else {
      return res.json({
        success: false,
        message: 'Wrong answer. Try again.'
      });
    }
  }
  
  res.json({
    puzzle: session.puzzle.question,
    instruction: 'Solve this to get a hint. Send answer as ?answer=YOUR_ANSWER'
  });
});

// Artifact endpoint - requires multiple steps
app.get('/api/artifacts/:buildId', (req, res) => {
  const buildId = req.params.buildId;
  const token = req.query.token;
  const session = sessions.get(req.sessionId);
  
  // Step 1: Must have solved puzzle first
  if (!session.puzzleSolved && !session.puzzle) {
    return res.status(403).json({
      error: 'Access denied',
      hint: 'Visit /api/puzzle first'
    });
  }
  
  // Step 2: Generate time-based token
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 60000); // Changes every minute
  const expectedToken = crypto.createHash('md5')
    .update(buildId + timestamp.toString() + 'secret_salt')
    .digest('hex')
    .slice(0, 16);
  
  if (!token) {
    return res.status(401).json({
      error: 'Token required',
      hint: 'Generate token: MD5(buildId + current_minute_timestamp + "secret_salt") first 16 chars',
      example: 'Current timestamp (minutes since epoch): ' + timestamp
    });
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid token',
      hint: 'Token changes every minute. Make sure your timestamp is correct.'
    });
  }
  
  // Step 3: Return artifact only for build 1337
  if (buildId === '1337') {
    res.json({
      buildId: '1337',
      status: 'failed',
      timestamp: '2026-04-10T03:47:21Z',
      logs: 'Build failed\nError in deployment script\nArtifact backup created',
      artifact: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8')
    });
  } else {
    res.status(404).json({ error: 'No artifacts for this build' });
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
