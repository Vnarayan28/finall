'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ChatBot from '../components/ChatBot'
import { FiMessageCircle, FiX, FiLoader } from 'react-icons/fi'

type FaceApiModuleType = typeof import('face-api.js');

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
// const THIRTY_MINUTES_MS = 5 * 1000; // For testing 10 seconds

export default function LecturePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isAlertVisible, setIsAlertVisible] = useState(false)

  const [showStressCheckModal, setShowStressCheckModal] = useState(false);
  const [stressCheckStep, setStressCheckStep] = useState<'capturing' | 'analyzing' | 'results' | 'error' | null>(null);
  const [stressMetrics, setStressMetrics] = useState<{ avg_heart_rate?: number; lf_hf_ratio?: number; sdnn?: number; rmssd?: number; error?: string } | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceApiModel, setFaceApiModel] = useState<FaceApiModuleType | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isVideoStreamReady, setIsVideoStreamReady] = useState(false);


  const videoId = searchParams.get('videoId')
  const topic = searchParams.get('topic')

  const isStressHigh = stressMetrics && !stressMetrics.error &&
    typeof stressMetrics.lf_hf_ratio === 'number' &&
    typeof stressMetrics.avg_heart_rate === 'number' &&
    (stressMetrics.lf_hf_ratio > 2 || stressMetrics.avg_heart_rate > 170 || stressMetrics.avg_heart_rate < 45);

  const drawForeheadBox = useCallback(async () => {
    
    if (!faceApiModel || !videoPreviewRef.current || !canvasRef.current || !modelsLoaded ||
        !videoPreviewRef.current.srcObject || !isVideoStreamReady || videoPreviewRef.current.paused || videoPreviewRef.current.ended ||
        !showStressCheckModal || stressCheckStep !== 'capturing') {


      if (!(showStressCheckModal && stressCheckStep === 'capturing')) {
          if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
              animationFrameIdRef.current = null;
          }
      } else if (animationFrameIdRef.current){ // If capturing, but other things failed, keep trying
          // If already running, let it be, next call will be scheduled by itself or useEffect
      }
      return;
    }

    const video = videoPreviewRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) { // Should ideally not happen if canvasRef is valid
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox); // Try again
      return;
    }

    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    if (displaySize.width === 0 || displaySize.height === 0) { // Video not rendered/sized yet
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox); // Try again
        return;
    }

    if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        faceApiModel.matchDimensions(canvas, displaySize);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceApiModel.detectSingleFace(
        video,
        new faceApiModel.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
      ).withFaceLandmarks();

    if (detections && detections.landmarks) {
      const resizedDetections = faceApiModel.resizeResults(detections, displaySize);
      const landmarks = resizedDetections.landmarks;
      const faceBox = resizedDetections.detection.box;

      const leftEyebrowPts = landmarks.getLeftEyeBrow();
      const rightEyebrowPts = landmarks.getRightEyeBrow();

      if (leftEyebrowPts.length > 0 && rightEyebrowPts.length > 0) {
        const allEyebrowYs = [...leftEyebrowPts.map(p => p.y), ...rightEyebrowPts.map(p => p.y)];
        const eyebrowTopY = Math.min(...allEyebrowYs);

        const foreheadBottom = eyebrowTopY - (faceBox.height * 0.05);
        const foreheadTop = faceBox.y + (faceBox.height * 0.05);
        const foreheadHeight = foreheadBottom - foreheadTop;

        const foreheadWidthFactor = 0.65;
        const foreheadWidth = faceBox.width * foreheadWidthFactor;
        const foreheadX = faceBox.x + (faceBox.width - foreheadWidth) / 2;

        if (foreheadHeight > 10 && foreheadWidth > 10) {
            context.strokeStyle = 'rgba(192, 132, 252, 0.9)';
            context.lineWidth = 3;
            context.strokeRect(foreheadX, foreheadTop, foreheadWidth, foreheadHeight);
        }
      }
    }

    // Recursive call for the loop, managed by the master switch (useEffect)
    if (stressCheckStep === 'capturing' && showStressCheckModal) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); // Ensure only one loop
        animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox);
    } else {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    }
  }, [faceApiModel, modelsLoaded, showStressCheckModal, stressCheckStep, isVideoStreamReady]);


  // useEffect for loading face-api.js module and models
  useEffect(() => {
    const loadFaceApiAndModels = async () => {
      try {
        const importedFaceApi = await import('face-api.js');
        setFaceApiModel(importedFaceApi);

        const MODEL_URL = '/models';
        await Promise.all([
          importedFaceApi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          importedFaceApi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("FaceAPI module and models loaded successfully.");
      } catch (error) {
        console.error("Error loading FaceAPI module or models:", error);
      }
    };
    loadFaceApiAndModels();
  }, []); // Runs once on mount


  // useEffect to control the drawing loop based on state
  useEffect(() => {
    if (stressCheckStep === 'capturing' && showStressCheckModal && modelsLoaded && faceApiModel && isVideoStreamReady) {
      console.log("useEffect: Starting drawing loop.");
      if (animationFrameIdRef.current) { // Clear any existing loop before starting new
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox);
    } else {
      // console.log("useEffect: Stopping drawing loop.");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (canvasRef.current && stressCheckStep !== 'capturing') { // Clear canvas if not capturing
          const context = canvasRef.current.getContext('2d');
          context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    // Cleanup animation frame if the component unmounts or dependencies change causing effect to re-run
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [stressCheckStep, showStressCheckModal, modelsLoaded, faceApiModel, drawForeheadBox, isVideoStreamReady]);


  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (videoId && topic && !isAlertVisible && !showStressCheckModal) {
      timerId = setTimeout(() => {
        setIsAlertVisible(true);
      }, THIRTY_MINUTES_MS);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isAlertVisible, videoId, topic, showStressCheckModal]);

  const cleanupCaptureTimers = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
  };

  const stopMediaStream = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsVideoStreamReady(false); // Stream is no longer ready
    // The useEffect will handle stopping the drawing loop when isVideoStreamReady becomes false
    // or other conditions like showStressCheckModal or stressCheckStep change.
  }, [currentStream]);


  const handleCheckStress = async () => {
    setIsAlertVisible(false);
    setShowStressCheckModal(true);
    setStressMetrics(null);
    cleanupCaptureTimers();
    setIsVideoStreamReady(false); // Reset before starting

    if (!modelsLoaded || !faceApiModel) {
        setStressMetrics({ error: "Face detection tools are not ready. Please wait or try refreshing." });
        setStressCheckStep('error'); // This will trigger useEffect to stop/not start loop
        return;
    }
    // Set capturing step AFTER model check and before stream acquisition
    setStressCheckStep('capturing');


    let localStream: MediaStream | null = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
      setCurrentStream(localStream);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = localStream;
        videoPreviewRef.current.onloadedmetadata = () => {
          videoPreviewRef.current?.play().then(() => {
            setIsVideoStreamReady(true); // Stream is ready and playing, useEffect will pick this up
          }).catch(playError => {
            console.error("Error playing video preview:", playError);
            setStressMetrics({ error: "Could not play video preview." });
            setStressCheckStep('error');
          });
        };
        videoPreviewRef.current.onerror = (e) => {
          console.error("Video element error (preview):", e);
          setStressMetrics({ error: "Video preview element error." });
          setStressCheckStep('error');
          stopMediaStream();
        };
      }

      const hiddenProcessingVideo = document.createElement("video");
      hiddenProcessingVideo.srcObject = localStream;
      hiddenProcessingVideo.muted = true;
      hiddenProcessingVideo.playsInline = true;
      hiddenProcessingVideo.width = 320;
      hiddenProcessingVideo.height = 240;

      hiddenProcessingVideo.onloadedmetadata = async () => {
        try {
          await hiddenProcessingVideo.play();
          const canvasForBackend = document.createElement("canvas");
          const contextForBackend = canvasForBackend.getContext("2d");
          if (!contextForBackend) {
            setStressMetrics({ error: "Failed to initialize graphics for analysis." });
            setStressCheckStep('error');
            stopMediaStream();
            return;
          }
          canvasForBackend.width = 320;
          canvasForBackend.height = 240;
          const frames: string[] = [];
          const captureRate = 10;
          const duration = 10 * 1000;

          captureIntervalRef.current = setInterval(() => {
            if (hiddenProcessingVideo.readyState >= hiddenProcessingVideo.HAVE_CURRENT_DATA && !hiddenProcessingVideo.paused && hiddenProcessingVideo.videoWidth > 0) {
              contextForBackend.drawImage(hiddenProcessingVideo, 0, 0, canvasForBackend.width, canvasForBackend.height);
              const frame = canvasForBackend.toDataURL("image/jpeg", 0.7);
              frames.push(frame);
            }
          }, 1000 / captureRate);

          captureTimeoutRef.current = setTimeout(async () => {
            cleanupCaptureTimers();
            hiddenProcessingVideo.pause();
            // Changing step will make useEffect stop the drawing loop
            setStressCheckStep('analyzing');

            try {
              if (frames.length < (captureRate * duration / 1000 / 2) ) {
                setStressMetrics({ error: `Not enough video frames were captured (${frames.length}). Ensure camera is unobstructed and permissions are granted.` });
                setStressCheckStep('error');
                return;
              }
              const res = await fetch("/api/analyze-stress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frames }),
              });
              const data = await res.json();
              setStressMetrics(data);
              if (data.error) {
                setStressCheckStep('error');
              } else {
                setStressCheckStep('results');
              }
            } catch (apiError) {
              console.error("API call to /api/analyze-stress failed:", apiError);
              setStressMetrics({ error: "Failed to connect to the analysis service." });
              setStressCheckStep('error');
            }
          }, duration);

        } catch (hiddenPlayError) {
          console.error("Error playing hidden processing video:", hiddenPlayError);
          setStressMetrics({ error: "Failed to initialize video processing." });
          setStressCheckStep('error');
          stopMediaStream();
          cleanupCaptureTimers();
        }
      };
      hiddenProcessingVideo.onerror = (e) => {
        console.error("Video element error (hidden processing):", e);
        setStressMetrics({ error: "Video processing element failed." });
        setStressCheckStep('error');
        stopMediaStream();
        cleanupCaptureTimers();
      };

    } catch (err: any) {
      console.error("Error in handleCheckStress (getUserMedia or general setup):", err);
      let errorMessage = "Could not access camera or start analysis. Please check browser permissions.";
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found. Please ensure a camera is connected and enabled.";
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera access denied. Please allow camera access in your browser settings.";
      }
      setStressMetrics({ error: errorMessage });
      setStressCheckStep('error'); // This will stop drawing loop via useEffect
      stopMediaStream();
      cleanupCaptureTimers();
    }
  };

  const handleCloseStressCheckModal = () => {
    setShowStressCheckModal(false); // This will trigger useEffect to stop loop
    setStressCheckStep(null);      // This will also trigger useEffect to stop loop
    stopMediaStream();
    cleanupCaptureTimers();
  };

  const handleExitLecture = () => {
    setIsAlertVisible(false);
    handleCloseStressCheckModal();
    router.push('/');
  };

  if (!videoId || !topic) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800">Missing Parameters</h2>
          <p className="text-gray-600">Please ensure both videoId and topic are provided.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">{topic} Lecture</h1>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={`${topic} lecture`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
      </div>

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-xl hover:bg-purple-700 transition-all z-50 transform ${isChatOpen ? 'rotate-90' : 'rotate-0'}`}
        aria-label={isChatOpen ? "Close chat" : "Open chat"}
      >
        {isChatOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-800 shadow-2xl transition-all duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} z-40`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Lecture Assistant</h2>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"><FiX size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatBot videoId={videoId} topic={topic} />
          </div>
        </div>
      </div>

      {isAlertVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-sm sm:max-w-md text-center space-y-5 sm:space-y-6 mx-4">
            <div className="text-purple-500 text-5xl">⏰</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Time Check!</h2>
            <p className="text-gray-700 text-sm sm:text-base">You've been viewing for a while.</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-5 sm:mt-6">
              <button
                onClick={handleCheckStress}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base disabled:opacity-50"
                disabled={!modelsLoaded}
              >
                {modelsLoaded ? "Check Your Stress" : "Loading Tools..."}
              </button>
              <button onClick={handleExitLecture} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base">Exit Lecture</button>
            </div>
            {!modelsLoaded && <p className="text-xs text-gray-500 mt-2">Stress check tools are loading, please wait.</p>}
          </div>
        </div>
      )}

      {showStressCheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[150] p-4" aria-modal="true" role="dialog">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl max-w-md w-full text-white space-y-4">
            <h2 className="text-xl font-semibold text-center text-purple-300">Stress Check</h2>

            {(stressCheckStep === 'capturing' || (stressCheckStep === 'analyzing' && videoPreviewRef.current?.srcObject) ) && (
              <div className="relative w-full h-48 sm:h-60 bg-gray-700 rounded-md border border-gray-600">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
            )}

            {stressCheckStep === 'capturing' && (
              <p className="text-center text-gray-300">Capturing video for 10 seconds. Please keep your forehead aligned.</p>
            )}

            {stressCheckStep === 'analyzing' && !videoPreviewRef.current?.srcObject && ( // If video stream was stopped before analysis UI shows
                 <div className="w-full h-48 sm:h-60 bg-gray-700 rounded-md flex items-center justify-center border border-gray-600">
                    {/* Placeholder: Maybe show a static image or just the loader below */}
                </div>
            )}

            {stressCheckStep === 'analyzing' && (
              <div className="text-center py-4">
                <FiLoader className="animate-spin text-purple-400 mx-auto text-4xl sm:text-5xl mb-3" />
                <p className="text-gray-300">Analyzing your stress levels...</p>
              </div>
            )}

            {stressCheckStep === 'results' && stressMetrics && (
              <div className="space-y-3 text-center">
                <p className="text-lg font-semibold text-purple-300">Analysis Complete!</p>
                {typeof stressMetrics.avg_heart_rate === 'number' && (
                  <p>Average Heart Rate: <span className="font-bold text-purple-100">{stressMetrics.avg_heart_rate.toFixed(1)} BPM</span></p>
                )}
                {typeof stressMetrics.lf_hf_ratio === 'number' && (
                  <p>LF/HF Ratio: <span className="font-bold text-purple-100">{stressMetrics.lf_hf_ratio.toFixed(2)}</span></p>
                )}
                 {typeof stressMetrics.sdnn === 'number' && (
                  <p>SDNN: <span className="font-bold text-purple-100">{stressMetrics.sdnn.toFixed(2)} ms</span></p>
                )}
                 {typeof stressMetrics.rmssd === 'number' && (
                  <p>RMSSD: <span className="font-bold text-purple-100">{stressMetrics.rmssd.toFixed(2)} ms</span></p>
                )}
                {stressMetrics.error ? (
                    <p className="text-red-400 font-semibold pt-2">{stressMetrics.error}</p>
                ) : isStressHigh ? (
                    <p className="text-red-400 font-semibold pt-2">⚠️ High stress level detected. Consider taking a break.</p>
                ) : (
                    <p className="text-green-400 font-semibold pt-2">✅ Stress level appears normal. Keep up the good work!</p>
                )}
              </div>
            )}

            {stressCheckStep === 'error' && stressMetrics && (
              <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-30 rounded-md">
                <p className="font-semibold">Analysis Error</p>
                <p className="text-sm">{stressMetrics.error || "An unknown error occurred."}</p>
              </div>
            )}

            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-center sm:space-x-3 pt-2">
              {stressCheckStep === 'results' && !stressMetrics?.error ? (
                isStressHigh ? (
                  <button
                    onClick={handleExitLecture}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-500 transition-colors font-medium"
                  >
                    Exit Lecture
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCloseStressCheckModal}
                      className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-500 transition-colors font-medium"
                    >
                      Continue Learning
                    </button>
                    <button
                      onClick={handleExitLecture}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-500 transition-colors font-medium"
                    >
                      Exit Lecture
                    </button>
                  </>
                )
              ) : stressCheckStep === 'error' ? (
                 <button
                    onClick={handleCloseStressCheckModal}
                    className="w-full px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-500 transition-colors font-medium"
                  >
                    Close
                  </button>
              ) : ( // Capturing or Analyzing steps
                 <button
                    onClick={handleCloseStressCheckModal}
                    className="w-full px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-4 focus:ring-gray-400 transition-colors font-medium"
                  >
                    Cancel Stress Check
                  </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}