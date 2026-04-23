const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

// Create directories
const dirs = ['artifacts', 'scripts'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('🔨 Generating challenge artifacts...\n');

// Stage 7: Create PCAP file (final payload)
console.log('📦 Stage 7: Creating network capture file...');
const pcapData = createPcapFile();
fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'capture.pcap'), pcapData);

// Stage 6: Encrypt the PCAP file
console.log('🔐 Stage 6: Encrypting payload with weak crypto...');
const encryptedPayload = weakEncrypt(pcapData);
fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'encrypted_payload.bin'), encryptedPayload);

// Stage 5: Create build.sh with weak key derivation
console.log('🛠️  Stage 5: Creating build script...');
const buildScript = `#!/bin/bash
# CI/CD Build Script v2.1.4
# Auto-generated - DO NOT EDIT

set -e

echo "Starting build process..."

# Environment setup
export BUILD_ENV="production"
export NODE_ENV="production"

# Obfuscated key derivation (intentional vulnerability)
# Step 1: Base secret
BASE_SECRET="qri_frperg_123"

# Step 2: Apply ROT13 to get real secret
SECRET_KEY=\$(echo "\$BASE_SECRET" | tr 'A-Za-z' 'N-ZA-Mn-za-m')

# Step 3: Hash it
HASH_KEY=\$(echo -n "\$SECRET_KEY" | sha256sum | cut -d' ' -f1)
export DEPLOY_KEY=\$HASH_KEY

# Additional obfuscation
SALT="hardcoded_salt_2023"
IV="1234567890abcdef"

# Decryption function (for artifact recovery)
decrypt_artifact() {
    local input_file=\$1
    local output_file=\$2
    
    # Derive the key properly
    local secret=\$(echo "qri_frperg_123" | tr 'A-Za-z' 'N-ZA-Mn-za-m')
    
    # Using weak crypto parameters
    openssl enc -d -aes-256-cbc \\
        -in "\$input_file" \\
        -out "\$output_file" \\
        -K \$(echo -n "\$secret" | sha256sum | cut -d' ' -f1) \\
        -iv \$(echo -n "\$IV" | xxd -p)
}

# Build steps
npm install --production
npm run build
npm test

# Artifact backup (suspicious)
if [ -f "encrypted_payload.bin" ]; then
    echo "Creating artifact backup..."
    decrypt_artifact "encrypted_payload.bin" "backup.pcap"
fi

echo "Build completed successfully!"
`;

fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'build.sh'), buildScript);
fs.chmodSync(path.join(__dirname, '..', 'artifacts', 'build.sh'), '755');

// Stage 4: Create config.yaml with misleading crypto
console.log('⚙️  Stage 4: Creating configuration file...');
const configYaml = `# CI/CD Pipeline Configuration
version: "2.1.4"
environment: production

# Encryption settings (DO NOT COMMIT)
crypto:
  algorithm: AES-256-CBC
  key: U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkwB0K1Y=
  iv: MTIzNDU2Nzg5MGFiY2RlZg==
  salt: hardcoded_salt_2023
  iterations: 1000
  
# Deployment settings
deploy:
  target: production
  rollback: enabled
  backup: enabled
  
# Build artifacts
artifacts:
  retention: 30d
  compression: gzip
  encryption: enabled
  
# Monitoring
monitoring:
  enabled: true
  endpoint: https://monitor.example.com
  
# Fake data to mislead
debug:
  message: "Debug mode disabled in production"
  
# Notes
# Key derivation: echo -n "dev_secret_123" | sha256sum
# See build.sh for implementation details
# Decryption requires solving: ROT13(key) + reverse
`;

fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'config.yaml'), configYaml);

// Stage 3: Create ZIP with config and build script
console.log('📁 Stage 3: Creating hidden archive...');
createZipArchive().then(() => {
  // Stage 2: Create PNG image with hidden ZIP
  console.log('🖼️  Stage 2: Creating steganographic image...');
  return createStegoImage();
}).then(() => {
  finishGeneration();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

function finishGeneration() {

// Stage 1: Encode image to base64
console.log('🔤 Stage 1: Encoding image to base64...');
const imageData = fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'stego-image.png'));
const base64Image = imageData.toString('base64');

// Add some obfuscation - split into chunks with fake data
const obfuscatedData = obfuscateBase64(base64Image);
fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'encoded-image.txt'), obfuscatedData);

  console.log('\n✅ All artifacts generated successfully!');
  console.log('\n📋 Challenge stages:');
  console.log('1. Find hidden endpoint (/api/build/logs?id=1337)');
  console.log('2. Decode base64 to get PNG image');
  console.log('3. Extract hidden ZIP from image');
  console.log('4. Analyze config.yaml and build.sh');
  console.log('5. Reverse engineer weak crypto');
  console.log('6. Decrypt payload to get PCAP');
  console.log('7. Analyze network traffic for flag');
  console.log('\n🏁 Challenge complete!\n');
}

// Helper functions

function createPcapFile() {
  // Create a minimal PCAP file with DNS exfiltration
  // PCAP Global Header
  const globalHeader = Buffer.alloc(24);
  globalHeader.writeUInt32LE(0xa1b2c3d4, 0);  // Magic number
  globalHeader.writeUInt16LE(2, 4);            // Major version
  globalHeader.writeUInt16LE(4, 6);            // Minor version
  globalHeader.writeInt32LE(0, 8);             // Timezone
  globalHeader.writeUInt32LE(0, 12);           // Timestamp accuracy
  globalHeader.writeUInt32LE(65535, 16);       // Snapshot length
  globalHeader.writeUInt32LE(1, 20);           // Link-layer type (Ethernet)
  
  const packets = [];
  
  // Create DNS query packets with exfiltrated data
  const flagParts = [
    'flag{n1ghtm4r3_',
    'm0d3_unl0ck3d_',
    'cl0ud_d3f34t3d_',
    'h4ck3r_g0d}'
  ];
  
  const domains = [
    'exfil-primary.backup-cdn.net',
    'data-stream.analytics-srv.io', 
    'logs-collector.cloud-api.com',
    'metrics-endpoint.security-hub.org'
  ];
  
  let domainIndex = 0;
  flagParts.forEach((part, index) => {
    const domain = domains[domainIndex % domains.length];
    const dnsQuery = createDnsPacket(part, index, domain);
    packets.push(dnsQuery);
    domainIndex++;
  });
  
  // Add 50+ noise packets with realistic domains to make analysis harder
  const noiseDomains = [
    'api.github.com', 'cdn.cloudflare.net', 'tracking.google-analytics.com',
    'update.microsoft.com', 'assets.githubusercontent.com', 'registry.npmjs.org',
    'download.docker.com', 'releases.ubuntu.com', 'security.debian.org',
    'packages.elastic.co', 'repo.mongodb.org', 'archive.apache.org',
    'maven.central.com', 'pypi.python.org', 'rubygems.org', 'crates.io',
    'fonts.googleapis.com', 'ajax.googleapis.com', 'code.jquery.com',
    'stackpath.bootstrapcdn.com', 'unpkg.com', 'jsdelivr.net',
    'cdnjs.cloudflare.com', 'maxcdn.bootstrapcdn.com', 'fontawesome.com',
    'gravatar.com', 'wordpress.org', 'wp.com', 'jetpack.wordpress.com',
    'stats.wp.com', 'pixel.wp.com', 'public-api.wordpress.com',
    'ssl.google-analytics.com', 'www.google-analytics.com', 'doubleclick.net',
    'googlesyndication.com', 'googleadservices.com', 'googletagmanager.com',
    'facebook.com', 'connect.facebook.net', 'graph.facebook.com',
    'twitter.com', 'abs.twimg.com', 'pbs.twimg.com', 'platform.twitter.com',
    'linkedin.com', 'static.licdn.com', 'media.licdn.com',
    'instagram.com', 'scontent.cdninstagram.com', 'youtube.com',
    'i.ytimg.com', 's.ytimg.com', 'googlevideo.com'
  ];
  
  // Generate 80 noise packets to hide the real data
  for (let i = 0; i < 80; i++) {
    const noiseDomain = noiseDomains[i % noiseDomains.length];
    packets.push(createNoisePacket(i, noiseDomain));
  }
  
  return Buffer.concat([globalHeader, ...packets]);
}

function createDnsPacket(data, index, domain) {
  // Simplified DNS packet creation
  const timestamp = Math.floor(Date.now() / 1000) + index;
  
  // Packet header (16 bytes)
  const packetHeader = Buffer.alloc(16);
  packetHeader.writeUInt32LE(timestamp, 0);
  packetHeader.writeUInt32LE(0, 4);
  
  // DNS query: hex_data.domain
  const query = `${Buffer.from(data).toString('hex')}.${domain}`;
  const dnsData = Buffer.from(query, 'utf8');
  
  packetHeader.writeUInt32LE(dnsData.length + 42, 8);  // Captured length
  packetHeader.writeUInt32LE(dnsData.length + 42, 12); // Original length
  
  // Simplified Ethernet + IP + UDP + DNS headers (42 bytes) + data
  const headers = Buffer.alloc(42);
  const packet = Buffer.concat([packetHeader, headers, dnsData]);
  
  return packet;
}

function createNoisePacket(index, domain) {
  const timestamp = Math.floor(Date.now() / 1000) + index + 100;
  const packetHeader = Buffer.alloc(16);
  packetHeader.writeUInt32LE(timestamp, 0);
  packetHeader.writeUInt32LE(0, 4);
  
  const noise = Buffer.from(`request${index}.${domain}`, 'utf8');
  packetHeader.writeUInt32LE(noise.length + 42, 8);
  packetHeader.writeUInt32LE(noise.length + 42, 12);
  
  const headers = Buffer.alloc(42);
  return Buffer.concat([packetHeader, headers, noise]);
}

function weakEncrypt(data) {
  // Intentionally weak encryption matching build.sh
  // SHA1 produces 20 bytes, but AES-256 needs 32 bytes
  // So we'll use SHA256 instead to get 32 bytes
  const key = crypto.createHash('sha256').update('dev_secret_123').digest();
  const iv = Buffer.from('1234567890abcdef');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  
  return encrypted;
}

function createZipArchive() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(__dirname, '..', 'artifacts', 'hidden.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', resolve);
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.file(path.join(__dirname, '..', 'artifacts', 'config.yaml'), { name: 'config.yaml' });
    archive.file(path.join(__dirname, '..', 'artifacts', 'build.sh'), { name: 'build.sh' });
    archive.finalize();
  });
}

function createStegoImage() {
  return new Promise((resolve, reject) => {
    try {
  // Create a simple PNG image using raw buffer manipulation
  // Since we don't have canvas in Node.js by default, we'll create a minimal PNG
  
  const width = 400;
  const height = 300;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdr = createPngChunk('IHDR', Buffer.concat([
    Buffer.from([0, 0, 0x01, 0x90]), // Width (400)
    Buffer.from([0, 0, 0x01, 0x2C]), // Height (300)
    Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]) // Bit depth, color type, etc.
  ]));
  
  // Create simple gradient image data
  const imageData = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    imageData[y * (width * 3 + 1)] = 0; // Filter type
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      imageData[offset] = Math.floor((x / width) * 255);     // R
      imageData[offset + 1] = Math.floor((y / height) * 255); // G
      imageData[offset + 2] = 128;                            // B
    }
  }
  
  // Compress image data
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(imageData);
  const idat = createPngChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createPngChunk('IEND', Buffer.alloc(0));
  
  // Read the ZIP file to append
  const zipData = fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'hidden.zip'));
  
      // Combine: PNG + ZIP (classic steganography technique)
      const stego = Buffer.concat([signature, ihdr, idat, iend, zipData]);
      
      fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'stego-image.png'), stego);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function createPngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = calculateCrc(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCrc(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function obfuscateBase64(base64) {
  // Add fake data and comments to make it harder
  const chunks = base64.match(/.{1,64}/g) || [];
  const obfuscated = [];
  
  obfuscated.push('# Build artifact backup - Base64 encoded');
  obfuscated.push('# Generated: 2026-04-10T03:47:21Z');
  obfuscated.push('# Build ID: 1337');
  obfuscated.push('# Format: PNG image');
  obfuscated.push('');
  obfuscated.push('[ARTIFACT_DATA_START]');
  
  // Add some fake chunks
  obfuscated.push('# Checksum: ' + crypto.randomBytes(16).toString('hex'));
  obfuscated.push('');
  
  // XOR obfuscation with key
  const xorKey = 0x42;
  const obfuscatedChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    let obfChunk = '';
    for (let j = 0; j < chunks[i].length; j++) {
      const charCode = chunks[i].charCodeAt(j);
      obfChunk += String.fromCharCode(charCode ^ xorKey);
    }
    obfuscatedChunks.push(Buffer.from(obfChunk).toString('base64'));
  }
  
  obfuscatedChunks.forEach((chunk, index) => {
    if (index % 10 === 0 && index > 0) {
      // Add fake comments periodically
      obfuscated.push(`# Block ${Math.floor(index / 10)}`);
    }
    obfuscated.push(chunk);
  });
  
  obfuscated.push('');
  obfuscated.push('[ARTIFACT_DATA_END]');
  obfuscated.push('# Integrity: ' + crypto.randomBytes(20).toString('hex'));
  obfuscated.push('# XOR_KEY: 0x42');
  
  return obfuscated.join('\n');
}
