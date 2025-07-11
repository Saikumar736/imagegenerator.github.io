require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize AI models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Image generation with multiple providers
async function generateImage(prompt, style, provider = 'unsplash') {
  try {
    switch (provider) {
      case 'gemini':
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // Gemini image generation logic
        break;
      case 'openai':
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: `${prompt} in ${style} style`,
          n: 1,
          size: "1024x1024"
        });
        return response.data[0].url;
      case 'unsplash':
      default:
        const unsplashResponse = await axios.get('https://api.unsplash.com/photos/random', {
          params: {
            query: `${prompt} ${style}`,
            client_id: process.env.UNSPLASH_ACCESS_KEY
          }
        });
        return unsplashResponse.data.urls.regular;
    }
  } catch (error) {
    console.error(`${provider} Error:`, error);
    return null;
  }
}

// API Endpoints
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt, style, provider } = req.body;
    const imageUrl = await generateImage(prompt, style, provider);
    
    if (!imageUrl) throw new Error("Image generation failed");
    
    res.json({ 
      imageUrl,
      provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Image processing endpoint
app.post('/process-image', multer().single('image'), async (req, res) => {
  try {
    const processedImage = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside' })
      .toFormat('jpeg')
      .toBuffer();
    
    res.set('Content-Type', 'image/jpeg');
    res.send(processedImage);
  } catch (error) {
    res.status(500).json({ error: "Image processing failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});