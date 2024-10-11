import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import FileUpload from './imageUpload'; // Import the file upload component
import { FaCircle, FaSquare, FaDrawPolygon, FaStar, FaFillDrip } from 'react-icons/fa';
import AudioToPythonConverter from './AudioWaveGenerator';
import FrameModal from './FrameModal'; // Import the FrameModal component for full-screen editing
import { FaPlus } from 'react-icons/fa';
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
  const [frames, setFrames] = useState({}); // State to hold frames for each area
  const [showFrameModal, setShowFrameModal] = useState(false); // State to show/hide frame modal
  const [currentFrame, setCurrentFrame] = useState(null); // State to hold current frame being edited
  const [selectedShape, setSelectedShape] = useState(null);
  const [showShapeOptionsModal, setShowShapeOptionsModal] = useState(false); // State for the shape options modal
  const [shapeOptions, setShapeOptions] = useState({
    isFilled: true,
    width: 10,
    height: 5,
    radius: 5,
    triangleType: 'equilateral',
  });
  const [fillColor, setFillColor] = useState('#ffffff');
const [showFillCanvasModal, setShowFillCanvasModal] = useState(false);

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
    } else if (selectedShape) {
      drawShape(selectedShape, index);
      setSelectedShape(null); // Reset the shape selection after drawing
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
    const jsonData = {
      canvas: pixelColors.map((pixel) => ({
        color: pixel.color,
        brightness: pixel.brightness,
        area: pixel.area,
        x: pixel.x,
        y: pixel.y,
      })),
      frames: Object.keys(frames).reduce((acc, areaName) => {
        acc[areaName] = frames[areaName].map((frame) => ({
          id: frame.id,
          pixels: frame.pixels.map((pixel, index) => ({
            color: pixel.color,
            brightness: pixel.brightness,
            area: areaName,
            x: index % cols,
            y: Math.floor(index / cols),
          })),
        }));
        return acc;
      }, {}),
    };

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
        setFrames({ ...frames, [newArea.name]: [] }); // Initialize frames for the new area
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

  // Function to rename an area
  const renameArea = (areaIndex) => {
    const newAreas = [...areas];
    const newName = prompt('Enter new name for the area:', newAreas[areaIndex].name);
    if (newName) {
      const oldName = newAreas[areaIndex].name;
      newAreas[areaIndex].name = newName;
      setAreas(newAreas);
      setFrames((prevFrames) => {
        const newFrames = { ...prevFrames };
        if (prevFrames[oldName]) {
          newFrames[newName] = newFrames[oldName];
          delete newFrames[oldName];
        }
        return newFrames;
      });
    }
  };

  // Function to delete an area
  const deleteArea = (areaIndex) => {
    const areaName = areas[areaIndex].name;
    const newAreas = areas.filter((_, index) => index !== areaIndex);
    setAreas(newAreas);
    setPixelColors(pixelColors.map(pixel => pixel.area === areaName ? { ...pixel, area: '' } : pixel));
    setFrames((prevFrames) => {
      const newFrames = { ...prevFrames };
      delete newFrames[areaName];
      return newFrames;
    });
  };

  // Function to add a new frame for an area
  const addNewFrame = (areaName) => {
    const area = areas.find(a => a.name === areaName);
    if (!area) return;
  
    const areaWidth = (area.bottomRight % cols) - (area.topLeft % cols) + 1;
    const areaHeight = Math.floor(area.bottomRight / cols) - Math.floor(area.topLeft / cols) + 1;
  
    setFrames((prevFrames) => {
      const newFrames = { ...prevFrames };
      newFrames[areaName] = [
        ...(newFrames[areaName] || []),
        {
          id: (newFrames[areaName]?.length || 0) + 1,
          pixels: Array(areaWidth * areaHeight).fill({ color: '#000000', brightness: 1 }),
        },
      ];
      return newFrames;
    });
  };
  

  // Function to delete a frame
  const deleteFrame = (areaName, frameIndex) => {
    setFrames((prevFrames) => {
      const newFrames = { ...prevFrames };
      newFrames[areaName] = newFrames[areaName].filter((_, index) => index !== frameIndex);
      return newFrames;
    });
  };

  // Function to open the frame modal for full-screen editing
  const openFrameModal = (areaName, frameIndex) => {
    setCurrentFrame({ areaName, frameIndex });
    setShowFrameModal(true);
  };

  // Function to save a frame from the modal
  const saveFrame = (updatedPixels) => {
    setFrames((prevFrames) => {
      const newFrames = { ...prevFrames };
      newFrames[currentFrame.areaName][currentFrame.frameIndex].pixels = updatedPixels;
      return newFrames;
    });
  };

  // Function to handle drawing the shape after options are set
  const drawShape = (shape, startIndex) => {
    const newPixelColors = [...pixelColors];
    const startX = startIndex % cols;
    const startY = Math.floor(startIndex / cols);
    const { isFilled, width, height, radius, triangleType } = shapeOptions;

    let pixelsToColor = [];

    switch (shape) {
      case 'circle':
        for (let y = -radius; y <= radius; y++) {
          for (let x = -radius; x <= radius; x++) {
            if (x * x + y * y <= radius * radius) {
              if (isFilled || x * x + y * y >= (radius - 1) * (radius - 1)) {
                const targetX = startX + x;
                const targetY = startY + y;
                if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
                  pixelsToColor.push(targetY * cols + targetX);
                }
              }
            }
          }
        }
        break;

      case 'rectangle':
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const targetX = startX + x;
            const targetY = startY + y;
            if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
              if (isFilled || y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                pixelsToColor.push(targetY * cols + targetX);
              }
            }
          }
        }
        break;

      case 'triangle':
        const base = width;
        for (let y = 0; y < height; y++) {
          for (let x = -y; x <= y; x++) {
            const targetX = startX + x;
            const targetY = startY + y;
            if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
              if (isFilled || y === height - 1 || x === -y || x === y) {
                pixelsToColor.push(targetY * cols + targetX);
              }
            }
          }
        }
        break;

      case 'star':
        // Example star shape (simplified for demonstration)
        const starPoints = [
          [0, -3], [1, -1], [3, -1], [1, 0], [2, 2], [0, 1], [-2, 2], [-1, 0], [-3, -1], [-1, -1]
        ];
        starPoints.forEach(([dx, dy]) => {
          const targetX = startX + dx;
          const targetY = startY + dy;
          if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
            pixelsToColor.push(targetY * cols + targetX);
          }
        });
        break;

      default:
        break;
    }

    pixelsToColor.forEach((index) => {
      newPixelColors[index] = { color: selectedColor, brightness: brightness, area: '', x: index % cols, y: Math.floor(index / cols) };
    });

    setPixelColors(newPixelColors);
  };

  // Function to handle shape selection
  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);
    setShowShapeOptionsModal(true);
  };

  const fillCanvas = (color) => {
    const newPixelColors = pixelColors.map((pixel) => ({
      ...pixel,
      color: color,
    }));
    setPixelColors(newPixelColors);
  };
  

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans"
      onMouseUp={handleMouseUp} // Detect mouse up anywhere in the app
    >
      {/* Title with fade-in */}
      <motion.h1
        className="text-3xl text-purple-300 font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Matrix Creator 128x32
      </motion.h1>

      {showFillCanvasModal && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-70 z-50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-purple-500">
            <p className="text-white text-lg mb-4">Pick a color to fill the entire canvas:</p>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg mb-4"
            />
            <button
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded shadow-lg hover:shadow-purple-400 transition-all"
              onClick={() => {
                fillCanvas(fillColor);
                setShowFillCanvasModal(false);
              }}
            >
              Fill Canvas
            </button>
            <button
              className="ml-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded shadow-lg hover:shadow-red-400 transition-all"
              onClick={() => setShowFillCanvasModal(false)}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}


      {/* Modal for Shape Options */}
      {showShapeOptionsModal && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-70 z-50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-purple-500">
            <p className="text-white text-lg mb-4">Set options for {selectedShape}:</p>
            {selectedShape === 'circle' && (
              <>
                <label className="text-white text-sm mb-2 block">Radius:</label>
                <input
                  type="number"
                  value={shapeOptions.radius}
                  min="1"
                  max={Math.min(rows, cols)}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, radius: Math.min(Number(e.target.value), Math.min(rows, cols)) })}
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                />
                <label className="text-white text-sm mb-2 block">Filled:</label>
                <input
                  type="checkbox"
                  checked={shapeOptions.isFilled}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, isFilled: e.target.checked })}
                  className="mb-4"
                />
              </>
            )}
            {selectedShape === 'rectangle' && (
              <>
                <label className="text-white text-sm mb-2 block">Width:</label>
                <input
                  type="number"
                  value={shapeOptions.width}
                  min="1"
                  max={cols}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, width: Math.min(Number(e.target.value), cols) })}
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                />
                <label className="text-white text-sm mb-2 block">Height:</label>
                <input
                  type="number"
                  value={shapeOptions.height}
                  min="1"
                  max={rows}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, height: Math.min(Number(e.target.value), rows) })}
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                />
                <label className="text-white text-sm mb-2 block">Filled:</label>
                <input
                  type="checkbox"
                  checked={shapeOptions.isFilled}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, isFilled: e.target.checked })}
                  className="mb-4"
                />
              </>
            )}
            {selectedShape === 'triangle' && (
              <>
                <label className="text-white text-sm mb-2 block">Base Width:</label>
                <input
                  type="number"
                  value={shapeOptions.width}
                  min="1"
                  max={cols}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, width: Math.min(Number(e.target.value), cols) })}
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                />
                <label className="text-white text-sm mb-2 block">Height:</label>
                <input
                  type="number"
                  value={shapeOptions.height}
                  min="1"
                  max={rows}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, height: Math.min(Number(e.target.value), rows) })}
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                />
                <label className="text-white text-sm mb-2 block">Triangle Type:</label>
                <select
                  value={shapeOptions.triangleType}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, triangleType: e.target.value })}
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                >
                  <option value="equilateral">Equilateral</option>
                  <option value="isosceles">Isosceles</option>
                  <option value="scalene">Scalene</option>
                </select>
                <label className="text-white text-sm mb-2 block">Filled:</label>
                <input
                  type="checkbox"
                  checked={shapeOptions.isFilled}
                  onChange={(e) => setShapeOptions({ ...shapeOptions, isFilled: e.target.checked })}
                  className="mb-4"
                />
              </>
            )}
            {selectedShape === 'star' && (
              <p className="text-white text-sm mb-4">Note: No additional settings for star shape.</p>
            )}
            <button
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded shadow-lg hover:shadow-purple-400 transition-all"
              onClick={() => {
                setShowShapeOptionsModal(false);
              }}
            >
              OK
            </button>
            <button
              className="mt-4 ml-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded shadow-lg hover:shadow-red-400 transition-all"
              onClick={() => {
                setShowShapeOptionsModal(false);
                setSelectedShape(null);
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Modal Message for Area Selection */}
      {showModal && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-70 z-50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-purple-500">
            <p className="text-white text-lg">{modalMessage}</p>
            <button
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded shadow-lg hover:shadow-purple-400 transition-all"
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
              className="mt-4 ml-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded shadow-lg hover:shadow-red-400 transition-all"
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
          className="grid grid-cols-128 gap-[1px] border-2 border-purple-500 p-[2px] mx-auto"
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
          className="absolute top-0 left-1/2 w-0.5 h-full bg-purple-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        ></motion.div>
        {/* Horizontal line to separate canvas and sections */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gray-600 mt-6"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1 }}
        ></motion.div>

      </div>


      <motion.h1
        className="text-2xl text-purple-300 font-semibold mt-8 mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Drawing Options
      </motion.h1>

      {/* Drawing Options */}
      <div className="flex items-center space-x-8 mt-2">
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white font-semibold mb-2">Pick a color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorChange}
            className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg hover:shadow-purple-500 transition duration-300"
          />
        </motion.div>
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white font-semibold mb-2">Current color:</label>
          <div
            className="w-20 h-20 rounded-full border-2 border-gray-300 shadow-lg hover:shadow-purple-500 transition duration-300"
            style={{ backgroundColor: selectedColor }}
          />
        </motion.div>

        {/* Buttons */}
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white font-semibold mb-2">Erase Mode:</label>
          <button
            className={`w-20 h-20 rounded-full border-2 shadow-lg ${eraseMode ? 'bg-gray-400' : 'bg-gray-600'} hover:shadow-purple-500 transition duration-300`}
            onClick={() => setEraseMode(!eraseMode)}
          >
            <span className="text-white font-bold">Erase</span>
          </button>
        </motion.div>
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white font-semibold mb-2">Clear Canvas:</label>
          <button
            className="w-20 h-20 rounded-full border-2 shadow-lg bg-gradient-to-br from-purple-500 to-rose-700 hover:from-rose-600 hover:to-purple-800 transition duration-300"
            onClick={clearCanvas}
          >
            <span className="text-white font-bold">Clear</span>
          </button>
        </motion.div>
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white font-semibold mb-2">Draw Shape:</label>
          <div className="flex space-x-4">
            <button
              onClick={() => handleShapeSelect('circle')}
              className="w-20 h-20 rounded-full border-2 shadow-lg bg-blue-500 hover:shadow-purple-500 transition duration-300 flex items-center justify-center"
            >
              <FaCircle className="text-white text-3xl" />
            </button>
            <button
              onClick={() => handleShapeSelect('rectangle')}
              className="w-20 h-20 rounded-full border-2 shadow-lg bg-green-500 hover:shadow-purple-500 transition duration-300 flex items-center justify-center"
            >
              <FaSquare className="text-white text-3xl" />
            </button>
            <button
              onClick={() => handleShapeSelect('triangle')}
              className="w-20 h-20 rounded-full border-2 shadow-lg bg-yellow-500 hover:shadow-purple-500 transition duration-300 flex items-center justify-center"
            >
              <FaDrawPolygon className="text-white text-3xl" />
            </button>
            <button
              onClick={() => handleShapeSelect('star')}
              className="w-20 h-20 rounded-full border-2 shadow-lg bg-red-500 hover:shadow-purple-500 transition duration-300 flex items-center justify-center"
            >
              <FaStar className="text-white text-3xl" />
            </button>
          </div>
        </motion.div>
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }}>
          <label className="text-white font-semibold mb-2">Fill Canvas:</label>
          <button
            className="w-20 h-20 rounded-full border-2 shadow-lg bg-gradient-to-br from-blue-500 to-teal-700 hover:from-teal-600 hover:to-blue-800 transition duration-300 flex items-center justify-center"
            onClick={() => setShowFillCanvasModal(true)}
          >
            <FaFillDrip className="text-white text-3xl" />
          </button>
        </motion.div>

      </div>

      {/* Mirror Mode */}
      <motion.div className="mt-6 flex items-center space-x-4" whileHover={{ scale: 1.05 }}>
        <input
          type="checkbox"
          id="mirrorMode"
          checked={mirrorMode}
          onChange={(e) => setMirrorMode(e.target.checked)}
          className="h-5 w-5 text-purple-600 rounded focus:ring focus:ring-purple-500 hover:ring-2 hover:ring-purple-500 transition duration-300"
        />
        <label htmlFor="mirrorMode" className="text-white text-lg">Mirror Mode</label>
      </motion.div>


      <div className="mx-4">
        {/* Horizontal line to separate canvas and sections */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gray-600 mt-2"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1 }}
        ></motion.div>
        {/* Animations Section */}
        <motion.h1 className="text-3xl text-purple-300 font-bold my-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          Animations
        </motion.h1>


      </div>


      <div className="w-full max-w-4xl mt-4">
        {areas.map((area, areaIndex) => (
          <motion.div key={areaIndex} className="mb-8" whileHover={{ scale: 1.05 }}>
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-white text-xl cursor-pointer" onClick={() => toggleAreaHighlight(area.name)}>
                {area.name} (Start: [{area.topLeft % cols}, {Math.floor(area.topLeft / cols)}], End: [{area.bottomRight % cols}, {Math.floor(area.bottomRight / cols)}])
              </h2>
              <button className="bg-gray-700 text-white text-sm px-2 py-1 rounded-full hover:bg-gray-600 transition duration-300" onClick={() => renameArea(areaIndex)}>
                Rename
              </button>
              <button className="bg-red-600 text-white text-sm px-2 py-1 rounded-full hover:bg-red-500 transition duration-300" onClick={() => deleteArea(areaIndex)}>
                Delete
              </button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {frames[area.name]?.map((frame, frameIndex) => (
                <div key={frameIndex} className="w-16 h-16 bg-gray-700 text-white flex items-center justify-center relative cursor-pointer" onClick={() => openFrameModal(area.name, frameIndex)}>
                  Frame {frameIndex + 1}
                  <button className="absolute top-0 right-0 bg-red-600 text-xs px-1 py-0.5 rounded-full hover:bg-red-500 transition duration-300" onClick={(e) => { e.stopPropagation(); deleteFrame(area.name, frameIndex); }}>
                    X
                  </button>
                </div>
              ))}
              <motion.button className="w-16 h-16 rounded-full border-2 bg-gradient-to-br from-purple-500 to-rose-700 hover:from-rose-600 hover:to-purple-800  flex items-center justify-center shadow-lg hover:shadow-purple-500 transition duration-300" onClick={() => addNewFrame(area.name)} whileHover={{ scale: 1.1 }}>
                <FaPlus className="text-white text-xl" />
              </motion.button>
            </div>
          </motion.div>
        ))}
        <motion.button className="mt-4 w-16 h-16 rounded-full border-2  bg-gradient-to-br from-purple-500 to-rose-700 hover:from-rose-600 hover:to-purple-800  flex items-center justify-center shadow-lg hover:shadow-purple-500 transition duration-300" onClick={addNewArea} whileHover={{ scale: 1.1 }}>
          <FaPlus className="text-white text-xl" />
        </motion.button>
      </div>
      {/* Export and Import Section */}
      <div className="w-full  mt-8">
        {/* Horizontal line above the title */}
        <motion.div
          className="w-full h-0.5 bg-gray-600 mb-4"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1 }}
        ></motion.div>

        <motion.h1
          className="text-3xl text-center text-purple-300 font-bold my-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Import and export options
        </motion.h1>
      </div>

      {/* File Upload Section */}
      <FileUpload onImageProcessed={handleImageProcessed} />

      {/* Export Image Buttons */}
      <div className="mt-2 flex space-x-4">
        <motion.button
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded shadow-lg hover:shadow-blue-400 transition duration-300"
          onClick={() => exportImage('png')} // Exports as PNG
          whileHover={{ scale: 1.1 }}
        >
          Export as PNG
        </motion.button>

        <motion.button
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded shadow-lg hover:shadow-green-400 transition duration-300"
          onClick={() => exportImage('jpeg')} // Exports as JPEG
          whileHover={{ scale: 1.1 }}
        >
          Export as JPEG
        </motion.button>

        <motion.button
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded shadow-lg hover:shadow-red-400 transition duration-300"
          onClick={() => exportImage('bmp')} // Exports as BMP
          whileHover={{ scale: 1.1 }}
        >
          Export as BMP
        </motion.button>

        <motion.button
          className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded shadow-lg hover:shadow-yellow-400 transition duration-300"
          onClick={exportJson} // Exports as JSON
          whileHover={{ scale: 1.1 }}
        >
          Export as JSON
        </motion.button>
      </div>
      {/* <AudioToPythonConverter/> */}


      {/* Hidden Canvas for Image Export */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      {/* Frame Modal for full-screen editing */}
      {showFrameModal && (
        <FrameModal
          isOpen={showFrameModal}
          onClose={() => setShowFrameModal(false)}
          frameData={frames[currentFrame.areaName][currentFrame.frameIndex].pixels}
          area={areas.find(area => area.name === currentFrame.areaName)}
          cols={cols}
          rows={rows}
          selectedColor={selectedColor}
          mirrorMode={mirrorMode}
          brightness={brightness}
          onSave={saveFrame}
        />
      )}
    </div>
  );
};

export default App;
