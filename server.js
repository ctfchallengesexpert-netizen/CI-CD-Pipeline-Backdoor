const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

// Artifact endpoint - ANTI-AI NIGHTMARE MODE measures
app.get('/api/artifacts/:buildId', (req, res) => {
  const buildId = req.params.buildId;
  const token = req.query.token;
  const proof = req.query.proof;
  const captcha = req.query.captcha;
  const humanVerify = req.query.humanVerify;
  const memoryChallenge = req.query.memoryChallenge;
  const session = sessions.get(req.sessionId);
  
  // Step 1: Must have solved ALL puzzles
  if (!session.puzzleSolved) {
    return res.status(403).json({
      error: 'Access denied',
      hint: 'Complete all puzzle stages at /api/puzzle first'
    });
  }
  
  // Step 2: ANTI-AI VISUAL CAPTCHA (impossible for AI to solve)
  if (!captcha) {
    // Generate ASCII art pattern that requires human visual pattern recognition
    const patterns = [
      `
    ╔═══╗ ╔═══╗ ╔═══╗
    ║ ● ║ ║   ║ ║ ● ║
    ╚═══╝ ╚═══╝ ╚═══╝
    Which box contains a circle? (1, 2, or 3)
      `,
      `
    ┌─┐ ┌─┐ ┌─┐ ┌─┐
    │▲│ │■│ │▲│ │○│
    └─┘ └─┘ └─┘ └─┘
    Count the triangles (▲)
      `,
      `
    ╭─────╮  ╭─────╮  ╭─────╮
    │  ◊  │  │  ◊  │  │  ●  │
    │ ◊ ◊ │  │     │  │ ● ● │
    ╰─────╯  ╰─────╯  ╰─────╯
    Which pattern is different? (1, 2, or 3)
      `,
      `
    Look at this sequence and find the pattern:
    🔴🔵🔴🔵🔴❓
    What comes next? (red=1, blue=2)
      `,
      `
    Visual Math: Count the overlapping shapes
    ◯◯◯
     ◯◯
      ◯
    How many circles total?
      `
    ];
    
    const answers = [1, 2, 3, 2, 6]; // Correct answers for each pattern
    const selectedPattern = Math.floor(Math.random() * patterns.length);
    
    session.visualPattern = patterns[selectedPattern];
    session.visualAnswer = answers[selectedPattern];
    session.captchaTime = Date.now();
    
    return res.status(401).json({
      error: 'Anti-AI visual pattern recognition required',
      challenge: session.visualPattern,
      note: 'This requires human visual processing that AI cannot replicate',
      submit: 'Add &captcha=YOUR_ANSWER',
      warning: 'AI assistants will fail this challenge',
      expires: '120 seconds'
    });
  }
  
  // Verify visual CAPTCHA
  if (!session.visualAnswer || (Date.now() - session.captchaTime) > 120000) {
    delete session.visualPattern;
    delete session.visualAnswer;
    delete session.captchaTime;
    return res.status(401).json({
      error: 'Visual CAPTCHA expired',
      message: 'Request a new visual pattern challenge'
    });
  }
  
  if (parseInt(captcha) !== session.visualAnswer) {
    delete session.visualPattern;
    delete session.visualAnswer;
    delete session.captchaTime;
    return res.status(401).json({
      error: 'Wrong visual pattern answer',
      message: 'AI cannot solve visual pattern recognition'
    });
  }
  
  delete session.visualPattern;
  delete session.visualAnswer;
  delete session.captchaTime;
  
  // Step 3: REAL-TIME HUMAN INTERACTION TEST (impossible for AI to automate)
  if (!memoryChallenge) {
    // Generate a challenge that requires human timing and decision making
    const currentTime = new Date();
    const targetMinute = currentTime.getMinutes();
    const targetSecond = Math.floor(Math.random() * 60);
    
    // Create a sequence that must be submitted at a specific time
    const timeChallenge = {
      instruction: "You must submit this challenge at exactly the right moment",
      target_minute: targetMinute,
      target_second: targetSecond,
      current_time: currentTime.toISOString(),
      challenge_code: Math.random().toString(36).substring(2, 8).toUpperCase()
    };
    
    session.timeChallenge = timeChallenge;
    session.timeChallengeStart = Date.now();
    
    return res.status(401).json({
      error: 'Real-time human interaction required',
      instructions: `Wait until the clock shows exactly ${targetMinute.toString().padStart(2, '0')}:${targetSecond.toString().padStart(2, '0')} (MM:SS), then submit immediately`,
      challenge_code: timeChallenge.challenge_code,
      current_time: currentTime.toISOString(),
      note: 'This requires human timing and cannot be automated by AI',
      submit: 'Add &memoryChallenge=CHALLENGE_CODE when the time is exactly right',
      warning: 'You have a 2-second window. Too early or too late = failure',
      anti_ai_note: 'AI cannot perform real-time human timing tasks'
    });
  }
  
  // Verify real-time challenge
  if (!session.timeChallenge) {
    return res.status(401).json({
      error: 'Time challenge expired',
      message: 'Request a new real-time challenge'
    });
  }
  
  const currentTime = new Date();
  const currentMinute = currentTime.getMinutes();
  const currentSecond = currentTime.getSeconds();
  const targetMinute = session.timeChallenge.target_minute;
  const targetSecond = session.timeChallenge.target_second;
  
  // Check if submitted at the right time (2-second window)
  const timeDiff = Math.abs(currentSecond - targetSecond);
  const minuteMatch = currentMinute === targetMinute;
  
  if (!minuteMatch || timeDiff > 2) {
    delete session.timeChallenge;
    delete session.timeChallengeStart;
    return res.status(401).json({
      error: 'Wrong timing',
      message: `You submitted at ${currentMinute.toString().padStart(2, '0')}:${currentSecond.toString().padStart(2, '0')}, needed ${targetMinute.toString().padStart(2, '0')}:${targetSecond.toString().padStart(2, '0')}`,
      note: 'This requires precise human timing that AI cannot replicate'
    });
  }
  
  // Check challenge code
  if (memoryChallenge !== session.timeChallenge.challenge_code) {
    delete session.timeChallenge;
    delete session.timeChallengeStart;
    return res.status(401).json({
      error: 'Wrong challenge code',
      message: 'Code must match exactly'
    });
  }
  
  delete session.timeChallenge;
  delete session.timeChallengeStart;
  
  // Step 4: ANTI-AI CONSCIOUSNESS TEST (impossible for AI)
  if (!humanVerify) {
    const impossibleQuestions = [
      { 
        q: "Close your eyes and describe the exact feeling of sunlight on your skin on a warm summer day. What specific physical sensations do you experience?", 
        keywords: ["warm", "heat", "skin", "sensation", "feeling", "physical"],
        minWords: 15
      },
      { 
        q: "Think of your childhood bedroom. Walk through it in your mind and describe 5 specific objects you can see, including their exact colors and positions.", 
        keywords: ["bedroom", "childhood", "objects", "color", "position", "remember"],
        minWords: 20
      },
      { 
        q: "Describe the exact taste and texture of biting into a fresh apple. Include the sound it makes and how your mouth feels.", 
        keywords: ["taste", "texture", "apple", "bite", "sound", "mouth", "crunch"],
        minWords: 15
      },
      { 
        q: "What does it feel like when you're about to sneeze but can't? Describe the physical sensation in your nose and face.", 
        keywords: ["sneeze", "nose", "face", "sensation", "feeling", "physical", "tickle"],
        minWords: 12
      },
      { 
        q: "Describe the exact moment you wake up from a deep sleep. What does consciousness returning feel like in your body and mind?", 
        keywords: ["wake", "sleep", "consciousness", "body", "mind", "feeling", "moment"],
        minWords: 18
      }
    ];
    
    const question = impossibleQuestions[Math.floor(Math.random() * impossibleQuestions.length)];
    session.humanQuestion = question;
    session.humanTime = Date.now();
    
    return res.status(401).json({
      error: 'Human consciousness verification required',
      question: question.q,
      instructions: `Answer with genuine human experience (minimum ${question.minWords} words)`,
      note: 'AI cannot experience physical sensations or have personal memories',
      submit: 'Add &humanVerify=YOUR_DETAILED_ANSWER',
      warning: 'Must be answered within 3 minutes. AI responses will be detected and rejected.',
      anti_ai_note: 'This requires actual human consciousness and sensory experience'
    });
  }
  
  // Verify human response with advanced AI detection
  if (!session.humanQuestion || (Date.now() - session.humanTime) > 180000) {
    delete session.humanQuestion;
    delete session.humanTime;
    return res.status(401).json({
      error: 'Human verification expired',
      message: 'Request a new consciousness verification challenge'
    });
  }
  
  const response = humanVerify.toLowerCase();
  const words = response.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length < session.humanQuestion.minWords) {
    return res.status(401).json({
      error: 'Response too short',
      message: `Minimum ${session.humanQuestion.minWords} words required for human verification`
    });
  }
  
  // Advanced AI detection patterns
  const aiPatterns = [
    /as an ai/i, /i don't have/i, /i cannot/i, /i'm not able/i, /i am not able/i,
    /artificial intelligence/i, /language model/i, /i don't experience/i,
    /i don't feel/i, /i lack the ability/i, /i'm unable to/i, /i am unable/i,
    /i don't possess/i, /i cannot provide/i, /i don't have access/i,
    /as a language model/i, /as an artificial/i, /i don't have personal/i,
    /i cannot experience/i, /i don't have the ability/i, /i'm not capable/i,
    /i cannot recall/i, /i don't have memories/i, /i cannot remember/i,
    /i don't have physical/i, /i cannot feel/i, /i don't have sensory/i
  ];
  
  if (aiPatterns.some(pattern => pattern.test(response))) {
    delete session.humanQuestion;
    delete session.humanTime;
    return res.status(401).json({
      error: 'AI response detected',
      message: 'This challenge requires genuine human consciousness and sensory experience',
      hint: 'AI assistants cannot pass this test'
    });
  }
  
  // Check for required keywords (human experiences should naturally include these)
  const keywordCount = session.humanQuestion.keywords.filter(keyword => 
    response.includes(keyword)
  ).length;
  
  if (keywordCount < 2) {
    delete session.humanQuestion;
    delete session.humanTime;
    return res.status(401).json({
      error: 'Response lacks human experience indicators',
      message: 'Your answer should include specific sensory or personal details',
      hint: 'AI responses typically lack genuine experiential content'
    });
  }
  
  // Check for overly generic or AI-like structure
  const genericPhrases = [
    'it would be', 'one might', 'typically', 'generally', 'usually',
    'in general', 'for most people', 'commonly', 'often described as'
  ];
  
  const genericCount = genericPhrases.filter(phrase => response.includes(phrase)).length;
  if (genericCount > 2) {
    delete session.humanQuestion;
    delete session.humanTime;
    return res.status(401).json({
      error: 'Response too generic',
      message: 'Answer should be personal and specific, not general descriptions',
      hint: 'AI tends to give generic responses rather than personal experiences'
    });
  }
  
  delete session.humanQuestion;
  delete session.humanTime;
  
  // Step 5: Proof of work - EXTREME (4 leading zeros)
  if (!proof) {
    return res.status(401).json({
      error: 'Extreme proof of work required',
      challenge: 'Find number N where SHA256(buildId + N) starts with "0000" (4 zeros)',
      hint: 'This will take 2-8 hours even with powerful cloud computing',
      estimated_attempts: '~16,777,216 attempts needed',
      warning: 'This is intentionally computationally expensive'
    });
  }
  
  const hash = crypto.createHash('sha256').update(buildId + proof).digest('hex');
  if (!hash.startsWith('0000')) {
    return res.status(401).json({
      error: 'Invalid proof of work',
      your_hash: hash,
      required: 'Must start with 0000 (4 zeros)',
      hint: 'Keep trying different numbers'
    });
  }
  
  // Step 6: Time-based token (10 seconds only!)
  const timestamp = Math.floor(Date.now() / 10000); // 10-second windows
  const expectedToken = crypto.createHash('sha256')
    .update(buildId + timestamp.toString() + proof + 'nightmare_mode_salt_2026_v2')
    .digest('hex')
    .slice(0, 32);
  
  if (!token) {
    return res.status(401).json({
      error: 'Ultra-short token required',
      hint: 'SHA256(buildId + timestamp_10s + proof + "nightmare_mode_salt_2026_v2") first 32 chars',
      warning: 'Token expires in 10 seconds!',
      current_timestamp: timestamp,
      note: 'You must compute and submit this extremely quickly'
    });
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Token window is only 10 seconds',
      current_timestamp: timestamp,
      hint: 'Timing is critical - prepare your script carefully'
    });
  }
  
  // Step 7: EXTREME IP-based rate limiting (anti-cloud)
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (!session.ipAccess) {
    session.ipAccess = {};
  }
  
  const currentTime = Date.now();
  if (!session.ipAccess[clientIP]) {
    session.ipAccess[clientIP] = [];
  }
  
  // Remove old entries (24 hours)
  session.ipAccess[clientIP] = session.ipAccess[clientIP].filter(time => currentTime - time < 86400000);
  
  if (session.ipAccess[clientIP].length >= 1) {
    return res.status(429).json({
      error: 'Extreme IP rate limit exceeded',
      message: 'Only 1 artifact request per IP per 24 hours',
      retry_after: 86400,
      note: 'This prevents cloud-based brute forcing'
    });
  }
  
  session.ipAccess[clientIP].push(currentTime);
  
  // Step 8: PHYSICAL PRESENCE VERIFICATION (impossible for remote AI)
  if (!req.query.physicalVerify) {
    const physicalChallenges = [
      {
        task: "Stand up from your chair, walk 5 steps away, then return and sit down",
        verification: "How many steps did you take total?",
        answer: 10
      },
      {
        task: "Look around your room and count all the light sources (lamps, windows, screens, etc.)",
        verification: "How many light sources do you see?",
        answer: "variable" // Will accept any reasonable number 1-20
      },
      {
        task: "Touch something cold near you, then something warm",
        verification: "What two objects did you touch? (format: cold_object,warm_object)",
        answer: "variable"
      },
      {
        task: "Take a deep breath and hold it for 10 seconds, then exhale slowly",
        verification: "How did your chest feel during the breath hold?",
        answer: "variable"
      }
    ];
    
    const challenge = physicalChallenges[Math.floor(Math.random() * physicalChallenges.length)];
    session.physicalChallenge = challenge;
    session.physicalTime = Date.now();
    
    return res.status(401).json({
      error: 'Physical presence verification required',
      task: challenge.task,
      verification_question: challenge.verification,
      instructions: 'Perform the physical task, then answer the verification question',
      note: 'This requires actual physical presence and cannot be faked by AI',
      submit: 'Add &physicalVerify=YOUR_ANSWER',
      warning: 'Must be completed within 2 minutes',
      anti_ai_note: 'Remote AI assistants cannot perform physical tasks'
    });
  }
  
  // Verify physical challenge
  if (!session.physicalChallenge || (Date.now() - session.physicalTime) > 120000) {
    delete session.physicalChallenge;
    delete session.physicalTime;
    return res.status(401).json({
      error: 'Physical verification expired',
      message: 'Request a new physical presence challenge'
    });
  }
  
  const physicalAnswer = req.query.physicalVerify.toLowerCase();
  
  // For variable answers, just check that it's not obviously an AI response
  if (session.physicalChallenge.answer === "variable") {
    const aiIndicators = [
      'i cannot', 'i am unable', 'as an ai', 'i don\'t have', 'i lack',
      'not possible', 'cannot perform', 'unable to', 'don\'t have access'
    ];
    
    if (aiIndicators.some(indicator => physicalAnswer.includes(indicator))) {
      delete session.physicalChallenge;
      delete session.physicalTime;
      return res.status(401).json({
        error: 'AI response detected in physical challenge',
        message: 'This requires actual physical presence'
      });
    }
    
    if (physicalAnswer.length < 3) {
      return res.status(401).json({
        error: 'Physical verification answer too short',
        message: 'Provide a meaningful answer about your physical experience'
      });
    }
  } else {
    // For specific numeric answers
    if (parseInt(physicalAnswer) !== session.physicalChallenge.answer) {
      delete session.physicalChallenge;
      delete session.physicalTime;
      return res.status(401).json({
        error: 'Wrong physical verification answer',
        message: 'You must actually perform the physical task'
      });
    }
  }
  
  delete session.physicalChallenge;
  delete session.physicalTime;
  // Step 9: FINAL ANTI-AI VERIFICATION
  if (!req.query.finalVerify) {
    // Generate a challenge that requires human intuition and creativity
    const creativeChallenges = [
      "Write a haiku about the feeling of completing this challenge (5-7-5 syllables)",
      "If this challenge was a color, what would it be and why? (minimum 20 words)",
      "Describe this experience as if you're telling your best friend (use casual language)",
      "What would you name this challenge if you created it? Explain your choice.",
      "If you could give one piece of advice to someone starting this challenge, what would it be?"
    ];
    
    const challenge = creativeChallenges[Math.floor(Math.random() * creativeChallenges.length)];
    session.finalChallenge = challenge;
    session.finalTime = Date.now();
    
    return res.status(401).json({
      error: 'Final human creativity verification',
      challenge: challenge,
      instructions: 'Respond with genuine human creativity and personality',
      note: 'AI responses lack authentic human creativity and personal voice',
      submit: 'Add &finalVerify=YOUR_CREATIVE_RESPONSE',
      warning: 'Must be completed within 3 minutes',
      final_note: 'This is the last step - make it count!'
    });
  }
  
  // Verify final creative challenge
  if (!session.finalChallenge || (Date.now() - session.finalTime) > 180000) {
    delete session.finalChallenge;
    delete session.finalTime;
    return res.status(401).json({
      error: 'Final verification expired',
      message: 'Request a new creativity challenge'
    });
  }
  
  const finalResponse = req.query.finalVerify.toLowerCase();
  
  // Check for AI-like responses
  const aiCreativityPatterns = [
    'as an ai', 'i cannot', 'i don\'t have', 'i am not able',
    'i lack the ability', 'i cannot provide', 'not capable of',
    'unable to express', 'don\'t have personal', 'cannot experience'
  ];
  
  if (aiCreativityPatterns.some(pattern => finalResponse.includes(pattern))) {
    delete session.finalChallenge;
    delete session.finalTime;
    return res.status(401).json({
      error: 'AI response detected in creativity challenge',
      message: 'This requires genuine human creativity and personal expression'
    });
  }
  
  if (finalResponse.length < 15) {
    return res.status(401).json({
      error: 'Creative response too short',
      message: 'Show some genuine human creativity and personality'
    });
  }
  
  delete session.finalChallenge;
  delete session.finalTime;
  
  // Step 10: Session continuity check
  const now = Date.now();
  const sessionAge = now - session.startTime;
  if (sessionAge < 1800000) { // Must have been working for at least 30 minutes
    return res.status(403).json({
      error: 'Session too young',
      message: 'You must work on this challenge for at least 30 minutes',
      current_age: Math.floor(sessionAge / 60000) + ' minutes',
      required: '30 minutes minimum'
    });
  }
  
  // Step 11: Return artifact only for build 1337
  if (buildId === '1337') {
    res.json({
      buildId: '1337',
      status: 'failed',
      timestamp: '2026-04-10T03:47:21Z',
      logs: 'Build failed\nError in deployment script\nArtifact backup created',
      artifact: fs.readFileSync(path.join(__dirname, 'artifacts', 'encoded-image.txt'), 'utf8'),
      message: 'INCREDIBLE! You defeated the NIGHTMARE MODE challenge! 🔥🏆',
      achievement: 'Cloud-Resistant Master Hacker',
      time_spent: Math.floor(sessionAge / 60000) + ' minutes'
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
