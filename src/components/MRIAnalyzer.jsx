// Main MRI analysis component updated to use the enhanced BrainMetrics
import React, { useState, useEffect } from 'react';
import { Upload, Brain, Activity, Layers, AlertTriangle } from 'lucide-react';
import NiftiViewer from './NiftiViewer'; // Import the NiftiViewer component
import BrainMetrics from './BrainMetrics'; // Import the enhanced BrainMetrics component

function MRIAnalyzer() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('cortex');
  const [selectedImage, setSelectedImage] = useState('original');
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);

  // Handle file selection
  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  // Process the uploaded MRI file
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setProcessingStatus('Uploading file...');
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name);
      
      // Make the API call to your FastAPI endpoint
      const uploadResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        // Try to get more detailed error information
        let errorMessage;
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.detail || uploadResponse.statusText;
        } catch {
          errorMessage = uploadResponse.statusText;
        }
        throw new Error(`Upload failed: ${errorMessage}`);
      }
      
      // Process the response from the upload API
      setProcessingStatus('Processing MRI data...');
      const result = await uploadResponse.json();
      console.log("API Response:", result);
      
      // Handle polling for status updates if the processing is async
      if (result.task_id) {
        // If the API returns a task ID, poll for status updates
        await pollProcessingStatus(result.task_id);
      }
      
      // Set the analysis data and complete the process
      setAnalysisData(result);
      setIsAnalyzing(false);
      setProcessingStatus(null);
    } catch (err) {
      console.error("Error analyzing MRI:", err);
      setError(err.message || "Failed to analyze MRI scan");
      setIsAnalyzing(false);
      setProcessingStatus(null);
    }
  };

  // Poll for status updates if processing is asynchronous
  const pollProcessingStatus = async (taskId) => {
    let finished = false;
    while (!finished) {
      try {
        const statusResponse = await fetch(`http://localhost:8000/api/task-status/${taskId}`);
        if (!statusResponse.ok) {
          throw new Error(`Failed to get task status: ${statusResponse.statusText}`);
        }
        
        const statusData = await statusResponse.json();
        console.log("Task status:", statusData);
        
        if (statusData.status === 'completed') {
          finished = true;
        } else if (statusData.status === 'failed') {
          throw new Error(`Processing failed: ${statusData.error || 'Unknown error'}`);
        } else {
          // Update status message
          setProcessingStatus(statusData.message || 'Processing...');
          // Wait before polling again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.error("Error polling status:", err);
        throw err;
      }
    }
  };

  // Get current image path based on selection
  const getCurrentImagePath = () => {
    if (!analysisData) return null;
    
    switch (selectedImage) {
      case 'original':
        return analysisData.input_file.uncompressed;
      case 'brain_extracted':
        return analysisData.uncompressed_files.brain_extracted;
      case 'normalized':
        return analysisData.uncompressed_files.normalized;
      case 'bias_corrected':
        return analysisData.uncompressed_files.bias_corrected;
      case 'registered':
        return analysisData.uncompressed_files.registered;
      default:
        return analysisData.input_file.uncompressed;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {!analysisData ? (
        // Upload Phase
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-3xl mx-auto px-6 py-8">
            <div className="rounded-2xl p-12 border border-gray-800">
              <h1 className="text-4xl font-bold text-blue-500 mb-12 text-center">
                MRI Analysis Tool
              </h1>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* File Upload Area */}
                <div 
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center
                    ${isDragging ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-600'}
                    ${file ? 'border-green-500' : ''}
                    transition-all duration-200`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".nii,.nii.gz,.dcm"
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload size={48} className={`${file ? 'text-green-500' : 'text-blue-500'}`} />
                    </div>
                    {file ? (
                      <>
                        <p className="text-green-500 text-lg font-medium">File Selected:</p>
                        <p className="text-gray-300 text-lg">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300 text-lg">
                          Drag and drop your MRI scan here, or click to browse
                        </p>
                        <p className="text-gray-500">
                          Supported formats: .nii, .nii.gz, .dcm
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!file || isAnalyzing}
                  className="w-full py-4 px-6 rounded-lg bg-blue-600 text-white font-medium 
                    transition duration-200 ease-in-out transform hover:bg-blue-700 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      {processingStatus || 'Analyzing MRI Scan...'}
                    </div>
                  ) : (
                    'Analyze MRI Scan'
                  )}
                </button>
              </form>
              
              {error && (
                <div className="mt-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-500">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Analysis Results Phase
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-4xl font-bold text-blue-500 mb-8 text-center">
            MRI Analysis Results
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* NIFTI Viewer section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-800 rounded-lg shadow-xl">
                <div className="border-b border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white">MRI Scan Viewer</h2>
                </div>
                
                {/* Image type selection */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedImage('original')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        selectedImage === 'original' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Original
                    </button>
                    <button 
                      onClick={() => setSelectedImage('brain_extracted')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        selectedImage === 'brain_extracted' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Brain Extracted
                    </button>
                    <button 
                      onClick={() => setSelectedImage('normalized')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        selectedImage === 'normalized' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Normalized
                    </button>
                    <button 
                      onClick={() => setSelectedImage('bias_corrected')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        selectedImage === 'bias_corrected' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Bias Corrected
                    </button>
                    <button 
                      onClick={() => setSelectedImage('registered')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        selectedImage === 'registered' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Registered
                    </button>
                  </div>
                </div>
                
                {/* NIFTI Viewer */}
                <div className="p-4">
                  <NiftiViewer filePath={getCurrentImagePath()} />
                </div>
              </div>
            </div>
            
            {/* Metrics section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg shadow-xl">
                <div className="border-b border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white">Brain Metrics</h2>
                </div>
                
                <div className="p-4">
                  {/* Tabs for brain regions */}
                  <div className="border-b border-gray-700 mb-4">
                    <div className="flex">
                      <button
                        className={`px-4 py-2 font-medium ${
                          activeTab === 'cortex' 
                            ? 'border-b-2 border-blue-500 text-blue-500' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('cortex')}
                      >
                        <Brain className="w-4 h-4 inline mr-1" />
                        Cortex
                      </button>
                      <button
                        className={`px-4 py-2 font-medium ${
                          activeTab === 'subcortex' 
                            ? 'border-b-2 border-blue-500 text-blue-500' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('subcortex')}
                      >
                        <Activity className="w-4 h-4 inline mr-1" />
                        Subcortex
                      </button>
                      <button
                        className={`px-4 py-2 font-medium ${
                          activeTab === 'mni' 
                            ? 'border-b-2 border-blue-500 text-blue-500' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('mni')}
                      >
                        <Layers className="w-4 h-4 inline mr-1" />
                        MNI
                      </button>
                    </div>
                  </div>
                  
                  {/* Metrics data with charts */}
                  <div>
                    {activeTab === 'cortex' && (
                      <BrainMetrics data={analysisData.segmented_cortex} type="cortex" />
                    )}
                    {activeTab === 'subcortex' && (
                      <BrainMetrics data={analysisData.segmented_subcortex} type="subcortex" />
                    )}
                    {activeTab === 'mni' && (
                      <BrainMetrics data={analysisData.segmented_mni} type="mni" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Reset Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setAnalysisData(null);
                    setFile(null);
                    setError(null);
                    setProcessingStatus(null);
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium 
                    transition duration-200 ease-in-out transform hover:bg-blue-700 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Upload Another MRI Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MRIAnalyzer;