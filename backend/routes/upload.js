const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload image endpoint
router.post('/image', (req, res) => {
  try {
    const { imageData, fileName } = req.body;
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image data' });
    }

    // Extract base64 data and file extension
    const matches = imageData.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid image format' });
    }

    const extension = matches[1];
    const base64Data = matches[2];
    
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${fileName || 'product'}_${timestamp}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    
    // Write file
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    // Return the URL path
    const imageUrl = `/api/uploads/${uniqueFileName}`;
    
    res.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Serve uploaded images
router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Image serve error:', error);
    res.status(500).json({ message: 'Failed to serve image' });
  }
});

module.exports = router;