import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, SkipForward, SkipBack, Brain, Activity, Layers, AlertTriangle, Info } from 'lucide-react';
import BrainMetrics from './BrainMetrics';
// Helper function to extract S3 object key from S3 URI
const getObjectKeyFromS3Uri = (s3Uri) => {
  if (!s3Uri || !s3Uri.startsWith('s3://')) {
    return null;
  }
  try {
    const url = new URL(s3Uri);
    // The object key is the pathname without the leading slash
    return url.pathname.substring(1);
  } catch (e) {
    // If URL parsing fails, try a simpler split
    // s3://bucket-name/key/path/to/object
    const parts = s3Uri.split('/');
    if (parts.length > 3) {
      return parts.slice(3).join('/');
    }
    return null;
  }
};

// NiftiViewer Component for displaying NIFTI images
const NiftiViewer = ({ s3Uri, viewPlane: initialViewPlane = 'axial' }) => {
  const [currentSlice, setCurrentSlice] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalSlices, setTotalSlices] = useState(0);
  const [viewPlane, setViewPlane] = useState(initialViewPlane);
  const [playbackSpeed, setPlaybackSpeed] = useState(200); // ms per slice
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageData, setImageData] = useState(null); // Will store { buffer, header }
  const canvasRef = useRef(null);

  // NIFTI Header Parser (simplified, assumes uncompressed .nii from your pipeline)
  // For production, a robust library like nifti-reader-js or daikon is recommended if dealing with various NIFTI types.
  const parseNiftiHeader = (buffer) => {
    try {
      const view = new DataView(buffer);
      // Basic NIFTI-1 header size is 348 bytes.
      // sizeof_hdr should be 348.
      const sizeof_hdr = view.getInt32(0, true);
      if (sizeof_hdr !== 348) {
        console.warn(`Unexpected NIFTI header size: ${sizeof_hdr}. Assuming 348.`);
      }

      // Dimensions: dim[0] is number of dimensions, dim[1-7] are sizes.
      // We are interested in dim[1], dim[2], dim[3] for a 3D volume.
      const dims = [];
      for (let i = 0; i <= 7; i++) {
        dims.push(view.getInt16(40 + i * 2, true));
      }
      
      // Check for n+1 or ni1 magic string to confirm NIFTI-1
      let magicString = '';
      for (let i = 0; i < 4; i++) {
        magicString += String.fromCharCode(view.getUint8(344 + i));
      }
      if (magicString !== 'n+1' && magicString !== 'ni1') {
         // If not 'n+1', check for 'ni1' (another common variant)
        let ni1MagicString = '';
        for (let i = 0; i < 3; i++) { // 'ni1' is 3 chars + null
            ni1MagicString += String.fromCharCode(view.getUint8(344 + i));
        }
        if (ni1MagicString !== 'ni1') {
            console.warn("NIFTI magic string 'n+1' or 'ni1' not found. File may not be a standard NIFTI-1 .nii file.");
            // Continue parsing, but be aware it might fail.
        }
      }


      // datatype: code for the data type (e.g., 16 for float32, 8 for int32, 4 for int16)
      const datatype = view.getInt16(70, true);
      // vox_offset: offset in the .nii file where the image data starts.
      // For .nii files, this is typically 352 (header is 348, +4 for potential extension).
      // If it's a .hdr/.img pair, vox_offset is 0 in the .hdr.
      // We assume a single .nii file.
      const vox_offset = view.getFloat32(108, true);
      const headerSize = vox_offset > 0 ? vox_offset : 352; // Default to 352 if vox_offset is 0 for a .nii file

      // Validate dimensions - if unreasonable, use defaults
      if (dims[0] < 3 || dims[0] > 4 || // Expect 3D or 4D
          dims[1] <= 0 || dims[1] > 2048 || 
          dims[2] <= 0 || dims[2] > 2048 || 
          dims[3] <= 0 || dims[3] > 2048) {
        console.warn('Unusual dimensions found, using defaults for safety:', dims);
        // Fallback to some default dimensions if parsing seems off
        return { dims: [3, 256, 256, 180], headerSize: 352, datatype: 16 /* DT_FLOAT32 */ };
      }

      return {
        dims: dims, // dims[0] = num_dims, dims[1]=nx, dims[2]=ny, dims[3]=nz
        headerSize: headerSize,
        datatype: datatype,
      };
    } catch (e) {
      console.error('Error parsing NIFTI header:', e);
      // Fallback to default values if parsing fails
      return { dims: [3, 256, 256, 180], headerSize: 352, datatype: 16 };
    }
  };
  
  // Function to extract a slice from the NIFTI data
  const extractSlice = (buffer, header, sliceIndex, orientation = 'axial') => {
    const dataOffset = Math.floor(header.headerSize); // Ensure integer
    const nx = header.dims[1];
    const ny = header.dims[2];
    const nz = header.dims[3];

    let sliceDataArray;
    let width, height, getVoxelOffset;

    // Determine data type and bytes per voxel
    let bytesPerVoxel;
    let TypedArrayConstructor;

    switch (header.datatype) {
        case 2:  // DT_UNSIGNED_CHAR
            TypedArrayConstructor = Uint8Array;
            bytesPerVoxel = 1;
            break;
        case 4:  // DT_SIGNED_SHORT (int16)
            TypedArrayConstructor = Int16Array;
            bytesPerVoxel = 2;
            break;
        case 8:  // DT_SIGNED_INT (int32)
            TypedArrayConstructor = Int32Array;
            bytesPerVoxel = 4;
            break;
        case 16: // DT_FLOAT32
            TypedArrayConstructor = Float32Array;
            bytesPerVoxel = 4;
            break;
        case 64: // DT_FLOAT64 (double)
            TypedArrayConstructor = Float64Array;
            bytesPerVoxel = 8;
            break;
        default:
            console.error(`Unsupported NIFTI datatype: ${header.datatype}. Defaulting to Float32.`);
            TypedArrayConstructor = Float32Array;
            bytesPerVoxel = 4;
    }
    
    // Create a typed array view for the image data segment of the buffer
    const imageDataSegment = buffer.slice(dataOffset);
    const dataArray = new TypedArrayConstructor(imageDataSegment);


    switch (orientation) {
      case 'sagittal': // X-plane (view along X-axis)
        width = ny; height = nz;
        sliceIndex = Math.max(0, Math.min(sliceIndex, nx - 1));
        getVoxelOffset = (y_slice, z_slice) => (z_slice * nx * ny) + (y_slice * nx) + sliceIndex;
        break;
      case 'coronal':  // Y-plane (view along Y-axis)
        width = nx; height = nz;
        sliceIndex = Math.max(0, Math.min(sliceIndex, ny - 1));
        getVoxelOffset = (x_slice, z_slice) => (z_slice * nx * ny) + (sliceIndex * nx) + x_slice;
        break;
      case 'axial':    // Z-plane (view along Z-axis)
      default:
        width = nx; height = ny;
        sliceIndex = Math.max(0, Math.min(sliceIndex, nz - 1));
        getVoxelOffset = (x_slice, y_slice) => (sliceIndex * nx * ny) + (y_slice * nx) + x_slice;
        break;
    }

    sliceDataArray = new TypedArrayConstructor(width * height);
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        sliceDataArray[j * width + i] = dataArray[getVoxelOffset(i, j)];
      }
    }
    
    // Normalize for display (find min/max of the current slice)
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < sliceDataArray.length; i++) {
        if (isFinite(sliceDataArray[i])) {
            min = Math.min(min, sliceDataArray[i]);
            max = Math.max(max, sliceDataArray[i]);
        }
    }
    if (!isFinite(min) || !isFinite(max) || min === max) { // Fallback if slice is uniform or all NaN/Infinity
        min = 0; max = (header.datatype === 2) ? 255 : 1000; // Adjust max based on typical ranges
    }

    const range = max - min || 1;
    const canvasPixelData = new Uint8ClampedArray(width * height * 4); // RGBA

    for (let i = 0; i < sliceDataArray.length; i++) {
      const normalizedVal = Math.max(0, Math.min(255, Math.round(((sliceDataArray[i] - min) / range) * 255)));
      canvasPixelData[i * 4] = normalizedVal;     // R
      canvasPixelData[i * 4 + 1] = normalizedVal; // G
      canvasPixelData[i * 4 + 2] = normalizedVal; // B
      canvasPixelData[i * 4 + 3] = 255;           // A
    }
    return { data: canvasPixelData, width, height };
  };
  
  // Load NIFTI file
  useEffect(() => {
    const objectKey = getObjectKeyFromS3Uri(s3Uri);
    if (!objectKey) {
      setError("Invalid S3 URI provided for NIFTI viewer.");
      setLoading(false);
      if (canvasRef.current) renderPlaceholderSlice(currentSlice, "Invalid S3 URI");
      return;
    }
    
    const loadNiftiFile = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageData(null); // Clear previous image data
        
        const apiUrl = `http://localhost:8000/api/nifti?object_key=${encodeURIComponent(objectKey)}`;
        console.log("NiftiViewer: Fetching from API URL:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/octet-stream' } // Or specific NIFTI types if server sets them
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load NIFTI file: ${response.status} ${response.statusText}. Server: ${errorText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log("NiftiViewer: Received ArrayBuffer, size:", arrayBuffer.byteLength);
        
        const header = parseNiftiHeader(arrayBuffer);
        console.log("NiftiViewer: Parsed header:", header);
        
        let newTotalSlices;
        switch (viewPlane) {
          case 'sagittal': newTotalSlices = header.dims[1]; break; // nx
          case 'coronal':  newTotalSlices = header.dims[2]; break; // ny
          case 'axial': default: newTotalSlices = header.dims[3]; break; // nz
        }
        
        setTotalSlices(newTotalSlices);
        // Reset currentSlice if it's out of bounds for the new viewPlane/image
        setCurrentSlice(prevSlice => Math.min(Math.max(0, prevSlice), newTotalSlices -1 || 0));


        setImageData({ buffer: arrayBuffer, header: header });
        setLoading(false);

      } catch (err) {
        console.error("NiftiViewer: Error loading NIFTI file:", err);
        setError(err.message || "Failed to load NIFTI file");
        setLoading(false);
        if (canvasRef.current) renderPlaceholderSlice(currentSlice, err.message);
      }
    };
    
    loadNiftiFile();
  }, [s3Uri, viewPlane]); // Reload if S3 URI or viewPlane changes
  
  // Render slice when image data or current slice changes
  useEffect(() => {
    if (imageData && canvasRef.current && totalSlices > 0) {
      try {
        const slice = extractSlice(imageData.buffer, imageData.header, currentSlice, viewPlane);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = slice.width;
        canvas.height = slice.height;
        const imgData = new ImageData(slice.data, slice.width, slice.height);
        ctx.putImageData(imgData, 0, 0);
      } catch (error) {
        console.error("NiftiViewer: Error rendering slice:", error);
        if (canvasRef.current) renderPlaceholderSlice(currentSlice, "Error rendering slice");
      }
    } else if (canvasRef.current && !loading && (!imageData || totalSlices === 0)) {
        // Render placeholder if no image data or no slices, and not loading
        const message = error || (totalSlices === 0 && imageData ? "No slices in this dimension" : "NIFTI data not available");
        renderPlaceholderSlice(currentSlice, message);
    }
  }, [imageData, currentSlice, viewPlane, loading, totalSlices, error]); // Added error here
  
  // Render a placeholder slice
  const renderPlaceholderSlice = (sliceIdx, message = "Loading or No Data") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    ctx.fillStyle = '#2d3748'; // Dark gray
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a0aec0'; // Lighter gray text
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    const displaySliceNum = totalSlices > 0 ? `${sliceIdx + 1}/${totalSlices}` : `${sliceIdx + 1}/?`;
    ctx.fillText(`${viewPlane} view - slice ${displaySliceNum}`, canvas.width / 2, 20);
    ctx.font = '12px Arial';
    const lines = message.toString().split('. ');
    lines.forEach((line, index) => {
        ctx.fillText(line.substring(0,40), canvas.width / 2, canvas.height - 40 + (index * 15));
    });
  };
  
  // Handle playback
  useEffect(() => {
    let interval;
    if (isPlaying && totalSlices > 0) {
      interval = setInterval(() => {
        setCurrentSlice(prev => (prev >= totalSlices - 1) ? 0 : prev + 1);
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSlices, playbackSpeed]);
  
  return (
    <div className="border rounded-lg bg-gray-800 p-4 text-white">
      <div className="flex flex-wrap gap-2 mb-4">
        {['axial', 'sagittal', 'coronal'].map(plane => (
          <button
            key={plane}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewPlane === plane 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => {
                if (viewPlane !== plane) { // Only reset if plane changes
                    setViewPlane(plane);
                    // setCurrentSlice(0); // Optionally reset slice to 0 or middle
                    // Total slices will be updated by the useEffect for loadNiftiFile
                }
            }}
            disabled={loading}
          >
            {plane.charAt(0).toUpperCase() + plane.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4 border border-gray-700">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
          </div>
        )}
        <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
        />
        {/* Error overlay, shown if canvas might be empty or showing placeholder */}
        {error && !loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center bg-black bg-opacity-75">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="text-sm">{error}</p>
            </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50" onClick={() => setCurrentSlice(0)} disabled={loading || totalSlices === 0}><SkipBack className="h-4 w-4" /></button>
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50" onClick={() => setCurrentSlice(prev => Math.max(0, prev - 1))} disabled={loading || totalSlices === 0}>Prev</button>
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 w-20" onClick={() => setIsPlaying(!isPlaying)} disabled={loading || totalSlices === 0}>
                {isPlaying ? <Pause className="h-4 w-4 mx-auto" /> : <Play className="h-4 w-4 mx-auto" />}
            </button>
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50" onClick={() => setCurrentSlice(prev => Math.min(totalSlices - 1, prev + 1))} disabled={loading || totalSlices === 0}>Next</button>
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50" onClick={() => setCurrentSlice(totalSlices -1)} disabled={loading || totalSlices === 0}><SkipForward className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2">
            <input type="range" min={0} max={Math.max(0, totalSlices - 1)} value={currentSlice} onChange={(e) => setCurrentSlice(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={loading || totalSlices === 0} />
            <span className="text-xs text-gray-400 min-w-[50px] text-right">
            {totalSlices > 0 ? `${currentSlice + 1}/${totalSlices}` : '0/0'}
            </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Speed:</span>
            <input type="range" min={50} max={1000} step={50} value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))} className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={loading || totalSlices === 0}/>
            <span className="text-gray-400 min-w-[40px] text-right">{playbackSpeed}ms</span>
        </div>
      </div>
    </div>
  );
};

// Main MRI analysis component that handles the entire workflow
function UploadMRI() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null); // Will store the full API response
  const [activeTab, setActiveTab] = useState('cortex');
  const [selectedImageKey, setSelectedImageKey] = useState('input_uncompressed_s3_uri'); // Default to showing original uncompressed
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.nii') || selectedFile.name.endsWith('.nii.gz')) {
        setFile(selectedFile);
        setError(null); // Clear previous errors
      } else {
        setError('Invalid file type. Please upload a .nii or .nii.gz file.');
        setFile(null);
      }
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.name.endsWith('.nii') || droppedFile.name.endsWith('.nii.gz')) {
        setFile(droppedFile);
        setError(null); // Clear previous errors
      } else {
        setError('Invalid file type. Please upload a .nii or .nii.gz file.');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a NIFTI file (.nii or .nii.gz) to upload.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null); // Clear previous results
    setProcessingStatus('Uploading file...');
    
    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading file:', file.name);
    
    try {
      const uploadResponse = await fetch('http://localhost:8000/api/upload/', { // Ensure trailing slash if your FastAPI route has it
        method: 'POST',
        body: formData
      });
      
      setProcessingStatus('Processing MRI data (this may take several minutes)...');

      if (!uploadResponse.ok) {
        let errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch { /* Ignore if response is not JSON */ }
        throw new Error(errorMessage);
      }
      
      const result = await uploadResponse.json();
      console.log("API Response from /api/upload/:", result);
      
      // Assuming the backend is synchronous and result contains the final pipeline output
      if (result && result.outputs) {
        setAnalysisData(result); // result itself contains { message, input_object_key, outputs }
        // Default to showing the registered uncompressed image if available, else input uncompressed
        if (result.outputs.registered_uncompressed_s3_uri) {
            setSelectedImageKey('registered_uncompressed_s3_uri');
        } else if (result.outputs.input_uncompressed_s3_uri) {
            setSelectedImageKey('input_uncompressed_s3_uri');
        }

      } else {
        throw new Error("Pipeline did not return expected output structure.");
      }

    } catch (err) {
      console.error("Error analyzing MRI:", err);
      setError(err.message || "Failed to analyze MRI scan. Check console for details.");
    } finally {
      setIsAnalyzing(false);
      setProcessingStatus(null);
    }
  };

  const getCurrentImageS3Uri = () => {
    if (!analysisData || !analysisData.outputs || !analysisData.outputs[selectedImageKey]) {
        console.warn(`No S3 URI found for selectedImageKey: ${selectedImageKey}`);
        return null;
    }
    return analysisData.outputs[selectedImageKey];
  };

  const imageOptions = [
    { key: 'input_uncompressed_s3_uri', label: 'Input (Uncompressed)' },
    { key: 'brain_extracted_uncompressed_s3_uri', label: 'Brain Extracted' },
    { key: 'normalized_uncompressed_s3_uri', label: 'Normalized' },
    { key: 'bias_corrected_uncompressed_s3_uri', label: 'Bias Corrected' },
    { key: 'registered_uncompressed_s3_uri', label: 'Registered to MNI' },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-200">
      {!analysisData ? (
        <div className="flex items-center justify-center py-12 min-h-screen">
          <div className="w-full max-w-xl mx-auto px-4">
            <div className="rounded-xl p-8 md:p-12 border border-gray-700 bg-gray-800 bg-opacity-50 shadow-2xl">
              <div className="text-center mb-10">
                <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                  Advanced MRI Analysis
                </h1>
                <p className="text-gray-400 mt-2">Upload your NIFTI scan to begin processing.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div 
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-900 bg-opacity-30' : 'border-gray-600 hover:border-gray-500'}
                    ${file ? 'border-green-500 bg-green-900 bg-opacity-20' : ''}
                    transition-all duration-300 ease-in-out`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleFileSelectClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gz" // Accept both
                    onChange={handleChange}
                    className="hidden" // Hidden, triggered by div click
                  />
                  <div className="space-y-3">
                    <Upload size={40} className={`mx-auto ${file ? 'text-green-400' : 'text-blue-400'}`} />
                    {file ? (
                      <>
                        <p className="text-green-400 font-medium">Selected:</p>
                        <p className="text-gray-300 text-sm truncate">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300">
                          Drag & drop NIFTI file here
                        </p>
                        <p className="text-xs text-gray-500">or click to browse</p>
                        <p className="text-xs text-gray-500 mt-2">(.nii or .nii.gz)</p>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-700 bg-opacity-30 border border-red-600 rounded-md text-red-400 text-sm text-center">
                        <AlertTriangle className="w-5 h-5 inline mr-2" />{error}
                    </div>
                )}

                <button
                  type="submit"
                  disabled={!file || isAnalyzing}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold 
                    transition duration-200 ease-in-out transform hover:scale-105
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>{processingStatus || 'Analyzing...'}</span>
                    </div>
                  ) : (
                    'Analyze MRI Scan'
                  )}
                </button>
              </form>
            </div>
             <p className="text-center text-xs text-gray-600 mt-8">
                Ensure your backend API at http://localhost:8000 is running.
            </p>
          </div>
        </div>
      ) : (
        // Analysis Results Phase
        <div className="container mx-auto py-8 px-2 md:px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Analysis Results
            </h1>
            <button
              onClick={() => { setAnalysisData(null); setFile(null); setError(null); setProcessingStatus(null); setSelectedImageKey('input_uncompressed_s3_uri');}}
              className="py-2 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm
                transition duration-200 ease-in-out hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Upload New Scan
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <div className="border-b border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white">MRI Scan Viewer</h2>
                </div>
                
                <div className="p-4 border-b border-gray-700">
                  <label htmlFor="imageSelect" className="block text-sm font-medium text-gray-400 mb-1">Select Image to View:</label>
                  <select
                    id="imageSelect"
                    value={selectedImageKey}
                    onChange={(e) => setSelectedImageKey(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {imageOptions.map(opt => (
                        analysisData.outputs[opt.key] && // Only show option if URI exists
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="p-4">
                  {getCurrentImageS3Uri() ? (
                    <NiftiViewer s3Uri={getCurrentImageS3Uri()} key={getCurrentImageS3Uri()} /> 
                    // Add key to force re-render when s3Uri changes
                  ) : (
                    <div className="aspect-square bg-black rounded-lg flex flex-col items-center justify-center text-gray-500 border border-gray-700">
                        <Info className="w-10 h-10 mb-2"/>
                        <p>Selected image not available.</p>
                        <p className="text-xs">({selectedImageKey})</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <div className="border-b border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white">Volumetric Features</h2>
                </div>
                
                <div className="p-1"> {/* Reduced padding for tabs container */}
                  <div className="border-b border-gray-700">
                    <div className="flex justify-around">
                      {['cortex', 'subcortex', 'mni'].map(tabName => (
                        <button
                          key={tabName}
                          className={`flex-1 px-1 py-2.5 text-sm font-medium transition-colors ${
                            activeTab === tabName 
                              ? 'border-b-2 border-blue-500 text-blue-400' 
                              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-t-md'
                          }`}
                          onClick={() => setActiveTab(tabName)}
                        >
                          {tabName === 'cortex' && <Brain className="w-4 h-4 inline mr-1.5" />}
                          {tabName === 'subcortex' && <Activity className="w-4 h-4 inline mr-1.5" />}
                          {tabName === 'mni' && <Layers className="w-4 h-4 inline mr-1.5" />}
                          {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-1 bg-gray-800 rounded-b-lg"> {/* Adjusted background */}
                    {analysisData.outputs && analysisData.outputs.volumetric_data_json ? (
                        <>
                        {activeTab === 'cortex' && (
                          <BrainMetrics data={analysisData.outputs.volumetric_data_json.cortex} type="cortex" />
                        )}
                        {activeTab === 'subcortex' && (
                          <BrainMetrics data={analysisData.outputs.volumetric_data_json.subcortex} type="subcortex" />
                        )}
                        {activeTab === 'mni' && (
                          <BrainMetrics data={analysisData.outputs.volumetric_data_json.mni} type="mni" />
                        )}
                        </>
                    ) : (
                        <div className="p-4 text-center text-gray-500">Volumetric data not available.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadMRI;

