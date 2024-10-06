import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

const ImageUpload = ({ onImageProcessed }) => {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle image upload
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    const validTypes = ['image/png', 'image/jpeg', 'image/bmp'];

    // Check if the file is a valid image type
    if (!validTypes.includes(uploadedFile.type)) {
      const error = 'Please upload a valid image file (PNG, JPG, BMP).';
      setErrorMessage(error);
      alert(error); // Show alert for invalid file type
      setFile(null);
      return;
    }

    // Load the image to check its dimensions
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
      img.onload = () => {
        if (img.width !== 128 || img.height !== 32) {
          const sizeError = 'Image must be exactly 128x32 pixels.';
          setErrorMessage(sizeError);
          alert(sizeError); // Show alert for incorrect dimensions
          setFile(null);
        } else {
          console.log('Image is valid. Preparing to convert...');
          setFile(uploadedFile);
          setErrorMessage('');
        }
      };
    };

    reader.readAsDataURL(uploadedFile);
  };

  // Process and convert the image to the canvas
  const handleConvert = () => {
    if (file) {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          console.log('Starting canvas conversion...');

          const canvas = document.createElement('canvas');
          // Set willReadFrequently to optimize getImageData operations
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = 128;
          canvas.height = 32;
          ctx.drawImage(img, 0, 0, 128, 32);

          const pixelData = [];
          for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 128; x++) {
              const { data } = ctx.getImageData(x, y, 1, 1);
              const color = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
              const brightness = data[3] / 255;
              pixelData.push({ color, brightness });
            }
          }

          console.log('Image conversion complete. Rendering on canvas...');
          // Pass the pixel data to the parent component (App.jsx)
          onImageProcessed(pixelData);
        };
      };

      reader.readAsDataURL(file);
    } else {
      alert('No valid file selected for conversion!');
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mt-2">
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <FontAwesomeIcon
            icon={faCloudArrowUp}
            className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
          />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, BMP (128x32 pixels)
          </p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {file && (
        <p className="text-green-500 text-sm mt-2">{file.name}</p>
      )}

      <div className="mt-4">
        {file && (
          <button
            onClick={handleConvert}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Convert to Canvas
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
      )}
    </div>
  );
};

export default ImageUpload;