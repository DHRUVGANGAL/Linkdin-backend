const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

// Step 1: Redirect user to LinkedIn login
// app.get('/auth/linkedin', (req, res) => {
//   const scope = 'r_liteprofile w_member_social';
//   const state = '123456'; // Use a better random value in production

//   const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}`;

//   res.redirect(authUrl);
// });

app.get('/auth/linkedin', (req, res) => {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent('r_liteprofile w_member_social')}&state=123456`;
    res.redirect(authUrl);
  });
  
// Step 2: Handle LinkedIn redirect and exchange code for access token
app.get('/auth/linkedin/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code) return res.status(400).send('No code received');

  try {
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret:"WPL_AP1.5xHLcwHjtnLUTHj4.XN8egQ=="
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ New Access Token:', accessToken);

    res.send(`
      <h2>Access Token:</h2>
      <code style="color: green;">${accessToken}</code>
      <p>Copy this token and add it to your .env file as <strong>LINKEDIN_ACCESS_TOKEN</strong></p>
    `);
  } catch (error) {
    console.error('Failed to exchange code:', error.response?.data || error.message);
    res.status(500).send('Failed to get access token.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Open this URL in your browser to start auth: http://localhost:${PORT}/auth/linkedin`);
});
