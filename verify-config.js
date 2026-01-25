#!/usr/bin/env node
/**
 * Deployment Configuration Verifier
 * Run this before deploying to catch configuration issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errors = [];
const warnings = [];
const success = [];

console.log('🔍 Verifying Gimme Deployment Configuration...\n');

// Check backend files
console.log('📦 Checking Backend...');

// Check backend/package.json
try {
  const backendPkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'backend', 'package.json'), 'utf8')
  );
  
  if (backendPkg.scripts?.start) {
    success.push('✅ Backend has start script');
  } else {
    errors.push('❌ Backend package.json missing "start" script');
  }
  
  const requiredDeps = ['express', 'cors', 'socket.io', '@supabase/supabase-js', 'multer', 'dotenv'];
  requiredDeps.forEach(dep => {
    if (backendPkg.dependencies?.[dep]) {
      success.push(`✅ Backend has ${dep}`);
    } else {
      errors.push(`❌ Backend missing dependency: ${dep}`);
    }
  });
} catch (err) {
  errors.push('❌ Cannot read backend/package.json');
}

// Check backend/.env.example
try {
  const backendEnvExample = fs.readFileSync(
    path.join(__dirname, 'backend', '.env.example'),
    'utf8'
  );
  
  const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_KEY', 'CORS_ORIGIN'];
  requiredEnvs.forEach(env => {
    if (backendEnvExample.includes(env)) {
      success.push(`✅ Backend .env.example includes ${env}`);
    } else {
      errors.push(`❌ Backend .env.example missing ${env}`);
    }
  });
} catch (err) {
  warnings.push('⚠️  Backend .env.example not found (optional but recommended)');
}

// Check backend/server.js
try {
  const serverJs = fs.readFileSync(
    path.join(__dirname, 'backend', 'server.js'),
    'utf8'
  );
  
  if (serverJs.includes('process.env.CORS_ORIGIN')) {
    success.push('✅ Backend uses CORS_ORIGIN env var');
  } else {
    warnings.push('⚠️  Backend might not be using CORS_ORIGIN env var');
  }
  
  if (serverJs.includes('process.env.PORT')) {
    success.push('✅ Backend uses PORT env var');
  } else {
    errors.push('❌ Backend not using PORT env var');
  }
  
  // Check for correct event names
  if (serverJs.includes("'join-room'") || serverJs.includes('"join-room"')) {
    success.push('✅ Backend uses correct socket event names (join-room)');
  } else {
    errors.push('❌ Backend using wrong socket event names');
  }
} catch (err) {
  errors.push('❌ Cannot read backend/server.js');
}

console.log('\n📦 Checking Frontend...');

// Check frontend package.json
try {
  const frontendPkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );
  
  if (frontendPkg.scripts?.build) {
    success.push('✅ Frontend has build script');
  } else {
    errors.push('❌ Frontend package.json missing "build" script');
  }
  
  const requiredDeps = ['react', 'socket.io-client'];
  requiredDeps.forEach(dep => {
    if (frontendPkg.dependencies?.[dep]) {
      success.push(`✅ Frontend has ${dep}`);
    } else {
      errors.push(`❌ Frontend missing dependency: ${dep}`);
    }
  });
} catch (err) {
  errors.push('❌ Cannot read package.json');
}

// Check frontend/.env.example
try {
  const frontendEnvExample = fs.readFileSync(
    path.join(__dirname, '.env.example'),
    'utf8'
  );
  
  if (frontendEnvExample.includes('VITE_API_URL')) {
    success.push('✅ Frontend .env.example includes VITE_API_URL');
  } else {
    errors.push('❌ Frontend .env.example missing VITE_API_URL');
  }
} catch (err) {
  warnings.push('⚠️  Frontend .env.example not found (optional but recommended)');
}

// Check RoomContext.jsx
try {
  const roomContext = fs.readFileSync(
    path.join(__dirname, 'src', 'context', 'RoomContext.jsx'),
    'utf8'
  );
  
  if (roomContext.includes('import.meta.env.VITE_API_URL')) {
    success.push('✅ Frontend uses VITE_API_URL env var');
  } else {
    errors.push('❌ Frontend not using VITE_API_URL env var');
  }
  
  // Check for correct event names
  if (roomContext.includes("'join-room'") || roomContext.includes('"join-room"')) {
    success.push('✅ Frontend uses correct socket event names (join-room)');
  } else {
    errors.push('❌ Frontend using wrong socket event names');
  }
  
  // Check API endpoints
  const correctEndpoints = [
    '/api/rooms/${',
    '/api/rooms/${roomPin}/contents',
    '/api/rooms/${roomPin}/files',
    '/api/rooms/${roomPin}/texts',
    '/api/files/${fileId}',
    '/api/texts/${textId}'
  ];
  
  let endpointMatches = 0;
  correctEndpoints.forEach(endpoint => {
    if (roomContext.includes(endpoint)) {
      endpointMatches++;
    }
  });
  
  if (endpointMatches >= 5) {
    success.push('✅ Frontend uses correct API endpoints');
  } else {
    errors.push(`❌ Frontend API endpoints need verification (found ${endpointMatches}/${correctEndpoints.length})`);
  }
} catch (err) {
  errors.push('❌ Cannot read src/context/RoomContext.jsx');
}

// Print results
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION RESULTS\n');

if (success.length > 0) {
  console.log('✅ SUCCESS:');
  success.forEach(msg => console.log('  ' + msg));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(msg => console.log('  ' + msg));
  console.log();
}

if (errors.length > 0) {
  console.log('❌ ERRORS:');
  errors.forEach(msg => console.log('  ' + msg));
  console.log();
}

console.log('='.repeat(50));

if (errors.length === 0) {
  console.log('\n🎉 All checks passed! Ready to deploy.\n');
  console.log('Next steps:');
  console.log('1. Commit and push your changes');
  console.log('2. Set environment variables on Render and Vercel');
  console.log('3. Deploy and test!');
  console.log('\nSee DEPLOYMENT_CHECKLIST.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log(`\n❌ Found ${errors.length} error(s). Fix them before deploying.\n`);
  console.log('See DEPLOYMENT_CHECKLIST.md for help.\n');
  process.exit(1);
}
