// NiftiViewer Component
const NiftiViewer = ({ filePath, viewPlane: initialViewPlane = 'axial' }) => {
    const [currentSlice, setCurrentSlice] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [totalSlices, setTotalSlices] = useState(0);
    const [viewPlane, setViewPlane] = useState(initialViewPlane);
    const [playbackSpeed, setPlaybackSpeed] = useState(200);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageData, setImageData] = useState(null);
    const canvasRef = useRef(null);
    
    // More robust NIFTI header parser
    const parseNiftiHeader = (buffer) => {
      try {
        const view = new DataView(buffer);
        let isNifti = false;
        let headerSize = 348; // Default size
        
        console.log('Buffer size:', buffer.byteLength);
        
        // Check for NIFTI-1 magic code at byte 344
        let magicString = '';
        for (let i = 0; i < 4; i++) {
          magicString += String.fromCharCode(view.getUint8(344 + i));
        }
        
        if (magicString === 'n+1' || magicString === 'ni1') {
          isNifti = true;
          const vox_offset = view.getFloat32(108, true);
          headerSize = vox_offset > 0 ? vox_offset : 352;
        } else {
          // Try to detect by size field
          const sizeof_hdr = view.getInt32(0, true);
          if (sizeof_hdr === 348) {
            isNifti = true;
            headerSize = 348;
          }
        }
        
        // Get dimensions
        let dims = [3, 256, 256, 180]; // Default dimensions
        try {
          dims = [
            view.getInt16(40, true), // Number of dimensions
            view.getInt16(42, true), // X dimension
            view.getInt16(44, true), // Y dimension
            view.getInt16(46, true)  // Z dimension (slices)
          ];
          
          // Validate dimensions - if unreasonable, use defaults
          if (dims[0] <= 0 || dims[0] > 7 || 
              dims[1] <= 0 || dims[1] > 1000 || 
              dims[2] <= 0 || dims[2] > 1000 || 
              dims[3] <= 0 || dims[3] > 1000) {
            console.log('Using default dimensions');
            dims = [3, 256, 256, 180];
          }
        } catch (e) {
          console.error('Error reading dimensions, using defaults');
          dims = [3, 256, 256, 180];
        }
        
        return {
          dims,
          headerSize,
          datatype: 16 // Default to float32
        };
      } catch (e) {
        console.error('Error parsing NIFTI header:', e);
        // Return default values
        return {
          dims: [3, 256, 256, 180],
          headerSize: 352,
          datatype: 16
        };
      }
    };
    
    // Function to extract a slice from the NIFTI data
    const extractSlice = (buffer, header, sliceIndex, orientation = 'axial') => {
      try {
        // Skip header
        const dataOffset = header.headerSize;
        
        // Get dimensions
        const nx = header.dims[1];
        const ny = header.dims[2];
        const nz = header.dims[3];
        
        // Bounds check the slice index
        sliceIndex = Math.max(0, Math.min(sliceIndex, nz - 1));
        
        // Determine slice dimensions based on orientation
        let width, height, getVoxelIndex;
        
        switch (orientation) {
          case 'sagittal':
            // X slice (YZ plane)
            width = ny;
            height = nz;
            getVoxelIndex = (x, y) => sliceIndex + (ny - 1 - x) * nx + (nz - 1 - y) * nx * ny; // Rotated 180°
            break;
          case 'coronal':
            // Y slice (XZ plane)
            width = nx;
            height = nz;
            getVoxelIndex = (x, y) => (nx - 1 - x) + sliceIndex * nx + (nz - 1 - y) * nx * ny; // Rotated 180°
            break;
          case 'axial':
          default:
            // Z slice (XY plane)
            width = nx;
            height = ny;
            getVoxelIndex = (x, y) => x + y * nx + sliceIndex * nx * ny;
            break;
        }
        
        // Create image data for the slice
        const sliceData = new Uint8Array(width * height * 4); // RGBA
        
        // Create Float32Array view of the data
        const dataArray = new Float32Array(buffer, dataOffset);
        
        // Function to get the value at a specific voxel position
        const getValue = (idx) => {
          if (idx >= 0 && idx < dataArray.length) {
            return dataArray[idx];
          }
          return 0;
        };
        
        // Find min/max values for normalization
        let min = Infinity;
        let max = -Infinity;
        
        // Sample a subset of voxels for performance
        for (let y = 0; y < height; y += 5) {
          for (let x = 0; x < width; x += 5) {
            try {
              const idx = getVoxelIndex(x, y);
              const val = getValue(idx);
              if (val !== undefined && !isNaN(val) && isFinite(val)) {
                min = Math.min(min, val);
                max = Math.max(max, val);
              }
            } catch (e) {
              // Skip invalid indices
            }
          }
        }
        
        // If we couldn't determine min/max, use defaults
        if (!isFinite(min) || !isFinite(max) || min === max) {
          min = 0;
          max = 255;
        }
        
        const range = max - min || 1;
        
        // Fill the slice with pixel data
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            try {
              const idx = getVoxelIndex(x, y);
              const pixelIdx = (y * width + x) * 4;
              
              // Get normalized value (0-255)
              const val = getValue(idx);
              let normalizedVal = 0;
              
              if (val !== undefined && !isNaN(val) && isFinite(val)) {
                normalizedVal = Math.max(0, Math.min(255, Math.round(((val - min) / range) * 255)));
              }
              
              // Set RGBA values
              sliceData[pixelIdx] = normalizedVal;     // R
              sliceData[pixelIdx + 1] = normalizedVal; // G
              sliceData[pixelIdx + 2] = normalizedVal; // B
              sliceData[pixelIdx + 3] = 255;           // A (fully opaque)
            } catch (e) {
              // Skip invalid pixels
            }
          }
        }
        
        return {
          data: sliceData,
          width,
          height
        };
      } catch (e) {
        console.error('Error extracting slice:', e);
        // Return an empty slice
        return {
          data: new Uint8Array(256 * 256 * 4),
          width: 256,
          height: 256
        };
      }
    };
    
    // Load NIFTI file
    useEffect(() => {
      if (!filePath) return;
      
      const loadNiftiFile = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log(`Loading NIFTI file from path: ${filePath}`);
          const apiUrl = `http://localhost:8000/api/nifti?path=${encodeURIComponent(filePath)}`;
          console.log("API URL:", apiUrl);
          
          // Make API call - use a blob approach to avoid download trigger
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/octet-stream',
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to load NIFTI file: ${response.statusText}`);
          }
          
          // Get the data as a blob first
          const blob = await response.blob();
          console.log("Received blob:", blob.size, "bytes", blob.type);
          
          // Convert blob to ArrayBuffer
          const arrayBuffer = await blob.arrayBuffer();
          console.log("Converted to ArrayBuffer, size:", arrayBuffer.byteLength);
          
          // Parse the header
          const header = parseNiftiHeader(arrayBuffer);
          console.log("Parsed header:", header);
          
          // Set total slices based on dimensions and orientation
          let totalSlices;
          switch (viewPlane) {
            case 'sagittal':
              totalSlices = header.dims[1]; // X dimension
              break;
            case 'coronal':
              totalSlices = header.dims[2]; // Y dimension
              break;
            case 'axial':
            default:
              totalSlices = header.dims[3]; // Z dimension
              break;
          }
          
          console.log("Total slices:", totalSlices);
          
          // Store image data
          setImageData({
            buffer: arrayBuffer,
            header: header
          });
          
          setTotalSlices(totalSlices);
          setCurrentSlice(Math.floor(totalSlices / 2)); // Start in the middle
          setLoading(false);
        } catch (err) {
          console.error("Error loading NIFTI file:", err);
          setError(err.message || "Failed to load NIFTI file");
          setLoading(false);
          
          // Fallback to placeholder for development
          console.log("Using placeholder data");
          const mockDims = [3, 256, 256, 180];
          let sliceCount;
          
          switch (viewPlane) {
            case 'sagittal':
              sliceCount = mockDims[1];
              break;
            case 'coronal':
              sliceCount = mockDims[2];
              break;
            case 'axial':
            default:
              sliceCount = mockDims[3];
              break;
          }
          
          setTotalSlices(sliceCount);
          setCurrentSlice(Math.floor(sliceCount / 2));
          renderPlaceholderSlice(Math.floor(sliceCount / 2));
        }
      };
      
      loadNiftiFile();
    }, [filePath, viewPlane]);
    
    // Render slice when image data or current slice changes
    useEffect(() => {
      if (imageData && canvasRef.current) {
        try {
          // Extract and render the current slice
          const slice = extractSlice(
            imageData.buffer,
            imageData.header,
            currentSlice,
            viewPlane
          );
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions
          canvas.width = slice.width;
          canvas.height = slice.height;
          
          // Create ImageData and render
          const imgData = new ImageData(
            new Uint8ClampedArray(slice.data),
            slice.width,
            slice.height
          );
          
          ctx.putImageData(imgData, 0, 0);
        } catch (error) {
          console.error("Error rendering slice:", error);
          renderPlaceholderSlice(currentSlice);
        }
      } else if (canvasRef.current && !loading && !imageData) {
        renderPlaceholderSlice(currentSlice);
      }
    }, [imageData, currentSlice, viewPlane, loading]);
    
    // Render a placeholder slice
    const renderPlaceholderSlice = (sliceIndex) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 256;
      
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient to simulate brain
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 10,
        canvas.width / 2, canvas.height / 2, 80 + (sliceIndex % 30)
      );
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');
      
      // Draw circle to simulate brain
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 80 + (sliceIndex % 30), 0, Math.PI * 2);
      ctx.fill();
      
      // Add text to indicate slice number and view
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${viewPlane} view - slice ${sliceIndex + 1}/${totalSlices}`, canvas.width / 2, 20);
      
      // Add text to indicate this is a placeholder
      ctx.fillStyle = 'yellow';
      ctx.font = '12px Arial';
      if (error) {
        ctx.fillText('Error loading NIFTI data', canvas.width / 2, canvas.height - 40);
        ctx.fillText(error.substring(0, 40), canvas.width / 2, canvas.height - 20);
      } else {
        ctx.fillText('Placeholder - waiting for NIFTI data', canvas.width / 2, canvas.height - 20);
      }
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
      <div className="border rounded-lg bg-white p-4">
        {/* View selection */}
        <div className="flex gap-2 mb-4">
          {['axial', 'sagittal', 'coronal'].map(plane => (
            <button
              key={plane}
              className={`px-4 py-2 rounded-md ${
                viewPlane === plane 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setViewPlane(plane)}
              disabled={loading}
            >
              {plane.charAt(0).toUpperCase() + plane.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Canvas display */}
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
              <AlertTriangle className="h-10 w-10 mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
            />
          )}
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              onClick={() => setCurrentSlice(prev => Math.max(0, prev - 1))}
              disabled={loading || totalSlices === 0}
            >
              <SkipBack className="h-4 w-4" />
            </button>
  
            <button
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={loading || totalSlices === 0}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
  
            <button
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              onClick={() => setCurrentSlice(prev => Math.min(totalSlices - 1, prev + 1))}
              disabled={loading || totalSlices === 0}
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
  
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSlices - 1)}
            value={currentSlice}
            onChange={(e) => setCurrentSlice(Number(e.target.value))}
            className="flex-1"
            disabled={loading || totalSlices === 0}
          />
  
          <span className="text-sm text-gray-500 min-w-[60px]">
            {totalSlices > 0 ? `${currentSlice + 1} / ${totalSlices}` : '0 / 0'}
          </span>
        </div>
  
        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Speed:</span>
          <input
            type="range"
            min={50}
            max={500}
            step={50}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-32"
            disabled={loading || totalSlices === 0}
          />
          <span className="text-sm text-gray-500 min-w-[60px]">
            {playbackSpeed}ms
          </span>
        </div>
      </div>
    );
  };

export default NiftiViewer;