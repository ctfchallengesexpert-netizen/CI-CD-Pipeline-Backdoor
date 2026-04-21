# CI/CD Pipeline Backdoor Challenge 🔥

## Expert-Level Multi-Stage CTF Challenge

[![Difficulty](https://img.shields.io/badge/Difficulty-Expert-red)]()
[![Time](https://img.shields.io/badge/Time-4--8%20hours-orange)]()
[![Stages](https://img.shields.io/badge/Stages-7-blue)]()

A comprehensive, expert-level CTF challenge that simulates a real-world CI/CD pipeline backdoor investigation. This challenge requires skills across multiple domains: web exploitation, steganography, cryptography, reverse engineering, and network forensics.

## 🎯 Challenge Overview

**Scenario:** You've been hired as a security consultant to audit a company's CI/CD pipeline. Intelligence suggests that a disgruntled developer planted a backdoor in the build system before leaving. Your mission: find the evidence and extract the proof.

**Target:** `http://localhost:3000`  
**Flag Format:** `flag{...}`

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate challenge artifacts
npm run generate

# 3. Start the server
npm start

# 4. Visit http://localhost:3000
```

**That's it!** The challenge is now running. See [QUICKSTART.md](QUICKSTART.md) for more details.

## 📋 Challenge Stages

| Stage | Skill Domain | Difficulty | Description |
|-------|-------------|------------|-------------|
| 1️⃣ | Web Recon | ⭐⭐ | Find hidden API endpoints (IDOR vulnerability) |
| 2️⃣ | Encoding | ⭐ | Decode obfuscated base64 data |
| 3️⃣ | Steganography | ⭐⭐⭐ | Extract hidden ZIP from PNG image |
| 4️⃣ | Crypto Analysis | ⭐⭐⭐⭐ | Analyze misleading encryption config |
| 5️⃣ | Reverse Engineering | ⭐⭐⭐⭐ | Reverse engineer weak key derivation |
| 6️⃣ | Decryption | ⭐⭐⭐ | Decrypt payload with weak crypto |
| 7️⃣ | Network Forensics | ⭐⭐⭐⭐ | Analyze PCAP for DNS exfiltration |

## 🛠️ Skills Required

- **Web Security:** API enumeration, IDOR exploitation
- **Steganography:** Hidden data detection, file format analysis
- **Cryptography:** Weak crypto identification, key derivation
- **Reverse Engineering:** Script analysis, logic reconstruction
- **Network Forensics:** PCAP analysis, DNS exfiltration patterns
- **Tool Chaining:** Combining multiple tools and techniques

## 🔧 Tools Needed

- **Web:** curl, browser dev tools
- **Encoding:** base64, xxd
- **Steganography:** binwalk, steghide, zsteg
- **Crypto:** openssl
- **Forensics:** Wireshark/tshark, scapy
- **General:** file, grep, dd, unzip

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 3 minutes
- **[CHALLENGE.md](CHALLENGE.md)** - Full challenge description for participants
- **[SOLUTION.md](solution/SOLUTION.md)** - Complete walkthrough (spoilers!)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[DIFFICULTY_ENHANCEMENTS.md](DIFFICULTY_ENHANCEMENTS.md)** - Optional difficulty additions
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Project organization

## 💡 Features

### ✅ Multi-Domain Challenge
- Requires expertise across 5+ security domains
- No single tool solves everything
- Realistic attack chain simulation

### ✅ Expert-Level Difficulty
- Obfuscated data encoding
- Multi-layer steganography
- Misleading cryptography
- Weak key derivation patterns
- DNS exfiltration simulation
- Multiple red herrings and decoy flags

### ✅ Educational Value
- Real-world CI/CD security scenarios
- Common vulnerability patterns
- Proper tool usage examples
- Complete solution scripts provided

### ✅ Easy Deployment
- One-command setup
- Docker support included
- Automated artifact generation
- Setup verification script

### ✅ Customizable
- Easy flag modification
- Adjustable difficulty levels
- Optional enhancement modules
- Configurable time-based hints

## 🐳 Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t ctf-challenge .
docker run -p 3000:3000 ctf-challenge
```

## 🧪 Verify Setup

```bash
npm run verify
```

This checks:
- ✅ Node.js version compatibility
- ✅ Required files present
- ✅ Dependencies installed
- ✅ Artifacts generated
- ✅ Server running

## 🎓 Learning Objectives

By completing this challenge, you will:

1. Understand real-world CI/CD security risks
2. Practice multi-stage attack chains
3. Learn to identify weak cryptography
4. Develop network forensics skills
5. Improve tool-chaining abilities
6. Recognize common vulnerability patterns

## ⚠️ Security Warning

**This challenge contains intentionally vulnerable code for educational purposes:**

- IDOR (Insecure Direct Object Reference)
- Information disclosure
- Weak cryptography
- Hardcoded secrets
- Debug endpoints in production
- No authentication on sensitive endpoints

**❌ DO NOT deploy in production environments!**  
**✅ Only use in isolated CTF/educational settings**

## 🏁 Solution Scripts

Automated solution scripts are provided in `solution/`:

```bash
# Verify setup
npm run verify

# Stage 1: Enumerate builds
./solution/enumerate-builds.sh

# Stage 2: Decode base64
./solution/decode-base64.sh encoded.txt

# Stage 3: Extract steganography
./solution/extract-stego.sh image.png

# Stage 6: Decrypt payload
./solution/decrypt.sh

# Stage 7: Extract flag
python3 solution/extract-flag.py capture.pcap

# Complete automated solution
./solution/full-solve.sh
```

## 📊 Difficulty Levels

| Audience | Expected Time | Notes |
|----------|--------------|-------|
| Beginner | 10-15 hours | May need hints and research |
| Intermediate | 6-10 hours | Familiar with some techniques |
| Advanced | 3-5 hours | Experienced in multiple domains |
| Expert | 1-3 hours | Quick tool identification |

## 🎯 Challenge Highlights

- **Realistic Scenario:** Based on actual CI/CD security incidents
- **No Guessing:** Every stage requires logical problem-solving
- **Tool Diversity:** Tests breadth of security knowledge
- **Red Herrings:** Multiple decoy flags and misleading paths
- **Progressive Difficulty:** Each stage builds on previous knowledge
- **Complete Documentation:** Full walkthrough and solution scripts

## 🤝 Use Cases

- **CTF Competitions:** Expert-level challenge for competitions
- **Security Training:** Teach multi-domain security skills
- **Job Interviews:** Assess candidate technical abilities
- **Self-Learning:** Practice advanced security techniques
- **Team Building:** Collaborative problem-solving exercise

## 📦 What's Included

```
├── Web Application (Express.js)
├── 7 Challenge Stages
├── Automated Artifact Generation
├── Complete Solution Scripts
├── Docker Deployment Files
├── Comprehensive Documentation
└── Setup Verification Tools
```

## 🔄 Customization

Want to make it harder? See [DIFFICULTY_ENHANCEMENTS.md](DIFFICULTY_ENHANCEMENTS.md) for:

- Custom encoding schemes
- LSB steganography
- Multi-stage encryption
- Rate limiting
- Anti-automation measures
- Polyglot files
- And more...

## 📝 NPM Scripts

```bash
npm install          # Install dependencies
npm run generate     # Generate challenge artifacts
npm start            # Start the server
npm run verify       # Verify setup
npm test             # Run verification
npm run setup        # Install + generate (one command)
```

## 🐛 Troubleshooting

**Artifacts not generating?**
```bash
npm run generate
```

**Server won't start?**
```bash
npm run verify
```

**Port 3000 in use?**
```bash
PORT=8080 npm start
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more troubleshooting tips.

## 📄 License

Educational use only. This project contains intentionally vulnerable code for learning purposes.

## 🙏 Credits

Challenge design inspired by real-world CI/CD security incidents and common vulnerability patterns found in production systems.

---

**Ready to begin?** Start with [QUICKSTART.md](QUICKSTART.md) or jump straight in:

```bash
npm install && npm run generate && npm start
```

**Good luck! 🚀**
