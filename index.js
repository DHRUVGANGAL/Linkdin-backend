// const express = require('express');
// const axios = require('axios');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// require('dotenv').config();


// const app = express();
// const PORT = process.env.PORT || 3000;

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

// if (!GEMINI_API_KEY || !LINKEDIN_ACCESS_TOKEN) {
//   throw new Error("Missing API keys in .env file. Please check your GEMINI_API_KEY and LINKEDIN_ACCESS_TOKEN.");
// }

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// // THE FIX IS HERE: Updated model name
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// app.use(express.json());
// app.use(express.static('public'));

// app.get('/auth/linkedin', (req, res) => {
//   const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=r_liteprofile%20w_member_social`;



//   res.redirect(authURL);
 
// });

// app.get('/auth/linkedin/callback', async (req, res) => {

//    const code = req.query.code;
//   const error = req.query.error;
//   const errorDesc = req.query.error_description;

//   if (error) {
//     console.log("LinkedIn returned an error:", error, errorDesc);
//     return res.status(400).send(`Error: ${error}<br>Description: ${errorDesc}`);
//   }

//   if (!code) {
//     console.log("Missing 'code' in query parameters:", req.query);
//     return res.status(400).send("Missing authorization code in callback.");
//   }

//   try {
//     const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
//       params: {
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: process.env.REDIRECT_URI,
//         client_id: process.env.LINKEDIN_CLIENT_ID,
//         client_secret: process.env.LINKEDIN_CLIENT_SECRET
//       }
//     });

//     const accessToken = tokenResponse.data.access_token;

//     console.log("✅ Access Token:", accessToken);
//     res.send(`Your LinkedIn Access Token: <br><code>${accessToken}</code><br>Paste this into your .env file as LINKEDIN_ACCESS_TOKEN`);
//   } catch (error) {
//     console.error("❌ Failed to get token:", error.response?.data || error.message);
//     res.status(500).send("Failed to retrieve access token.");
//   }
// });








// async function generateContentWithGemini(title) {
//   try {
//     const prompt = `Write a professional and engaging LinkedIn post based on this title: "${title}". Include relevant hashtags. The post should be concise and impactful.`;

//     // This part of your code is slightly outdated for the latest SDK version.
//     // The `generateContent` method now directly accepts the prompt string.
//     // While your old code might still work for now, this is the modern way.
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
    
//     return text;

//   } catch (error) {
//     console.error("Error generating content with Gemini:", error);
//     throw new Error("Failed to generate content from Gemini.");
//   }
// }

// async function postToLinkedIn(content) {
//   try {
//     const meResponse = await axios.get('https://api.linkedin.com/v2/me', {
//       headers: { 'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}` }
//     });
//     const authorUrn = meResponse.data.id;

//     const postPayload = {
//       author: `urn:li:person:${authorUrn}`,
//       lifecycleState: 'PUBLISHED',
//       specificContent: {
//         'com.linkedin.ugc.ShareContent': {
//           shareCommentary: {
//             text: content
//           },
//           shareMediaCategory: 'NONE'
//         }
//       },
//       visibility: {
//         'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
//       }
//     };

//     const postResponse = await axios.post(
//       'https://api.linkedin.com/v2/ugcPosts',
//       postPayload,
//       {
//         headers: {
//           'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
//           'X-Restli-Protocol-Version': '2.0.0',
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     console.log("Successfully posted to LinkedIn:", postResponse.data);
//     return postResponse.data;

//   } catch (error) {
//     console.error("Error posting to LinkedIn:", error.response ? error.response.data : error.message);
//     throw new Error(error.response?.data?.message || "Failed to post to LinkedIn.");
//   }
// }

// app.post('/api/generate-and-post', async (req, res) => {
//   const { title } = req.body;

//   if (!title) {
//     return res.status(400).json({ error: 'Title is required' });
//   }
 
//   console.log(`Received request to post with title: "${title}"`);
//   console.log(process.env.LINKEDIN_CLIENT_SECRET)

//   try {
//     console.log("Generating content...");
//     const contentToPost = await generateContentWithGemini(title);
//     console.log(contentToPost);

//     console.log("Posting to LinkedIn...");
//     const linkedInResult = await postToLinkedIn(contentToPost);

//     res.status(200).json({ success: true, message: 'Successfully posted to LinkedIn!', data: linkedInResult });

//   } catch (error) {
//     console.error("Workflow failed:", error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });





const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_PERSON_URN = process.env.LINKEDIN_PERSON_URN; // e.g., "urn:li:person:abc123"

// if (!GEMINI_API_KEY || !LINKEDIN_ACCESS_TOKEN || !LINKEDIN_PERSON_URN) {
//   throw new Error("Missing required environment variables.");
// }

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

app.use(express.json());
app.use(express.static('public'));

// LinkedIn Auth Step 1
app.get('/auth/linkedin', (req, res) => {
  const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=w_member_social`;
  res.redirect(authURL);
});

// LinkedIn Auth Callback
app.get('/auth/linkedin/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error("LinkedIn returned an error:", error, error_description);
    return res.status(400).send(`Error: ${error}<br>Description: ${error_description}`);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code in callback.");
  }

  try {
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }
    });

    const accessToken = tokenResponse.data.access_token;

    console.log("✅ Access Token:", accessToken);
    res.send(`Your LinkedIn Access Token: <br><code>${accessToken}</code><br>Paste this into your .env file as LINKEDIN_ACCESS_TOKEN`);
  } catch (err) {
    console.error("❌ Failed to get token:", err.response?.data || err.message);
    res.status(500).send("Failed to retrieve access token.");
  }
});

// Generate LinkedIn post using Gemini
async function generateContentWithGemini(title) {
  try {
    const prompt = `Write a professional and engaging LinkedIn post based on this title: "${title}". Include relevant hashtags. The post should be concise and impactful.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Error generating content with Gemini:", err);
    throw new Error("Failed to generate content from Gemini.");
  }
}

// Post content to LinkedIn
async function postToLinkedIn(content) {
  try {
    const postPayload = {
      author: LINKEDIN_PERSON_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const postResponse = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postPayload,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Successfully posted to LinkedIn:", postResponse.data);
    return postResponse.data;

  } catch (err) {
    console.error("❌ Error posting to LinkedIn:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to post to LinkedIn.");
  }
}

// API: Generate and Post
app.post('/api/generate-and-post', async (req, res) => {
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    console.log(`🔹 Generating post for title: "${title}"`);
    const content = await generateContentWithGemini(title);

    console.log("🔹 Posting to LinkedIn...");
    const result = await postToLinkedIn(content);

    res.status(200).json({ success: true, message: 'Successfully posted to LinkedIn!', data: result });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
