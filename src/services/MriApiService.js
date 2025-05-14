// src/services/MriApiService.js

/**
 * Service to handle API calls for MRI analysis
 */
class MriApiService {
    /**
     * Base URL for API requests
     */
    static baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
    /**
     * Fetch MRI analysis results for a given scan ID
     * @param {string} scanId - ID of the scan to fetch results for
     * @returns {Promise<Object>} - Analysis results
     */
    static async getAnalysisResults(scanId) {
      try {
        const response = await fetch(`${this.baseUrl}/analysis/${scanId}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching analysis results:', error);
        throw new Error(`Failed to fetch analysis results: ${error.message}`);
      }
    }
  
    /**
     * Upload an MRI scan file for analysis
     * @param {File} file - MRI scan file to upload
     * @returns {Promise<Object>} - Upload result with scan ID
     */
    static async uploadScan(file) {
      try {
        const formData = new FormData();
        formData.append('scan', file);
        
        const response = await fetch(`${this.baseUrl}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error uploading scan:', error);
        throw new Error(`Failed to upload scan: ${error.message}`);
      }
    }
  
    /**
     * Get NIFTI file data as an ArrayBuffer
     * @param {string} path - Path to the NIFTI file on the server
     * @returns {Promise<ArrayBuffer>} - NIFTI file data
     */
    static async getNiftiFile(path) {
      try {
        const response = await fetch(`${this.baseUrl}/nifti?path=${encodeURIComponent(path)}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.arrayBuffer();
      } catch (error) {
        console.error('Error fetching NIFTI file:', error);
        throw new Error(`Failed to fetch NIFTI file: ${error.message}`);
      }
    }
  
    /**
     * Get all available scans
     * @returns {Promise<Array>} - List of available scans
     */
    static async getScans() {
      try {
        const response = await fetch(`${this.baseUrl}/scans`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching scans:', error);
        throw new Error(`Failed to fetch scans: ${error.message}`);
      }
    }
  }
  
  export default MriApiService;