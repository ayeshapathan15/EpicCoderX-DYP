import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ImageTo3DConverter = () => {
  // State for settings
  const [heightScale, setHeightScale] = useState(5.0);
  const [resolution, setResolution] = useState(1.0);
  const [smoothing, setSmoothing] = useState(0);
  const [mode, setMode] = useState('heightmap');
  const [rotateSpeed, setRotateSpeed] = useState(2.0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Refs for Three.js objects
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const object3DRef = useRef(null);
  const imageDataRef = useRef(null);
  const imageTextureRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {
    // Create scene
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x222222);
    
    // Create camera
    cameraRef.current = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    cameraRef.current.position.set(0, 50, 100);
    
    // Create renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    
    // Add renderer to DOM
    if (containerRef.current) {
      containerRef.current.appendChild(rendererRef.current.domElement);
    }
    
    // Create controls
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.25;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    sceneRef.current.add(directionalLight);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 10);
    sceneRef.current.add(gridHelper);
    
    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Auto-rotation
      if (controlsRef.current && autoRotate && object3DRef.current) {
        object3DRef.current.rotation.z += rotateSpeed * 0.01;
      }
      
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [autoRotate, rotateSpeed]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      // Set preview
      setImagePreview(event.target.result);
      
      // Create image element to get pixel data
      const img = new Image();
      img.onload = function() {
        // Create a canvas to get image data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        imageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Create texture
        imageTextureRef.current = new THREE.CanvasTexture(canvas);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Function to calculate height values with optional smoothing
  const calculateHeightValues = (imageData, width, height, smoothingLevel) => {
    const imgWidth = imageData.width;
    const imgHeight = imageData.height;
    const heightValues = new Array(width * height);
    
    // Sample image pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const imgX = Math.floor((x / width) * imgWidth);
        const imgY = Math.floor((y / height) * imgHeight);
        
        const pixelIndex = (imgY * imgWidth + imgX) * 4;
        
        // Get pixel values
        const r = imageData.data[pixelIndex] / 255;
        const g = imageData.data[pixelIndex + 1] / 255;
        const b = imageData.data[pixelIndex + 2] / 255;
        
        // Calculate grayscale (brightness)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        heightValues[y * width + x] = brightness;
      }
    }
    
    // Apply smoothing if needed
    if (smoothingLevel > 0) {
      for (let s = 0; s < smoothingLevel; s++) {
        const tempValues = [...heightValues];
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = y * width + x;
            
            // Skip edges
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
              continue;
            }
            
            // Average with neighbors
            const avg = (
              tempValues[(y - 1) * width + x] +  // top
              tempValues[(y + 1) * width + x] +  // bottom
              tempValues[y * width + (x - 1)] +  // left
              tempValues[y * width + (x + 1)] +  // right
              tempValues[index]                  // center
            ) / 5;
            
            heightValues[index] = avg;
          }
        }
      }
    }
    
    return heightValues;
  };

  // Generate 3D visualization
  const generateFrom2DImage = () => {
    if (!imageDataRef.current || !sceneRef.current) {
      return;
    }
    
    setIsLoading(true);
    
    // Remove previous 3D object
    if (object3DRef.current) {
      sceneRef.current.remove(object3DRef.current);
      object3DRef.current = null;
    }
    
    // Get image data
    const imageData = imageDataRef.current;
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate dimensions based on resolution
    const segmentsX = Math.floor(width * resolution);
    const segmentsY = Math.floor(height * resolution);
    
    // Calculate scales to center the object
    const scaleX = width / Math.max(width, height);
    const scaleY = height / Math.max(width, height);
    
    // Generate different visualizations based on mode
    setTimeout(() => {
      if (mode === 'heightmap') {
        // Create a plane geometry
        const geometry = new THREE.PlaneGeometry(
          100 * scaleX, 
          100 * scaleY, 
          segmentsX, 
          segmentsY
        );
        
        // Sample pixel values and adjust vertices
        const positionAttribute = geometry.attributes.position;
        
        // Calculate height values with smoothing if needed
        const heightValues = calculateHeightValues(imageData, segmentsX + 1, segmentsY + 1, smoothing);
        
        // Apply height values to vertices
        for (let i = 0; i < positionAttribute.count; i++) {
          const x = i % (segmentsX + 1);
          const y = Math.floor(i / (segmentsX + 1));
          
          const z = heightValues[y * (segmentsX + 1) + x] * heightScale;
          positionAttribute.setZ(i, z);
        }
        
        // Update the geometry
        geometry.computeVertexNormals();
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
          map: imageTextureRef.current,
          wireframe: false,
          side: THREE.DoubleSide
        });
        
        // Create mesh
        object3DRef.current = new THREE.Mesh(geometry, material);
        
      } else if (mode === 'pointcloud') {
        // Create point cloud geometry
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        // Sample at reduced resolution
        const stepX = Math.ceil(width / segmentsX);
        const stepY = Math.ceil(height / segmentsY);
        
        for (let y = 0; y < height; y += stepY) {
          for (let x = 0; x < width; x += stepX) {
            const pixelIndex = (y * width + x) * 4;
            
            // Get pixel values
            const r = imageData.data[pixelIndex] / 255;
            const g = imageData.data[pixelIndex + 1] / 255;
            const b = imageData.data[pixelIndex + 2] / 255;
            
            // Calculate grayscale (brightness)
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Calculate position
            const posX = (x / width - 0.5) * 100 * scaleX;
            const posY = (0.5 - y / height) * 100 * scaleY;
            const posZ = brightness * heightScale;
            
            // Add position and color
            positions.push(posX, posY, posZ);
            colors.push(r, g, b);
          }
        }
        
        // Set attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Create material
        const material = new THREE.PointsMaterial({
          size: 0.5,
          vertexColors: true
        });
        
        // Create point cloud
        object3DRef.current = new THREE.Points(geometry, material);
        
      } else if (mode === 'mesh') {
        // Create a plane geometry
        const geometry = new THREE.PlaneGeometry(
          100 * scaleX, 
          100 * scaleY, 
          segmentsX, 
          segmentsY
        );
        
        // Sample pixel values and adjust vertices
        const positionAttribute = geometry.attributes.position;
        
        // Calculate height values with smoothing if needed
        const heightValues = calculateHeightValues(imageData, segmentsX + 1, segmentsY + 1, smoothing);
        
        // Apply height values to vertices
        for (let i = 0; i < positionAttribute.count; i++) {
          const x = i % (segmentsX + 1);
          const y = Math.floor(i / (segmentsX + 1));
          
          const z = heightValues[y * (segmentsX + 1) + x] * heightScale;
          positionAttribute.setZ(i, z);
        }
        
        // Update the geometry
        geometry.computeVertexNormals();
        
        // Create material for wireframe
        const material = new THREE.MeshBasicMaterial({
          wireframe: true,
          color: 0x00ffff
        });
        
        // Create mesh
        object3DRef.current = new THREE.Mesh(geometry, material);
      }
      
      // Add to scene
      if (object3DRef.current && sceneRef.current) {
        // Rotate to face camera (X-rotation of -90 degrees)
        object3DRef.current.rotation.x = -Math.PI / 2;
        sceneRef.current.add(object3DRef.current);
        
        // Center camera
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
      
      setIsLoading(false);
    }, 100);
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const screenshot = rendererRef.current.domElement.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = '3d_image_screenshot.png';
      link.click();
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      backgroundColor: '#222',
      color: 'white',
      height: '100vh',
      width: '100vw',
      position: 'relative'
    }}>
      <div ref={containerRef} style={{
        position: 'absolute',
        width: '100%',
        height: '100%'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '300px'
      }}>
        <h3>Image to 3D Converter</h3>
        
        <div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          {imagePreview && (
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{
                maxWidth: '100px',
                border: '1px solid white',
                marginTop: '10px'
              }} 
            />
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Height Scale: {heightScale}
          </label>
          <input 
            type="range" 
            min="0" 
            max="20" 
            step="0.1" 
            value={heightScale}
            onChange={(e) => setHeightScale(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Resolution: {resolution}
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            value={resolution}
            onChange={(e) => setResolution(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            3D Mode:
          </label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
          >
            <option value="heightmap">Height Map</option>
            <option value="pointcloud">Point Cloud</option>
            <option value="mesh">Wireframe Mesh</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Smoothing: {smoothing}
          </label>
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="1" 
            value={smoothing}
            onChange={(e) => setSmoothing(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <button 
          onClick={generateFrom2DImage}
          disabled={!imageDataRef.current || isLoading}
          style={{ padding: '8px', cursor: 'pointer' }}
        >
          {isLoading ? 'Processing...' : 'Generate 3D'}
        </button>
        
        <button 
          onClick={takeScreenshot}
          style={{ padding: '8px', cursor: 'pointer' }}
        >
          Take Screenshot
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            Auto-Rotate
          </label>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Rotation Speed: {rotateSpeed}
          </label>
          <input 
            type="range" 
            min="0.5" 
            max="5" 
            step="0.5" 
            value={rotateSpeed}
            onChange={(e) => setRotateSpeed(parseFloat(e.target.value))}
            style={{ width: '100%' }}
            disabled={!autoRotate}
          />
        </div>
      </div>
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 100
        }}>
          <p>Processing image... This may take a moment.</p>
        </div>
      )}
    </div>
  );
};

export default ImageTo3DConverter;