const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Port to listen for Google callback
const PORT = 3005;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

// Load existing client credentials from command line or .env
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

function getEnvValue(key) {
  const match = envContent.match(new RegExp(`^${key}\\s*=\\s*["']?(.*?)["']?\\s*$`, 'm'));
  return match ? match[1] : '';
}

const client_id = getEnvValue('GOOGLE_CLIENT_ID');
const client_secret = getEnvValue('GOOGLE_CLIENT_SECRET');

if (!client_id || !client_secret) {
  console.log('\x1b[31mError: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in backend/.env!\x1b[0m');
  console.log('\nPlease follow these steps to add them first:');
  console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
  console.log('2. Select your project and go to "APIs & Services" > "Credentials".');
  console.log('3. Click "Create Credentials" > "OAuth client ID".');
  console.log('4. Set Application Type to "Web application".');
  console.log(`5. Add Authorized Redirect URI: \x1b[36m${REDIRECT_URI}\x1b[0m`);
  console.log('6. Copy Client ID and Client Secret, and paste them into your backend/.env as:');
  console.log('   GOOGLE_CLIENT_ID="your_client_id"');
  console.log('   GOOGLE_CLIENT_SECRET="your_client_secret"');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  REDIRECT_URI
);

// Generate authentication URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Request refresh token
  prompt: 'consent',     // Force consent screen to guarantee refresh token is returned
  scope: ['https://www.googleapis.com/auth/drive'],
});

const server = http.createServer(async (req, res) => {
  const reqUrl = url.parse(req.url, true);

  if (reqUrl.pathname === '/oauth2callback') {
    const code = reqUrl.query.code;
    if (!code) {
      res.end('Authorization code not found in request.');
      return;
    }

    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <h2 style="color: red;">Authorization successful, but no Refresh Token was returned!</h2>
          <p>Please go to your <a href="https://myaccount.google.com/connections" target="_blank">Google Account Permissions</a>, remove access for your app, and run this script again.</p>
        `);
        console.log('\n\x1b[33mWarning: Refresh token not returned! Make sure to revoke access in Google Account Settings and retry.\x1b[0m');
        server.close();
        process.exit(1);
      }

      // Update .env file with GOOGLE_REFRESH_TOKEN
      let newEnv = envContent;
      
      // Remove service account configurations to avoid confusion, or keep them comment out
      newEnv = newEnv.replace(/^GOOGLE_SERVICE_ACCOUNT_EMAIL=.*$/gm, '# GOOGLE_SERVICE_ACCOUNT_EMAIL=""');
      newEnv = newEnv.replace(/^GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=.*$/gm, '# GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=""');

      // Update OAuth2 credentials
      if (newEnv.includes('GOOGLE_REFRESH_TOKEN=')) {
        newEnv = newEnv.replace(/^GOOGLE_REFRESH_TOKEN=.*$/gm, `GOOGLE_REFRESH_TOKEN="${refreshToken}"`);
      } else {
        newEnv += `\nGOOGLE_REFRESH_TOKEN="${refreshToken}"`;
      }

      fs.writeFileSync(envPath, newEnv, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: #4CAF50;">✅ Authentication Successful!</h2>
          <p>The <b>GOOGLE_REFRESH_TOKEN</b> has been successfully added to your <b>backend/.env</b> file.</p>
          <p>You can close this tab and return to the terminal.</p>
        </div>
      `);

      console.log('\n\x1b[32mSuccess! GOOGLE_REFRESH_TOKEN has been retrieved and saved to backend/.env!\x1b[0m');
      console.log(`Refresh Token: ${refreshToken.substring(0, 15)}...`);
      console.log('\nYou can now restart the backend server.');
      
      server.close();
      process.exit(0);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2 style="color: red;">Error retrieving token:</h2><pre>${error.message}</pre>`);
      console.error('Error exchanging code for tokens:', error);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log('\n========================================================');
  console.log('  Google Drive OAuth2 Auth Helper');
  console.log('========================================================');
  console.log('\nPlease open this link in your web browser to authenticate:');
  console.log(`\n\x1b[36m${authUrl}\x1b[0m\n`);
  console.log('Waiting for approval...');
});
