const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); 


const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

if (!GEMINI_API_KEY || !LINKEDIN_ACCESS_TOKEN) {
  throw new Error("Missing API keys in .env file. Please check your GEMINI_API_KEY and LINKEDIN_ACCESS_TOKEN.");
}


const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


app.use(express.json()); 
app.use(express.static('public')); 



async function generateContentWithGemini(title) {
  try {
    const prompt = `Write a professional and engaging LinkedIn post based on this title: "${title}". Include relevant hashtags. The post should be concise and impactful.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw new Error("Failed to generate content from Gemini.");
  }
}

async function postToLinkedIn(content) {
  try {
    
    const meResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { 'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}` }
    });
    const authorUrn = meResponse.data.id;

    
    const postPayload = {
      author: `urn:li:person:${authorUrn}`,
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

    console.log("Successfully posted to LinkedIn:", postResponse.data);
    return postResponse.data;

  } catch (error) {
    
    console.error("Error posting to LinkedIn:", error.response ? error.response.data : error.message);
    throw new Error(error.response?.data?.message || "Failed to post to LinkedIn.");
  }
}



app.post('/api/generate-and-post', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  console.log(`Received request to post with title: "${title}"`);

  try {
   
    console.log("Generating content...");
    const contentToPost = await generateContentWithGemini(title);

    
    console.log("Posting to LinkedIn...");
    const linkedInResult = await postToLinkedIn(contentToPost);

    res.status(200).json({ success: true, message: 'Successfully posted to LinkedIn!', data: linkedInResult });

  } catch (error) {

    console.error("Workflow failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});