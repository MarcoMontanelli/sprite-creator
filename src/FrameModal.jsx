import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const FrameModal = ({ isOpen, onClose, frameData, area, selectedColor, mirrorMode, brightness, onSave }) => {
  const areaWidth = Math.max((area.bottomRight % 128) - (area.topLeft % 128) + 1, 1);
  const areaHeight = Math.max(Math.floor(area.bottomRight / 128) - Math.floor(area.topLeft / 128) + 1, 1);
  const totalPixels = areaWidth * areaHeight;

  const [framePixelColors, setFramePixelColors] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [mirrorModeState, setMirrorModeState] = useState(mirrorMode);
  const [selectedColorState, setSelectedColorState] = useState(selectedColor);

  useEffect(() => {
    if (Array.isArray(frameData) && frameData.length === totalPixels) {
      setFramePixelColors(frameData);
    } else {
      setFramePixelColors(Array(totalPixels).fill({ color: '#000000', brightness: 1 }));
    }
  }, [frameData, totalPixels]);

  const colorPixel = (index) => {
    if (index < 0 || index >= framePixelColors.length) return;

    const newPixelColors = [...framePixelColors];
    const newColor = eraseMode ? '#000000' : selectedColorState;
    const newBrightness = eraseMode ? 1 : brightness;

    newPixelColors[index] = { color: newColor, brightness: newBrightness };

    if (mirrorModeState) {
      const mirrorIndex = mirrorPixel(index);
      if (mirrorIndex >= 0 && mirrorIndex < newPixelColors.length) {
        newPixelColors[mirrorIndex] = { color: newColor, brightness: newBrightness };
      }
    }

    setFramePixelColors(newPixelColors);
  };

  const mirrorPixel = (index) => {
    const x = index % areaWidth;
    const y = Math.floor(index / areaWidth);
    const mirrorX = areaWidth - 1 - x;
    const mirrorIndex = y * areaWidth + mirrorX;
    return mirrorIndex;
  };

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

  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave(framePixelColors);
      onClose();
    } else {
      console.error('onSave is not a function');
    }
  };

  const clearFrame = () => {
    setFramePixelColors(Array(totalPixels).fill({ color: '#000000', brightness: 1 }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Frame Editor"
      className="w-full h-full flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black bg-opacity-80 z-50"
    >
      <motion.div
        className="bg-gray-900 p-8 rounded-lg shadow-2xl border border-purple-500 w-full max-w-screen-lg h-auto max-h-screen overflow-y-auto relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <h2 className="text-3xl text-purple-300 font-bold mb-4">Frame Editor</h2>

        <motion.div
          className="grid gap-[1px] border-2 border-purple-500 p-[2px] mx-auto"
          style={{
            gridTemplateColumns: `repeat(${areaWidth}, 1fr)`,
            gridTemplateRows: `repeat(${areaHeight}, 1fr)`,
            maxWidth: `${areaWidth * 20}px`,
            maxHeight: `${areaHeight * 20}px`,
            minWidth: '200px',
            minHeight: '200px',
          }}
          onMouseUp={handleMouseUp}
        >
          {framePixelColors.map((pixel, index) => (
            <motion.div
              key={index}
              onMouseDown={() => handleMouseDown(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              style={{ backgroundColor: pixel.color }}
              className={`aspect-square border border-gray-800 cursor-pointer`}
              whileHover={{ scale: 1.05 }}
            />
          ))}
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap items-center space-x-8 mt-8 justify-center">
          {/* Color Picker */}
          <motion.div className="flex flex-col items-center mb-4" whileHover={{ scale: 1.05 }}>
            <label className="text-white mb-2">Pick a color:</label>
            <input
              type="color"
              value={selectedColorState}
              onChange={(e) => setSelectedColorState(e.target.value)}
              className="w-16 h-16 rounded-full border-2 border-gray-300 shadow-lg hover:shadow-purple-500 transition duration-300"
            />
          </motion.div>

          {/* Erase Tool */}
          <motion.div className="flex flex-col items-center mb-4" whileHover={{ scale: 1.05 }}>
            <label className="text-white mb-2">Erase Mode:</label>
            <button
              className={`w-16 h-16 rounded-full border-2 shadow-lg ${eraseMode ? 'bg-gray-400' : 'bg-gray-600'} hover:shadow-purple-500 transition duration-300`}
              onClick={() => setEraseMode(!eraseMode)}
            >
              <span className="text-white font-bold">Erase</span>
            </button>
          </motion.div>

          {/* Mirror Mode */}
          <motion.div className="flex flex-col items-center mb-4" whileHover={{ scale: 1.05 }}>
            <label className="text-white mb-2">Mirror Mode:</label>
            <button
              className={`w-16 h-16 rounded-full border-2 shadow-lg ${mirrorModeState ? 'bg-blue-500' : 'bg-gray-600'} hover:shadow-purple-500 transition duration-300`}
              onClick={() => setMirrorModeState(!mirrorModeState)}
            >
              <span className="text-white font-bold">Mirror</span>
            </button>
          </motion.div>

          {/* Clear Frame */}
          <motion.div className="flex flex-col items-center mb-4" whileHover={{ scale: 1.05 }}>
            <label className="text-white mb-2">Clear Frame:</label>
            <button
              className="w-16 h-16 rounded-full border-2 shadow-lg bg-red-600 hover:bg-red-700 hover:shadow-red-500 transition duration-300"
              onClick={clearFrame}
            >
              <span className="text-white font-bold">Clear</span>
            </button>
          </motion.div>

          {/* Save Frame */}
          <motion.div className="flex flex-col items-center mb-4" whileHover={{ scale: 1.05 }}>
            <label className="text-white mb-2">Save Frame:</label>
            <button
              className="w-16 h-16 rounded-full border-2 shadow-lg bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500 transition duration-300"
              onClick={handleSave}
            >
              <span className="text-white font-bold">Save</span>
            </button>
          </motion.div>

          {/* Cancel */}
          <motion.div className="flex flex-col items-center mb-4" whileHover={{ scale: 1.05 }}>
            <label className="text-white mb-2">Cancel:</label>
            <button
              className="w-16 h-16 rounded-full border-2 shadow-lg bg-gray-600 hover:bg-gray-700 hover:shadow-purple-500 transition duration-300"
              onClick={onClose}
            >
              <span className="text-white font-bold">Cancel</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default FrameModal;
