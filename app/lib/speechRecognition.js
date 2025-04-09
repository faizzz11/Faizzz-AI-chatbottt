'use client';

export function useSpeechRecognition() {
  let recognition = null;
  
  // Check if browser supports speech recognition
  const isBrowserSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };
  
  // Initialize speech recognition
  const initRecognition = (onResultCallback, onEndCallback) => {
    if (!isBrowserSupported()) return null;
    
    // Initialize the SpeechRecognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure the recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Set up the result event handler
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      onResultCallback(finalTranscript, interimTranscript);
    };
    
    // Set up the end event handler
    recognition.onend = () => {
      if (onEndCallback) onEndCallback();
    };
    
    return recognition;
  };
  
  // Start recording
  const startRecording = (onResultCallback, onEndCallback) => {
    if (!recognition) {
      recognition = initRecognition(onResultCallback, onEndCallback);
    }
    
    if (recognition) {
      try {
        recognition.start();
        return true;
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        return false;
      }
    }
    
    return false;
  };
  
  // Stop recording
  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      return true;
    }
    return false;
  };
  
  return {
    isBrowserSupported,
    startRecording,
    stopRecording
  };
} 