import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import FileUpload from './imageUpload'; // Import the file upload component
import CodeArea from './codeArea';
const App = () => {
  // Define the grid size
  const rows = 32;
  const cols = 128;

  // State to hold the selected color
  const [selectedColor, setSelectedColor] = useState('#ffffff');

  // State to hold brightness (currently ignored for testing)
  const [brightness, setBrightness] = useState(1);

  // State to hold the colors for each pixel
  const [pixelColors, setPixelColors] = useState(
    Array(rows * cols).fill({ color: '#000000', brightness: 1 })
  );

  const [mirrorMode, setMirrorMode] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // State to track if erase mode is active
  const [eraseMode, setEraseMode] = useState(false);

  // Create a reference for the hidden canvas
  const hiddenCanvasRef = useRef(null);

  // Log color and brightness values for debugging
  const logPixelValues = (index, color, brightness) => {
    console.log(`Pixel ${index}: Color - ${color}, Brightness - ${brightness}`);
  };

  // Function to handle pixel coloring or erasing
  const colorPixel = (index) => {
    const newPixelColors = [...pixelColors];

    // If erase mode is active, set the pixel color to black
    const newColor = eraseMode ? '#000000' : selectedColor;
    const newBrightness = eraseMode ? 1 : brightness;

    newPixelColors[index] = { color: newColor, brightness: newBrightness };

    // Log the pixel value to make sure it's being updated
    logPixelValues(index, newColor, newBrightness);

    // If mirror mode is active, mirror the action on the other half of the canvas
    if (mirrorMode) {
      const mirrorIndex = mirrorPixel(index);
      newPixelColors[mirrorIndex] = { color: newColor, brightness: newBrightness };
    }

    setPixelColors(newPixelColors);
  };

  // Function to handle color change
  const handleColorChange = (event) => {
    setSelectedColor(event.target.value);
    setEraseMode(false); // Disable erase mode if a new color is picked
  };

  // Function to mirror a pixel on the opposite side of the canvas
  const mirrorPixel = (index) => {
    const x = index % cols;
    const y = Math.floor(index / cols);

    const mirrorX = cols - 1 - x; // Mirror across the middle column
    const mirrorIndex = y * cols + mirrorX;
    return mirrorIndex;
  };

  // Mouse events handlers for drawing
  const handleMouseDown = (index) => {
    setIsMouseDown(true);
    colorPixel(index);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseEnter = (index) => {
    if (isMouseDown) {
      colorPixel(index);
    }
  };

  // Handle pixel data from the image upload component
  const handleImageProcessed = (imagePixelData) => {
    console.log('Received pixel data from image upload:', imagePixelData);

    // Check if the pixel data array is of the expected size (32 rows x 128 columns = 4096 pixels)
    if (imagePixelData.length === rows * cols) {
      const newPixelColors = [...pixelColors];

      // Merge the uploaded image pixels with the current canvas
      imagePixelData.forEach((pixel, index) => {
        newPixelColors[index] = { color: pixel.color, brightness: pixel.brightness };
        logPixelValues(index, pixel.color, pixel.brightness); // Log values for debugging
      });

      setPixelColors(newPixelColors); // Apply the image to the canvas
    } else {
      console.error('Pixel data does not match canvas size (128x32).');
    }
  };

  // Function to export the canvas as an image
  const exportImage = (format) => {
    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = cols;
    canvas.height = rows;

    // Draw each pixel on the hidden canvas
    pixelColors.forEach((pixel, index) => {
      const x = index % cols;
      const y = Math.floor(index / cols);
      ctx.fillStyle = pixel.color;
      ctx.fillRect(x, y, 1, 1); // Draw a 1x1 square for each pixel
    });

    // Convert the canvas to an image and trigger download
    const dataUrl = canvas.toDataURL(`image/${format}`);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `matrix_image.${format}`;
    link.click();
  };

  const exportJson = () => {
    const leftHalf = pixelColors.slice(0, (cols / 2) * rows).map((pixel, index) => ({
      color: pixel.color,
      brightness: pixel.brightness,
      area: ''
    }));

    const rightHalf = pixelColors.slice((cols / 2) * rows).map((pixel, index) => ({
      color: pixel.color,
      brightness: pixel.brightness,
      area: ''
    }));

    const jsonData = {
      lefthalf: leftHalf,
      righthalf: rightHalf
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'canvas_data.json';
    link.click();
  };

  const clearCanvas = () => {
    setPixelColors(Array(rows * cols).fill({ color: '#000000', brightness: 1 }));
  };

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4"
      onMouseUp={handleMouseUp} // Detect mouse up anywhere in the app
    >
      {/* Title with fade-in */}
      <motion.h1
        className="text-3xl text-white font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Matrix Creator 128x32
      </motion.h1>

      {/* Centered Canvas Container with minimal margins */}
      <div className="w-full mx-4 relative">
        {/* Canvas with responsive grid and border */}
        <motion.div
          className="grid grid-cols-128 gap-[1px] border-2 border-gray-700 p-[2px] mx-auto"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {pixelColors.map((pixel, index) => (
            <div
              key={index}
              onMouseDown={() => handleMouseDown(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              style={{ backgroundColor: pixel.color }}
              className="aspect-square border border-gray-800 cursor-pointer"
            />
          ))}
        </motion.div>

        {/* Dividing line in the middle */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-600"></div>
      </div>



      {/* Title with fade-in */}
      <motion.h1
        className="text-3xl text-white font-bold my-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Drawing Options
      </motion.h1>

      <div className="flex items-center space-x-8 mt-2">
        <div className="flex flex-col items-center">
          <label className="text-white mb-2">Pick a color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorChange}
            className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg"
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="text-white mb-2">Current color:</label>
          <div
            className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
        {/* Erase Tool */}
        <div className="flex flex-col items-center">
          <label className="text-white mb-2">Erase Mode:</label>
          <button
            className={`w-20 h-20 rounded-full border-2 shadow-lg ${eraseMode ? 'bg-gray-400' : 'bg-gray-600'}`}
            onClick={() => setEraseMode(!eraseMode)} // Toggle erase mode
          >
            <span className="text-white font-bold">Erase</span>
          </button>
        </div>
        {/* Clear Canvas */}
        <div className="flex flex-col items-center">
          <label className="text-white mb-2">Clear Canvas:</label>
          <button
            className="w-20 h-20 rounded-full border-2 shadow-lg bg-red-600 hover:bg-red-700"
            onClick={clearCanvas}
          >
            <span className="text-white font-bold">Clear</span>
          </button>
        </div>
      </div>

      {/* Mirror Mode Checkbox */}
      <div className="mt-2 flex items-center space-x-4">
        <input
          type="checkbox"
          id="mirrorMode"
          checked={mirrorMode}
          onChange={(e) => setMirrorMode(e.target.checked)}
          className="h-5 w-5 text-blue-600 rounded focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
        <label htmlFor="mirrorMode" className="text-white text-lg">
          Mirror Mode
        </label>
      </div>

      {/* Title with fade-in */}
      <motion.h1
        className="text-3xl text-white font-bold my-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        File Options
      </motion.h1>

      {/* File Upload Section */}
      <FileUpload onImageProcessed={handleImageProcessed} />

      {/* Export Image Buttons */}
      <div className="mt-2 flex space-x-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded"
          onClick={() => exportImage('png')} // Exports as PNG
        >
          Export as PNG
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white font-bold rounded"
          onClick={() => exportImage('jpeg')} // Exports as JPEG
        >
          Export as JPEG
        </button>

        <button
          className="px-4 py-2 bg-red-600 text-white font-bold rounded"
          onClick={() => exportImage('bmp')} // Exports as BMP
        >
          Export as BMP
        </button>
        <button
          className="px-4 py-2 bg-yellow-600 text-white font-bold rounded"
          onClick={exportJson} // Exports as JSON
        >
          Export as JSON
        </button>
      </div>

      {/* Hidden Canvas for Image Export */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
      
    </div>
  );
};

export default App;
