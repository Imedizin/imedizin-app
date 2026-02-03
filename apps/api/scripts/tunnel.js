#!/usr/bin/env node

/**
 * Automated Cloudflare Tunnel Script
 * 
 * Automatically starts a Cloudflare Tunnel, extracts the URL,
 * and updates your .env file with WEBHOOK_BASE_URL.
 * 
 * Usage:
 *   npm run tunnel              # Start Cloudflare Tunnel
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const PORT = process.env.PORT || 3000;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function updateEnvFile(tunnelUrl) {
  try {
    let envContent = '';

    // Read existing .env file if it exists
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }

    // Remove existing WEBHOOK_BASE_URL line and any comment lines before it
    envContent = envContent.replace(/^#.*Webhook.*Base.*URL.*$/mi, '');
    envContent = envContent.replace(/^WEBHOOK_BASE_URL=.*$/m, '');

    // Clean up multiple consecutive newlines
    envContent = envContent.replace(/\n{3,}/g, '\n\n');

    // Ensure there's a newline at the end
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }

    // Add new WEBHOOK_BASE_URL with comment
    const newLine = `WEBHOOK_BASE_URL=${tunnelUrl}`;
    const comment = '# Webhook Base URL (auto-updated by tunnel script)';

    // Add a blank line before if content exists
    if (envContent.trim().length > 0 && !envContent.endsWith('\n\n')) {
      envContent += '\n';
    }

    envContent += `${comment}\n${newLine}\n`;

    // Write back to file
    fs.writeFileSync(ENV_FILE, envContent, 'utf8');

    log(`\n✅ Updated .env file with: ${newLine}`, 'green');
    log(`\n💡 Restart your NestJS app to pick up the new URL:\n   npm run start:dev\n`, 'cyan');
  } catch (error) {
    log(`\n⚠️  Warning: Could not update .env file: ${error.message}`, 'yellow');
    log(`   Please manually update WEBHOOK_BASE_URL=${tunnelUrl}`, 'yellow');
  }
}

function startCloudflareTunnel() {
  log('\n🚀 Starting Cloudflare Tunnel...', 'bright');
  log(`   Local URL: http://127.0.0.1:${PORT}`, 'cyan');
  log('   Extracting tunnel URL...\n', 'cyan');

  const cloudflared = spawn('cloudflared', ['tunnel', '--url', `http://127.0.0.1:${PORT}`], {
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let outputBuffer = '';
  let tunnelUrl = null;
  let envUpdated = false;
  let isShuttingDown = false;

  cloudflared.stdout.on('data', (data) => {
    const text = data.toString();
    outputBuffer += text;
    process.stdout.write(text); // Show output to user

    // Try to extract URL from various Cloudflare output formats
    const urlPatterns = [
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/g,
      /Visit it at.*?https:\/\/([^\s]+)/g,
      /https:\/\/([a-z0-9-]+\.trycloudflare\.com)/g,
    ];

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        tunnelUrl = matches[0].replace(/Visit it at.*?https:\/\//, 'https://');
        if (!tunnelUrl.startsWith('http')) {
          tunnelUrl = 'https://' + tunnelUrl;
        }
        break;
      }
    }

    // Also check the buffer for URL patterns that might span multiple chunks
    const bufferMatches = outputBuffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (bufferMatches && !tunnelUrl) {
      tunnelUrl = bufferMatches[0];
    }

    if (tunnelUrl && !tunnelUrl.includes('trycloudflare.com')) {
      // Extract just the domain part
      const domainMatch = tunnelUrl.match(/https:\/\/([a-z0-9-]+\.trycloudflare\.com)/);
      if (domainMatch) {
        tunnelUrl = 'https://' + domainMatch[1];
      }
    }

    if (tunnelUrl && !envUpdated) {
      envUpdated = true;
      log(`\n\n🎉 Tunnel URL detected: ${tunnelUrl}`, 'green');
      updateEnvFile(tunnelUrl);
      log(`\n📡 Webhook endpoint: ${tunnelUrl}/mailbox/webhooks/graph`, 'cyan');
      log('\n✅ Tunnel is running! Keep this terminal open.\n', 'green');
      log('Press Ctrl+C to stop the tunnel.\n', 'yellow');
    }
  });

  cloudflared.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);

    // Cloudflare sometimes outputs URLs to stderr
    const urlMatch = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (urlMatch && !tunnelUrl && !envUpdated) {
      tunnelUrl = urlMatch[0];
      envUpdated = true;
      log(`\n\n🎉 Tunnel URL detected: ${tunnelUrl}`, 'green');
      updateEnvFile(tunnelUrl);
      log(`\n📡 Webhook endpoint: ${tunnelUrl}/mailbox/webhooks/graph`, 'cyan');
    }
  });

  cloudflared.on('error', (error) => {
    if (error.code === 'ENOENT') {
      log('\n❌ cloudflared is not installed.', 'red');
      log('\nInstall it using:', 'yellow');
      log('   macOS: brew install cloudflared', 'cyan');
      log('   Linux: Download from https://github.com/cloudflare/cloudflared/releases', 'cyan');
      log('   Windows: Download from https://github.com/cloudflare/cloudflared/releases', 'cyan');
      process.exit(1);
    } else {
      log(`\n❌ Error starting Cloudflare tunnel: ${error.message}`, 'red');
      process.exit(1);
    }
  });

  let forceKillTimeout = null;

  cloudflared.on('exit', (code) => {
    // Clear any pending force kill timeout
    if (forceKillTimeout) {
      clearTimeout(forceKillTimeout);
      forceKillTimeout = null;
    }

    if (code !== 0 && code !== null && !isShuttingDown) {
      log(`\n❌ Tunnel exited unexpectedly with code ${code}`, 'red');
      process.exit(code);
    } else if (isShuttingDown) {
      // Graceful shutdown completed
      process.exit(0);
    }
  });

  // Cleanup function
  const cleanup = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    log('\n\n🛑 Stopping tunnel...', 'yellow');

    if (cloudflared && !cloudflared.killed) {
      // Try graceful shutdown first (SIGTERM)
      cloudflared.kill('SIGTERM');

      // Wait for graceful shutdown, then force kill if needed
      forceKillTimeout = setTimeout(() => {
        if (cloudflared && !cloudflared.killed) {
          log('   Force killing tunnel process...', 'yellow');
          cloudflared.kill('SIGKILL');
        }
        // Exit will be handled by the exit event handler
      }, 3000);
    } else {
      process.exit(0);
    }
  };

  // Handle shutdown signals gracefully
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    log(`\n❌ Uncaught exception: ${error.message}`, 'red');
    cleanup();
  });

  // Cleanup on process exit
  process.on('exit', () => {
    if (cloudflared && !cloudflared.killed) {
      cloudflared.kill('SIGKILL');
    }
  });
}

// Main execution
startCloudflareTunnel();
