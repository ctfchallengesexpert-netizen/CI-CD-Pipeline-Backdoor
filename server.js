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

// Artifact endpoint - EXTREME anti-cloud measures
app.get('/api/artifacts/:buildId', (req, res) => {
  const buildId = req.params.buildId;
  const token = req.query.token;
  const proof = req.query.proof;
  const captcha = req.query.captcha;
  const session = sessions.get(req.sessionId);
  
  // Step 1: Must have solved ALL puzzles
  if (!session.puzzleSolved) {
    return res.status(403).json({
      error: 'Access denied',
      hint: 'Complete all puzzle stages at /api/puzzle first'
    });
  }
  
  // Step 2: CAPTCHA-like challenge (image-based)
  if (!captcha) {
    const math1 = Math.floor(Math.random() * 20) + 10;
    const math2 = Math.floor(Math.random() * 20) + 10;
    const operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
    
    let result;
    switch(operation) {
      case '+': result = math1 + math2; break;
      case '-': result = math1 - math2; break;
      case '*': result = math1 * math2; break;
    }
    
    session.captchaAnswer = result;
    session.captchaTime = Date.now();
    
    return res.status(401).json({
      error: 'Human verification required',
      challenge: `What is ${math1} ${operation} ${math2}?`,
      note: 'This prevents automated cloud solving',
      submit: 'Add &captcha=YOUR_ANSWER to your request'
    });
  }
  
  // Verify CAPTCHA (must be solved within 60 seconds)
  if (!session.captchaAnswer || (Date.now() - session.captchaTime) > 60000) {
    delete session.captchaAnswer;
    delete session.captchaTime;
    return res.status(401).json({
      error: 'CAPTCHA expired or invalid',
      message: 'Request a new CAPTCHA challenge'
    });
  }
  
  if (parseInt(captcha) !== session.captchaAnswer) {
    delete session.captchaAnswer;
    delete session.captchaTime;
    return res.status(401).json({
      error: 'Wrong CAPTCHA answer',
      message: 'Request a new challenge'
    });
  }
  
  delete session.captchaAnswer;
  delete session.captchaTime;
  
  // Step 3: Proof of work - HARDER (3 leading zeros)
  if (!proof) {
    return res.status(401).json({
      error: 'Proof of work required',
      challenge: 'Find number N where SHA256(buildId + N) starts with "000" (3 zeros)',
      hint: 'This will take 10-30 minutes even with cloud computing',
      estimated_attempts: '~262,144 attempts needed'
    });
  }
  
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(buildId + proof).digest('hex');
  if (!hash.startsWith('000')) {
    return res.status(401).json({
      error: 'Invalid proof of work',
      your_hash: hash,
      required: 'Must start with 000'
    });
  }
  
  // Step 4: Time-based token (15 seconds only!)
  const timestamp = Math.floor(Date.now() / 15000); // 15-second windows
  const expectedToken = crypto.createHash('sha256')
    .update(buildId + timestamp.toString() + proof + 'nightmare_mode_salt_2026')
    .digest('hex')
    .slice(0, 24);
  
  if (!token) {
    return res.status(401).json({
      error: 'Token required',
      hint: 'SHA256(buildId + timestamp_15s + proof + "nightmare_mode_salt_2026") first 24 chars',
      warning: 'Token expires in 15 seconds!',
      current_timestamp: timestamp
    });
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Token window is only 15 seconds',
      current_timestamp: timestamp
    });
  }
  
  // Step 5: IP-based rate limiting (anti-cloud)
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (!session.ipAccess) {
    session.ipAccess = {};
  }
  
  const now = Date.now();
  if (!session.ipAccess[clientIP]) {
    session.ipAccess[clientIP] = [];
  }
  
  // Remove old entries
  session.ipAccess[clientIP] = session.ipAccess[clientIP].filter(time => now - time < 300000); // 5 minutes
  
  if (session.ipAccess[clientIP].length >= 1) {
    return res.status(429).json({
      error: 'IP rate limit exceeded',
      message: 'Only 1 artifact request per IP per 5 minutes',
      retry_after: 300
    });
  }
  
  session.ipAccess[clientIP].push(now);
  
  // Step 6: Return artifact only for build 1337
  if (buildId === '1337') {
    res.json({
      buildId: '1337',
      status: 'failed',
      timestamp: '2026-04-10T03:47:21Z',
      logs: 'Build failed\nError in deployment script\nArtifact backup created',
      artifact: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8'),
      message: 'Congratulations! You defeated the cloud-resistant challenge! 🔥'
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
    message: 'Configuration loaded successfully'
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
