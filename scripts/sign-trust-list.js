#!/usr/bin/env node
/**
 * Sign Trust List Script
 * 
 * Creates a JWS-signed version of the trust list for integrity verification.
 * This is an EXTENSION to TS11 to support private trust anchors.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Read the trust list
const trustListPath = path.join(rootDir, 'trust-lists/gym-members.json');
const trustList = JSON.parse(fs.readFileSync(trustListPath, 'utf8'));

// Read the private key
const privateKeyPath = path.join(rootDir, 'keys/trust-list-signer.pem');
const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');

// Base64URL encode helper
function base64url(data) {
  return Buffer.from(data).toString('base64url');
}

// Create JWS header
const header = {
  alg: 'ES256',
  typ: 'trustlist+jwt',
  kid: 'trust-list-signer-2025'
};

// Create protected header
const protectedHeader = base64url(JSON.stringify(header));

// Create payload
const payload = base64url(JSON.stringify(trustList));

// Sign
const sign = crypto.createSign('SHA256');
sign.update(protectedHeader + '.' + payload);
const signature = sign.sign({ key: privateKeyPem, dsaEncoding: 'ieee-p1363' }, 'base64url');

// Create compact JWS
const jws = protectedHeader + '.' + payload + '.' + signature;

// Write to file
const outputPath = path.join(rootDir, 'trust-lists/gym-members.jws');
fs.writeFileSync(outputPath, jws);

console.log('✅ Signed trust list created:', outputPath);
console.log('');
console.log('JWS Header:', JSON.stringify(header, null, 2));
console.log('');
console.log('JWS Length:', jws.length, 'characters');

// Also export the public key as JWK
const publicKeyPem = fs.readFileSync(path.join(rootDir, 'keys/trust-list-signer.pub.pem'), 'utf8');
const publicKey = crypto.createPublicKey(publicKeyPem);
const jwk = publicKey.export({ format: 'jwk' });
jwk.kid = 'trust-list-signer-2025';
jwk.use = 'sig';
jwk.alg = 'ES256';

const jwkPath = path.join(rootDir, 'keys/trust-list-signer.jwk.json');
fs.writeFileSync(jwkPath, JSON.stringify(jwk, null, 2));
console.log('');
console.log('✅ Public key JWK exported:', jwkPath);
console.log(JSON.stringify(jwk, null, 2));
