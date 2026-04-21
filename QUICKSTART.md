# Quick Start Guide

Get the challenge running in 3 minutes.

## Prerequisites

- Node.js 16+ installed
- npm installed

## Setup (3 steps)

```bash
# 1. Install dependencies
npm install

# 2. Generate challenge artifacts
npm run generate

# 3. Start the server
npm start
```

That's it! The challenge is now running at `http://localhost:3000`

## Verify Setup

```bash
npm run verify
```

This checks:
- ✅ Node.js version
- ✅ Required files
- ✅ Dependencies installed
- ✅ Artifacts generated
- ✅ Server running

## First Steps

1. **Visit the challenge:**
   ```
   http://localhost:3000
   ```

2. **Try logging in:**
   - Username: `admin`
   - Password: `admin123`

3. **Start exploring:**
   - Check the dashboard
   - Look for hidden endpoints
   - Enumerate API paths

## Hints

- Not all endpoints are documented
- Build IDs might be interesting
- Check the HTML source for comments
- Failed builds sometimes contain useful data

## Tools You'll Need

- **Web:** curl, browser dev tools
- **Encoding:** base64, xxd
- **Steganography:** binwalk (install: `brew install binwalk` or `apt-get install binwalk`)
- **Crypto:** openssl (usually pre-installed)
- **Forensics:** wireshark or tshark

## Getting Stuck?

1. Check time-based hints: `curl http://localhost:3000/api/hints`
2. Read CHALLENGE.md for more context
3. Review SOLUTION.md (but try without it first!)

## Solution Scripts

Automated solution scripts are in `solution/`:

```bash
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

# Full automated solve
./solution/full-solve.sh
```

## Troubleshooting

### Port 3000 already in use
```bash
# Use a different port
PORT=8080 npm start
```

### Artifacts not generating
```bash
# Check Node.js version
node --version  # Should be 16+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run generate
```

### Server won't start
```bash
# Check for errors
npm start

# Verify setup
npm run verify
```

## Docker (Alternative)

```bash
# Build
docker build -t ctf-challenge .

# Run
docker run -p 3000:3000 ctf-challenge
```

## Next Steps

Once you've completed the challenge:

1. Document your solution path
2. Try finding alternative methods
3. Review DIFFICULTY_ENHANCEMENTS.md for harder variants
4. Share your methodology with others

---

**Good luck! 🚀**

Flag format: `flag{...}`
