import React, { useState } from 'react';
import { motion } from 'framer-motion';



function AudioToPythonConverter() {
    const [audioFile, setAudioFile] = useState(null);
    const [generatedScript, setGeneratedScript] = useState('');

    const handleFileChange = (e) => {
        setAudioFile(e.target.files[0]);
    };

    const handleConvert = () => {
        if (audioFile) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = event.target.result;

                try {
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    // Limit audio duration to 3 minutes
                    if (audioBuffer.duration > 180) {
                        alert('Please upload an audio clip that is 3 minutes or shorter.');
                        return;
                    }

                    const channelData = audioBuffer.getChannelData(0); // Get the left channel

                    // Downsample and normalize
                    const numColumns = 64;
                    const downsampleFactor = Math.ceil(channelData.length / numColumns);
                    const downsampled = channelData.filter((_, index) => index % downsampleFactor === 0);
                    const normalized = downsampled.map(
                        (sample) => ((sample + 1) / 2) * 31  // Adjust to 0-31 for a 32-pixel height matrix
                    );

                    // Generate the Python code
                    const pythonCode = generatePythonCode(normalized);
                    setGeneratedScript(pythonCode);
                } catch (error) {
                    console.error('Error decoding audio data', error);
                }
            };

            reader.readAsArrayBuffer(audioFile);
        }
    };

    const generatePythonCode = (normalizedWaveform) => {
        const header = `
from rgbmatrix import RGBMatrix, RGBMatrixOptions, graphics
import time

options = RGBMatrixOptions()
options.rows = 32
options.cols = 64
options.chain_length = 2
options.parallel = 1
options.hardware_mapping = 'regular'

matrix = RGBMatrix(options=options)
        `;

        const drawFunction = `
def draw_frame(matrix, normalized_waveform):
    canvas = matrix.CreateFrameCanvas()
    canvas.Clear()

    # Define a color gradient based on amplitude
    for x, height in enumerate(normalized_waveform):
        height = int(height)
        
        # Color scaling: blue for low amplitude, orange for mid, red for high
        if height < 10:
            color = graphics.Color(0, 255, 255)  # Cyan (low)
        elif height < 20:
            color = graphics.Color(255, 165, 0)  # Orange (medium)
        else:
            color = graphics.Color(255, 0, 0)    # Red (high)

        # Adjust the midpoint to center the waveform vertically
        midpoint = 16  # Middle of the 32-pixel height matrix

        # Center the waveform vertically and draw
        for y in range(height):
            canvas.SetPixel(x, midpoint - int(height / 2) + y, color.red, color.green, color.blue)

    matrix.SwapOnVSync(canvas)
        `;

        const mainLoop = `
while True:
    draw_frame(matrix, ${JSON.stringify(normalizedWaveform)})
    time.sleep(0.05)
        `;

        return `${header}\n${drawFunction}\n${mainLoop}`;
    };

    const downloadScript = () => {
        const blob = new Blob([generatedScript], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'led_matrix_animation.py';
        link.click();
    };

    return (
        <div className="flex flex-col items-center w-full  p-8 bg-gray-900 rounded-lg shadow-2xl border border-purple-500 mt-4">
            {/* Title and horizontal line */}
            <motion.h1
                className="text-3xl text-purple-300 font-bold mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                Audio Wave Generator
            </motion.h1>
            <motion.hr
                className="w-full h-0.5 bg-gray-600 mb-6"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1 }}
            />

            {/* File Upload */}
            <motion.div
                className="mb-4 w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
                <label
                    htmlFor="audio-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:border-purple-400 hover:bg-gray-700 transition-all shadow-lg hover:shadow-purple-500"
                >
                    <p className="text-white mb-2">Upload Audio File</p>
                    <input
                        id="audio-upload"
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </motion.div>

            {/* Convert Button */}
            <motion.button
                onClick={handleConvert}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded shadow-lg hover:shadow-blue-500 transition-all"
                whileHover={{ scale: 1.05 }}
            >
                Convert to Python Script
            </motion.button>

            {/* Display Generated Script */}
            {generatedScript && (
                <>
                    <motion.pre
                        className="w-full bg-gray-800 text-white mt-4 p-4 rounded-lg shadow-lg overflow-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {generatedScript}
                    </motion.pre>

                    {/* Download Button */}
                    <motion.button
                        onClick={downloadScript}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded shadow-lg hover:shadow-green-500 transition-all"
                        whileHover={{ scale: 1.05 }}
                    >
                        Download Python Script
                    </motion.button>
                </>
            )}
        </div>
    );
}

export default AudioToPythonConverter;
