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

// Puzzle endpoint - must solve MULTIPLE challenges
app.get('/api/puzzle', (req, res) => {
  const answer = req.query.answer;
  const session = sessions.get(req.sessionId);
  
  if (!session.puzzleStage) {
    session.puzzleStage = 1;
    session.puzzleAttempts = 0;
  }
  
  // Stage 1: Math puzzle
  if (session.puzzleStage === 1) {
    if (!session.puzzle1) {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 50) + 10;
      const c = Math.floor(Math.random() * 20) + 5;
      session.puzzle1 = {
        question: `(${a} * ${b}) + ${c}`,
        answer: (a * b) + c
      };
    }
    
    if (answer) {
      session.puzzleAttempts++;
      if (parseInt(answer) === session.puzzle1.answer) {
        session.puzzleStage = 2;
        delete session.puzzle1;
        return res.json({
          success: true,
          message: 'Stage 1 complete! Moving to Stage 2...',
          next: 'Call /api/puzzle again'
        });
      } else {
        if (session.puzzleAttempts >= 3) {
          delete session.puzzle1;
          delete session.puzzleStage;
          session.puzzleAttempts = 0;
          return res.json({
            success: false,
            message: 'Too many wrong attempts. Puzzle reset. Start over.'
          });
        }
        return res.json({
          success: false,
          message: `Wrong answer. ${3 - session.puzzleAttempts} attempts remaining.`
        });
      }
    }
    
    return res.json({
      stage: 1,
      puzzle: session.puzzle1.question,
      instruction: 'Solve this math problem. Send answer as ?answer=YOUR_ANSWER'
    });
  }
  
  // Stage 2: Binary to decimal conversion
  if (session.puzzleStage === 2) {
    if (!session.puzzle2) {
      const decimal = Math.floor(Math.random() * 200) + 50;
      session.puzzle2 = {
        question: decimal.toString(2),
        answer: decimal
      };
    }
    
    if (answer) {
      if (parseInt(answer) === session.puzzle2.answer) {
        session.puzzleStage = 3;
        delete session.puzzle2;
        return res.json({
          success: true,
          message: 'Stage 2 complete! Moving to Stage 3...',
          next: 'Call /api/puzzle again'
        });
      } else {
        return res.json({
          success: false,
          message: 'Wrong answer. Try again.'
        });
      }
    }
    
    return res.json({
      stage: 2,
      puzzle: session.puzzle2.question,
      instruction: 'Convert this binary number to decimal. Send answer as ?answer=YOUR_ANSWER'
    });
  }
  
  // Stage 3: Hex to ASCII
  if (session.puzzleStage === 3) {
    if (!session.puzzle3) {
      const words = ['BUILD', 'DEPLOY', 'PIPELINE', 'ARTIFACT', 'SECRET'];
      const word = words[Math.floor(Math.random() * words.length)];
      session.puzzle3 = {
        question: Buffer.from(word).toString('hex'),
        answer: word
      };
    }
    
    if (answer) {
      if (answer.toUpperCase() === session.puzzle3.answer) {
        session.puzzleSolved = true;
        session.puzzleStage = 4;
        delete session.puzzle3;
        return res.json({
          success: true,
          message: 'All puzzles solved!',
          hint: 'Build IDs are not always sequential. Try numbers with special meaning in hacker culture (leet speak).',
          secret_endpoint: '/api/artifacts/:buildId',
          warning: 'You will need a time-based token to access artifacts.'
        });
      } else {
        return res.json({
          success: false,
          message: 'Wrong answer. Try again.'
        });
      }
    }
    
    return res.json({
      stage: 3,
      puzzle: session.puzzle3.question,
      instruction: 'Convert this hex to ASCII text. Send answer as ?answer=YOUR_ANSWER'
    });
  }
  
  res.json({
    message: 'All puzzles already solved!',
    hint: 'Proceed to /api/artifacts/:buildId'
  });
});

// Artifact endpoint - requires multiple authentication layers
app.get('/api/artifacts/:buildId', (req, res) => {
  const buildId = req.params.buildId;
  const token = req.query.token;
  const proof = req.query.proof;
  const session = sessions.get(req.sessionId);
  
  // Step 1: Must have solved ALL puzzles
  if (!session.puzzleSolved) {
    return res.status(403).json({
      error: 'Access denied',
      hint: 'Complete all puzzle stages at /api/puzzle first'
    });
  }
  
  // Step 2: Proof of work - must find number where SHA256(buildId + number) starts with "00"
  if (!proof) {
    return res.status(401).json({
      error: 'Proof of work required',
      challenge: 'Find a number N where SHA256(buildId + N) starts with "00"',
      hint: 'Try numbers from 0 to 100000',
      submit: 'Send as ?proof=YOUR_NUMBER&token=YOUR_TOKEN'
    });
  }
  
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(buildId + proof).digest('hex');
  if (!hash.startsWith('00')) {
    return res.status(401).json({
      error: 'Invalid proof of work',
      your_hash: hash,
      hint: 'Hash must start with "00"'
    });
  }
  
  // Step 3: Time-based token (changes every 30 seconds)
  const timestamp = Math.floor(Date.now() / 30000); // Changes every 30 seconds
  const expectedToken = crypto.createHash('sha256')
    .update(buildId + timestamp.toString() + proof + 'ultra_secret_salt_2026')
    .digest('hex')
    .slice(0, 20);
  
  if (!token) {
    return res.status(401).json({
      error: 'Token required',
      hint: 'Generate token: SHA256(buildId + timestamp_30s + proof + "ultra_secret_salt_2026") first 20 chars',
      note: 'Timestamp = Math.floor(Date.now() / 30000)',
      current_timestamp: timestamp
    });
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      hint: 'Token changes every 30 seconds. Recalculate with current timestamp.',
      your_token: token,
      current_timestamp: timestamp
    });
  }
  
  // Step 4: Rate limit check
  if (!session.artifactAccess) {
    session.artifactAccess = [];
  }
  
  const now = Date.now();
  session.artifactAccess = session.artifactAccess.filter(time => now - time < 60000);
  
  if (session.artifactAccess.length >= 3) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Maximum 3 artifact requests per minute',
      retry_after: 60
    });
  }
  
  session.artifactAccess.push(now);
  
  // Step 5: Return artifact only for build 1337
  if (buildId === '1337') {
    res.json({
      buildId: '1337',
      status: 'failed',
      timestamp: '2026-04-10T03:47:21Z',
      logs: 'Build failed\nError in deployment script\nArtifact backup created',
      artifact: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8'),
      congratulations: 'You have successfully accessed the artifact! Now decode it...'
    });
  } else {
    res.status(404).json({ error: 'No artifacts for this build' });
  }
});

// Alternative hidden endpoint - REMOVED FOR SECURITY

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
