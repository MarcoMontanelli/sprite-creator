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
    Array(rows * cols).fill({ color: '#000000', brightness: 1, area: '', x: 0, y: 0 })
  );

  const [mirrorMode, setMirrorMode] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [areas, setAreas] = useState([]);
  const [currentArea, setCurrentArea] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [highlightedArea, setHighlightedArea] = useState(null);

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

    const x = index % cols;
    const y = Math.floor(index / cols);

    newPixelColors[index] = { color: newColor, brightness: newBrightness, area: newPixelColors[index].area, x, y };

    // Log the pixel value to make sure it's being updated
    logPixelValues(index, newColor, newBrightness);

    // If mirror mode is active, mirror the action on the other half of the canvas
    if (mirrorMode) {
      const mirrorIndex = mirrorPixel(index);
      const mirrorX = mirrorIndex % cols;
      const mirrorY = Math.floor(mirrorIndex / cols);
      newPixelColors[mirrorIndex] = { color: newColor, brightness: newBrightness, area: newPixelColors[mirrorIndex].area, x: mirrorX, y: mirrorY };
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
    if (isSelectingArea) {
      handleAreaSelection(index);
    } else {
      setIsMouseDown(true);
      colorPixel(index);
    }
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
        const x = index % cols;
        const y = Math.floor(index / cols);
        newPixelColors[index] = { color: pixel.color, brightness: pixel.brightness, area: newPixelColors[index].area, x, y };
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
    const jsonData = pixelColors.map((pixel) => ({
      color: pixel.color,
      brightness: pixel.brightness,
      area: pixel.area,
      x: pixel.x,
      y: pixel.y
    }));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'canvas_data.json';
    link.click();
  };

  // Function to clear the canvas
  const clearCanvas = () => {
    setPixelColors(Array(rows * cols).fill({ color: '#000000', brightness: 1, area: '', x: 0, y: 0 }));
    setAreas([]); // Clear all areas
    setHighlightedArea(null); // Clear highlighted areas
  };

  // Function to handle adding a new area
  const addNewArea = () => {
    setShowModal(true);
    setModalMessage('Select the top-left corner of the new area.');
  };

  // Function to handle area selection
  const handleAreaSelection = (index) => {
    if (!currentArea) {
      // Initial selection - set the top-left corner
      const newArea = { name: `area${areas.length + 1}`, topLeft: index, bottomRight: null, color: `hsl(${areas.length * 60}, 100%, 50%)` };
      setCurrentArea(newArea);
      setModalMessage('Select the bottom-right corner of the new area.');
      setShowModal(true);
      console.log(`Top-left corner selected at: (${index % cols}, ${Math.floor(index / cols)})`);
    } else if (currentArea && currentArea.topLeft !== null && currentArea.bottomRight === null) {
      // Selecting the bottom-right corner
      const topLeftX = currentArea.topLeft % cols;
      const topLeftY = Math.floor(currentArea.topLeft / cols);
      const bottomRightX = index % cols;
      const bottomRightY = Math.floor(index / cols);
  
      console.log(`Bottom-right corner selected at: (${bottomRightX}, ${bottomRightY})`);
  
      // Ensure the bottom-right is not above or to the left of the top-left
      if (bottomRightX >= topLeftX && bottomRightY >= topLeftY) {
        const newArea = { ...currentArea, bottomRight: index };
        setAreas([...areas, newArea]);
        setIsSelectingArea(false);
        setModalMessage('');
        setShowModal(false);
  
        const newPixelColors = [...pixelColors];
  
        // Update pixel area data and mark borders
        for (let y = topLeftY; y <= bottomRightY; y++) {
          for (let x = topLeftX; x <= bottomRightX; x++) {
            const idx = y * cols + x;
            newPixelColors[idx] = {
              ...newPixelColors[idx],
              area: newArea.name,
              isTopEdge: y === topLeftY,
              isBottomEdge: y === bottomRightY,
              isLeftEdge: x === topLeftX,
              isRightEdge: x === bottomRightX,
              areaColor: newArea.color,
              x,
              y,
            };
          }
        }
  
        setPixelColors(newPixelColors);
        setCurrentArea(null);
      } else {
        // Provide feedback if the area is invalid
        setModalMessage('Please select a valid bottom-right corner that is below and to the right of the top-left corner.');
        setShowModal(true);
      }
    }
  };

  // Function to handle area highlight toggle
  const toggleAreaHighlight = (areaName) => {
    setHighlightedArea((prev) => (prev === areaName ? null : areaName));
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

      {/* Modal Message for Area Selection */}
      {showModal && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-70 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <p className="text-white text-lg">{modalMessage}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
              onClick={() => {
                if (modalMessage.includes('top-left')) {
                  setIsSelectingArea(true);
                  setShowModal(false);
                } else if (modalMessage.includes('bottom-right')) {
                  setShowModal(false);
                }
              }}
            >
              OK
            </button>
            <button
              className="mt-4 ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
              onClick={() => {
                setIsSelectingArea(false);
                setCurrentArea(null);
                setModalMessage('');
                setShowModal(false);
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

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
          {pixelColors.map((pixel, index) => {
            const { color, isTopEdge, isBottomEdge, isLeftEdge, isRightEdge, area, areaColor } = pixel;
            const isHighlighted = highlightedArea === area;

            // Determine Tailwind border classes based on edge status
            const topBorder = isHighlighted && isTopEdge ? `border-t-4` : '';
            const bottomBorder = isHighlighted && isBottomEdge ? `border-b-4` : '';
            const leftBorder = isHighlighted && isLeftEdge ? `border-l-4` : '';
            const rightBorder = isHighlighted && isRightEdge ? `border-r-4` : '';
            const borderColor = isHighlighted ? `border-[${areaColor}]` : 'border-gray-800';

            return (
              <motion.div
                key={index}
                onMouseDown={() => handleMouseDown(index)}
                onMouseEnter={() => handleMouseEnter(index)}
                style={{ backgroundColor: color }}
                className={`aspect-square border ${borderColor} cursor-pointer ${topBorder} ${bottomBorder} ${leftBorder} ${rightBorder}`}
                whileHover={{ scale: 1.05 }}
              />
            );
          })}
        </motion.div>

        {/* Dividing line in the middle */}
        <motion.div
          className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        ></motion.div>
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

      {/* Centered Color Picker, Current Color Indicator, Erase Tool, and Clear Canvas */}
      <div className="flex items-center space-x-8 mt-2">
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white mb-2">Pick a color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorChange}
            className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg hover:shadow-2xl transition duration-300"
          />
        </motion.div>
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white mb-2">Current color:</label>
          <div
            className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg hover:shadow-2xl transition duration-300"
            style={{ backgroundColor: selectedColor }}
          />
        </motion.div>
        {/* Erase Tool */}
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white mb-2">Erase Mode:</label>
          <button
            className={`w-20 h-20 rounded-full border-2 shadow-lg ${eraseMode ? 'bg-gray-400' : 'bg-gray-600'} hover:shadow-2xl transition duration-300`}
            onClick={() => setEraseMode(!eraseMode)} // Toggle erase mode
          >
            <span className="text-white font-bold">Erase</span>
          </button>
        </motion.div>
        {/* Clear Canvas */}
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white mb-2">Clear Canvas:</label>
          <button
            className="w-20 h-20 rounded-full border-2 shadow-lg bg-red-600 hover:bg-red-700 hover:shadow-2xl transition duration-300"
            onClick={clearCanvas}
          >
            <span className="text-white font-bold">Clear</span>
          </button>
        </motion.div>
      </div>

      {/* Mirror Mode Checkbox */}
      <motion.div className="mt-6 flex items-center space-x-4" whileHover={{ scale: 1.05 }}>
        <input
          type="checkbox"
          id="mirrorMode"
          checked={mirrorMode}
          onChange={(e) => setMirrorMode(e.target.checked)}
          className="h-5 w-5 text-blue-600 rounded focus:ring focus:ring-blue-500 focus:ring-opacity-50 hover:ring-2 hover:ring-blue-500 transition duration-300"
        />
        <label htmlFor="mirrorMode" className="text-white text-lg">
          Mirror Mode
        </label>
      </motion.div>

      {/* Title with fade-in */}
      <motion.h1
        className="text-3xl text-white font-bold my-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Animations
      </motion.h1>

      {/* Animations Section */}
      <div className="w-full max-w-4xl mt-4">
        {areas.map((area, areaIndex) => {
          const topLeftX = area.topLeft % cols;
          const topLeftY = Math.floor(area.topLeft / cols);
          const bottomRightX = area.bottomRight % cols;
          const bottomRightY = Math.floor(area.bottomRight / cols);
          return (
            <motion.div key={areaIndex} className="mb-8" whileHover={{ scale: 1.05 }}>
              <h2
                className="text-white text-xl mb-4 cursor-pointer"
                onClick={() => toggleAreaHighlight(area.name)}
              >
                {area.name} (Start: [{topLeftX}, {topLeftY}], End: [{bottomRightX}, {bottomRightY}])
              </h2>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {Array.from({ length: 1 }).map((_, frameIndex) => (
                  <motion.div
                    key={frameIndex}
                    className="w-32 h-16 border-2 border-gray-700 bg-gray-900 flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-center text-white text-sm">Frame {frameIndex + 1}</p>
                  </motion.div>
                ))}
                <motion.button
                  className="w-16 h-16 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 hover:from-blue-600 hover:to-blue-400 flex items-center justify-center shadow-lg hover:shadow-2xl transition duration-300"
                  onClick={() => {
                    // Add new frame logic
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-white text-4xl font-bold">+</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
        <motion.button
          className="mt-4 w-20 h-20 rounded-full border-2 shadow-lg bg-gradient-to-br from-blue-500 to-blue-300 hover:from-blue-600 hover:to-blue-400 flex items-center justify-center hover:shadow-2xl transition duration-300"
          onClick={addNewArea}
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-white font-bold text-4xl">+</span>
        </motion.button>
      </div>

      {/* File Upload Section */}
      <FileUpload onImageProcessed={handleImageProcessed} />

      {/* Export Image Buttons */}
      <div className="mt-2 flex space-x-4">
        <motion.button
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition duration-300"
          onClick={() => exportImage('png')} // Exports as PNG
          whileHover={{ scale: 1.05 }}
        >
          Export as PNG
        </motion.button>

        <motion.button
          className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition duration-300"
          onClick={() => exportImage('jpeg')} // Exports as JPEG
          whileHover={{ scale: 1.05 }}
        >
          Export as JPEG
        </motion.button>

        <motion.button
          className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition duration-300"
          onClick={() => exportImage('bmp')} // Exports as BMP
          whileHover={{ scale: 1.05 }}
        >
          Export as BMP
        </motion.button>
        <motion.button
          className="px-4 py-2 bg-yellow-600 text-white font-bold rounded hover:bg-yellow-700 transition duration-300"
          onClick={exportJson} // Exports as JSON
          whileHover={{ scale: 1.05 }}
        >
          Export as JSON
        </motion.button>
      </div>

      {/* Hidden Canvas for Image Export */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
      
    </div>
  );
};

export default App;