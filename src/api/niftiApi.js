import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * API endpoint to serve NIFTI files from a path
 * GET /api/nifti?path=/path/to/file.nii
 */
router.get('/nifti', async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Missing file path parameter' });
    }
    
    // Security check - Only allow access to certain directories
    // This is a simple example - in production you'd need more robust checks
    const allowedDirs = [
      '/Users/adityapurswani/Documents/MRIscansAPI/processed/uncompressed',
      // Add other allowed directories
    ];
    
    const isAllowed = allowedDirs.some(dir => filePath.startsWith(dir));
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access to this file path is not allowed' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Send file buffer
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving NIFTI file:', error);
    res.status(500).json({ error: 'Failed to serve NIFTI file: ' + error.message });
  }
});

export default router;
