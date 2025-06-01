'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ChatBot from '../components/ChatBot'
import { FiMessageCircle, FiX, FiLoader } from 'react-icons/fi'

type FaceApiModuleType = typeof import('face-api.js');

//const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const THIRTY_MINUTES_MS = 5 * 1000; // For testing 5 seconds

export default function LecturePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isAlertVisible, setIsAlertVisible] = useState(false)

  const [showHeartRateModal, setShowHeartRateModal] = useState(false);
  const [modalStep, setModalStep] = useState<'capturing' | 'analyzing_hr' | 'age_input' | 'recommendation' | 'error' | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<{ avg_heart_rate?: number; error?: string } | null>(null);
  const [userAgeInput, setUserAgeInput] = useState<string>('');
  const [submittedUserAge, setSubmittedUserAge] = useState<number | null>(null);

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

  const isHeartRateConcerning = useCallback((): boolean => {
    if (!analysisResult?.avg_heart_rate || submittedUserAge === null) return false;
    
    const hr = analysisResult.avg_heart_rate;
    const age = submittedUserAge;

    if (age >= 18) {
      // Adults: Resting heart rate typically 60-100.
      // Let's flag if significantly outside a wider range during a lecture setting.
      return hr < 45 || hr > 170; 
    } else { // < 18 (Children/Teens)
      // Children/teens have higher resting heart rates.
      // e.g. Teens (13-18 years): 50-90. Children (6-12 years): 70-110.
      // Let's use a broad range for "concerning" during a lecture.
      return hr < 50 || hr > 160;
    }
  }, [analysisResult, submittedUserAge]);


  const drawForeheadBox = useCallback(async () => {
    if (!faceApiModel || !videoPreviewRef.current || !canvasRef.current || !modelsLoaded ||
        !videoPreviewRef.current.srcObject || !isVideoStreamReady || videoPreviewRef.current.paused || videoPreviewRef.current.ended ||
        !showHeartRateModal || modalStep !== 'capturing') {

      if (!(showHeartRateModal && modalStep === 'capturing')) {
          if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
              animationFrameIdRef.current = null;
          }
      } // No 'else if' needed here, the outer condition handles starting/stopping primarily.
      return;
    }

    const video = videoPreviewRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox);
      return;
    }

    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    if (displaySize.width === 0 || displaySize.height === 0) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox);
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

    if (modalStep === 'capturing' && showHeartRateModal) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox);
    } else {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    }
  }, [faceApiModel, modelsLoaded, showHeartRateModal, modalStep, isVideoStreamReady]);


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
  }, []);


  useEffect(() => {
    if (modalStep === 'capturing' && showHeartRateModal && modelsLoaded && faceApiModel && isVideoStreamReady) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(drawForeheadBox);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (canvasRef.current && modalStep !== 'capturing') {
          const context = canvasRef.current.getContext('2d');
          context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [modalStep, showHeartRateModal, modelsLoaded, faceApiModel, drawForeheadBox, isVideoStreamReady]);


  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (videoId && topic && !isAlertVisible && !showHeartRateModal) {
      timerId = setTimeout(() => {
        setIsAlertVisible(true);
      }, THIRTY_MINUTES_MS);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isAlertVisible, videoId, topic, showHeartRateModal]);

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
    setIsVideoStreamReady(false);
  }, [currentStream]);


  const handleStartHeartRateCheck = async () => {
    setIsAlertVisible(false);
    setShowHeartRateModal(true);
    setAnalysisResult(null);
    setUserAgeInput('');
    setSubmittedUserAge(null);
    cleanupCaptureTimers();
    setIsVideoStreamReady(false); 

    if (!modelsLoaded || !faceApiModel) {
        setAnalysisResult({ error: "Face detection tools are not ready. Please wait or try refreshing." });
        setModalStep('error');
        return;
    }
    setModalStep('capturing');

    let localStream: MediaStream | null = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
      setCurrentStream(localStream);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = localStream;
        videoPreviewRef.current.onloadedmetadata = () => {
          videoPreviewRef.current?.play().then(() => {
            setIsVideoStreamReady(true);
          }).catch(playError => {
            console.error("Error playing video preview:", playError);
            setAnalysisResult({ error: "Could not play video preview." });
            setModalStep('error');
          });
        };
        videoPreviewRef.current.onerror = (e) => {
          console.error("Video element error (preview):", e);
          setAnalysisResult({ error: "Video preview element error." });
          setModalStep('error');
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
            setAnalysisResult({ error: "Failed to initialize graphics for analysis." });
            setModalStep('error');
            stopMediaStream();
            return;
          }
          canvasForBackend.width = 320;
          canvasForBackend.height = 240;
          const frames: string[] = [];
          const captureRate = 10; // FPS for backend analysis
          const duration = 10 * 1000; // 10 seconds capture

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
            setModalStep('analyzing_hr');

            try {
              if (frames.length < (captureRate * duration / 1000 / 2) ) { // e.g. less than 50 frames for 10s at 10fps
                setAnalysisResult({ error: `Not enough video frames captured (${frames.length}). Ensure camera is unobstructed.` });
                setModalStep('error');
                stopMediaStream(); // Stop stream as analysis won't proceed
                return;
              }
              const res = await fetch("/api/analyze-stress", { // This API return { avg_heart_rate: number }
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frames, fps: captureRate }), 
              });
              const data = await res.json();

              if (data.error || typeof data.avg_heart_rate !== 'number') {
                setAnalysisResult({ error: data.error || "Failed to get heart rate from analysis." });
                setModalStep('error');
              } else {
                setAnalysisResult({ avg_heart_rate: data.avg_heart_rate });
                setModalStep('age_input');
              }
            } catch (apiError) {
              console.error("API call to /api/analyze-stress failed:", apiError);
              setAnalysisResult({ error: "Failed to connect to the analysis service." });
              setModalStep('error');
            } finally {
                 // Stop media stream here if not already stopped,
                 // as capturing/preview is done after analysis attempt.
                 // Exception: if 'age_input' keep video for a moment? No, better to stop.
                 if (modalStep !== 'capturing') { // Ensure we don't stop if it's already moved to another step like error by other means
                    stopMediaStream();
                 }
            }
          }, duration);

        } catch (hiddenPlayError) {
          console.error("Error playing hidden processing video:", hiddenPlayError);
          setAnalysisResult({ error: "Failed to initialize video processing." });
          setModalStep('error');
          stopMediaStream();
          cleanupCaptureTimers();
        }
      };
      hiddenProcessingVideo.onerror = (e) => {
        console.error("Video element error (hidden processing):", e);
        setAnalysisResult({ error: "Video processing element failed." });
        setModalStep('error');
        stopMediaStream();
        cleanupCaptureTimers();
      };

    } catch (err: any) {
      console.error("Error in handleStartHeartRateCheck (getUserMedia or general setup):", err);
      let errorMessage = "Could not access camera or start analysis. Please check browser permissions.";
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found. Please ensure a camera is connected and enabled.";
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera access denied. Please allow camera access in your browser settings.";
      }
      setAnalysisResult({ error: errorMessage });
      setModalStep('error');
      stopMediaStream();
      cleanupCaptureTimers();
    }
  };

  const handleAgeSubmit = () => {
    const ageNum = parseInt(userAgeInput);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        setAnalysisResult(prev => ({ ...prev, error: "Please enter a valid age (1-120)." }));
        return;
    }
    setAnalysisResult(prev => ({...prev, error: undefined })); 
    setSubmittedUserAge(ageNum);
    setModalStep('recommendation');
  };
  
  const handleCloseHeartRateModal = () => {
    setShowHeartRateModal(false);
    setModalStep(null);
    stopMediaStream();
    cleanupCaptureTimers();
    setUserAgeInput('');
    setSubmittedUserAge(null);
    setAnalysisResult(null);
  };

  const handleExitLecture = () => {
    setIsAlertVisible(false);
    handleCloseHeartRateModal();
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
      {/* ... (no change to header, iframe, chat button, chat panel) ... */}
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
                onClick={handleStartHeartRateCheck}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base disabled:opacity-50"
                disabled={!modelsLoaded}
              >
                {modelsLoaded ? "Check Your Heart Rate" : "Loading Tools..."}
              </button>
              <button onClick={handleExitLecture} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base">Exit Lecture</button>
            </div>
            {!modelsLoaded && <p className="text-xs text-gray-500 mt-2">Heart rate check tools are loading, please wait.</p>}
          </div>
        </div>
      )}

      {showHeartRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[150] p-4" aria-modal="true" role="dialog">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl max-w-md w-full text-white space-y-4">
            <h2 className="text-xl font-semibold text-center text-purple-300">Heart Rate Check</h2>

            {(modalStep === 'capturing' || (modalStep === 'analyzing_hr' && videoPreviewRef.current?.srcObject)) && (
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
            
            {modalStep === 'capturing' && (
              <p className="text-center text-gray-300">Capturing video for 10 seconds. Please keep your forehead aligned.</p>
            )}
            
            {modalStep === 'analyzing_hr' && !videoPreviewRef.current?.srcObject && (
                 <div className="w-full h-48 sm:h-60 bg-gray-700 rounded-md flex items-center justify-center border border-gray-600">
                    {/* Placeholder if video already stopped */}
                </div>
            )}

            {modalStep === 'analyzing_hr' && (
              <div className="text-center py-4">
                <FiLoader className="animate-spin text-purple-400 mx-auto text-4xl sm:text-5xl mb-3" />
                <p className="text-gray-300">Analyzing your heart rate...</p>
              </div>
            )}

            {modalStep === 'age_input' && analysisResult?.avg_heart_rate && (
              <div className="space-y-3 text-center">
                <p className="text-lg">Estimated Heart Rate: <span className="font-bold text-purple-100">{analysisResult.avg_heart_rate.toFixed(1)} BPM</span></p>
                <div className="flex flex-col items-center space-y-2">
                  <label htmlFor="ageInput" className="text-sm text-gray-300">Please enter your age:</label>
                  <input
                    type="number"
                    id="ageInput"
                    value={userAgeInput}
                    onChange={(e) => setUserAgeInput(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-1/2 p-2.5 mx-auto"
                    placeholder="e.g., 25"
                  />
                   {analysisResult.error && <p className="text-xs text-red-400 mt-1">{analysisResult.error}</p>}
                  <button
                    onClick={handleAgeSubmit}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-500 transition-colors font-medium"
                  >
                    Submit Age
                  </button>
                </div>
              </div>
            )}

            {modalStep === 'recommendation' && analysisResult?.avg_heart_rate && submittedUserAge !== null && (
              <div className="space-y-3 text-center">
                <p>Heart Rate: <span className="font-bold text-purple-100">{analysisResult.avg_heart_rate.toFixed(1)} BPM</span> (Age: {submittedUserAge})</p>
                {isHeartRateConcerning() ? (
                    <p className="text-red-400 font-semibold pt-2">⚠️ Your heart rate is outside the typical range for your age during this activity. Consider taking a break.</p>
                ) : (
                    <p className="text-green-400 font-semibold pt-2">✅ Your heart rate appears normal for your age. Keep up the good work!</p>
                )}
              </div>
            )}
            
            {modalStep === 'error' && analysisResult?.error && (
              <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-30 rounded-md">
                <p className="font-semibold">Analysis Error</p>
                <p className="text-sm">{analysisResult.error}</p>
              </div>
            )}

            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-center sm:space-x-3 pt-2">
              {modalStep === 'recommendation' ? (
                isHeartRateConcerning() ? (
                  <button
                    onClick={handleExitLecture}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-500 transition-colors font-medium"
                  >
                    Exit Lecture
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCloseHeartRateModal}
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
              ) : modalStep === 'error' || modalStep === 'age_input' ? ( // Close button for error, age_input handled by its own submit
                 (modalStep === 'error' || (modalStep === 'age_input' && !analysisResult?.avg_heart_rate)) && // Show close if error or if age_input but no HR (edge case)
                 <button
                    onClick={handleCloseHeartRateModal}
                    className="w-full px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-500 transition-colors font-medium"
                  >
                    Close
                  </button>
              ) : ( // Capturing or Analyzing_hr steps
                 <button
                    onClick={handleCloseHeartRateModal}
                    className="w-full px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-4 focus:ring-gray-400 transition-colors font-medium"
                  >
                    Cancel Heart Rate Check
                  </button>
              )}
            </div>
            { modalStep === 'age_input' && (
                 <button
                    onClick={handleCloseHeartRateModal}
                    className="w-full mt-2 px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-4 focus:ring-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}