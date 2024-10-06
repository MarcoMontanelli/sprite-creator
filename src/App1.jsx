import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FileUpload from './imageUpload'; // Import the file upload component

const App = () => {
  // Define the grid size
  const rows = 32;
  const cols = 128;

  // State to hold the selected color and brightness
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [brightness, setBrightness] = useState(1); // Default brightness is 1 (full)

  // State to hold the colors and brightness for each pixel
  const [pixelColors, setPixelColors] = useState(
    Array(rows * cols).fill({ color: '#000000', brightness: 1 })
  );

  const [mirrorMode, setMirrorMode] = useState(false); // State to track mirror mode
  const [isMouseDown, setIsMouseDown] = useState(false); // State to track if mouse is down

  // Function to apply brightness to the color (returns an rgba color)
  const applyBrightness = (color, brightness) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${brightness})`;
  };

  // Function to handle pixel coloring
  const colorPixel = (index) => {
    const newPixelColors = [...pixelColors];

    // Toggle color: if it's already colored, set it back to blank (black)
    const currentPixel = newPixelColors[index];
    const isSameColor =
      currentPixel.color === selectedColor && currentPixel.brightness === brightness;
    const newColor = isSameColor ? '#000000' : selectedColor;
    const newBrightness = isSameColor ? 1 : brightness;

    newPixelColors[index] = { color: newColor, brightness: newBrightness };

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
  };

  // Function to handle brightness change
  const handleBrightnessChange = (event) => {
    setBrightness(event.target.value);
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
      });

      setPixelColors(newPixelColors); // Apply the image to the canvas
    } else {
      console.error('Pixel data does not match canvas size (128x32).');
    }
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
              style={{ backgroundColor: applyBrightness(pixel.color, pixel.brightness) }}
              className="aspect-square border border-gray-800 cursor-pointer"
            />
          ))}
        </motion.div>

        {/* Dividing line in the middle */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-600"></div>
      </div>

      {/* File Upload Section */}
      <FileUpload onImageProcessed={handleImageProcessed} />

      {/* Title with fade-in */}
      <motion.h1
        className="text-3xl text-white font-bold my-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Drawing Options
      </motion.h1>

      {/* Centered Color Picker and Current Color Indicator */}
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
            style={{ backgroundColor: applyBrightness(selectedColor, brightness) }}
          />
        </div>
      </div>

      {/* Brightness Slider */}
      <div className="flex items-center space-x-4 mt-4">
        <label className="text-white">Brightness:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={brightness}
          onChange={handleBrightnessChange}
          className="w-64"
        />
      </div>

      {/* Mirror Mode Checkbox */}
      <div className="mt-6 flex items-center space-x-4">
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
    </div>
  );
};

export default App;
