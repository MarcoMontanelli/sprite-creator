import './codeArea.css'; // Make sure this import points to the correct file path
import React, { useCallback, useState, useRef } from 'react';

const highlightPythonSyntax = (code) => {
    // Define regex patterns for Python syntax with capturing groups
    const patterns = [
      { regex: /(\bdef\b)\s+(\w+)/g, type: 'function' },
      { regex: /(\bclass\b)\s+(\w+)/g, type: 'class' },
      { regex: /\b(import|from|return|if|else|elif|while|for|with|as|try|except|raise|in|is|and|or|not)\b/g, type: 'keyword' },
      { regex: /(".*?"|\'.*?\')/g, type: 'string' },
      { regex: /(#.*?$)/gm, type: 'comment' },
      { regex: /(\b[A-Za-z_][A-Za-z0-9_]*\b)(?=\s*=\s*)/g, type: 'variable' },
    ];

    // Split the code into parts and apply regex patterns
    let parts = [code];
    patterns.forEach(pattern => {
      let newParts = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          newParts.push(...part.split(pattern.regex).map((splitPart, index) => {
            // Apply the pattern to every other element (the matched parts)
            return index % 2 === 1 ? (<span className={`text-${pattern.type}`}>{splitPart}</span>) : splitPart;
          }));
        } else {
          // Already a JSX element, just keep it
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    // Return array of JSX elements
    return parts.flat();
};

const CodeArea = ({ header, code }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const buttonContainerRef = useRef(null); // Reference to the container of the copy button

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(code)
          .then(() => {
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 2000); // Hide tooltip after 2 seconds
          })
          .catch(() => {
            setShowModal(true); // Show modal on error
          });
    }, [code]);

    return (
        <>
            <div className="flex items-center justify-between px-2 py-2  bg-gray-900 rounded-t-lg shadow-xl shadow-purple-700/50 ">
                <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-400">{header}</span>
                <div ref={buttonContainerRef}  className="flex items-center space-x-2">
                    <button onClick={copyToClipboard} className="p-1 hover:bg-purple-900 relative">
                        <svg className="w-4 h-4 fill-current text-gray-400 " viewBox="0 0 448 512">
                        <path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"></path>
                        </svg>
                    </button>
                    {showTooltip && (
                        <div className="absolute left-0 -bottom-12 z-10 ml-2 p-2 text-xs text-white bg-gray-800 rounded">
                            Code copied!
                        </div>
                    )}
                </div>
            </div>
            <div className="pre-container mb-4">
                <pre className="code-area text-xs text-gray-300 font-mono  bg-black rounded-b-lg shadow-xl shadow-purple-700/50 overflow-x-auto">
                    {highlightPythonSyntax(code)}
                </pre>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 p-5 rounded-lg">
                        <h2 className="text-lg text-white">Error</h2>
                        <p className="text-gray-300">Failed to copy to clipboard.</p>
                        <button onClick={() => setShowModal(false)} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CodeArea;