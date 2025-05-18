'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ChatBot from '../components/ChatBot'
import { FiMessageCircle, FiX, FiLoader } from 'react-icons/fi'

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
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const videoId = searchParams.get('videoId')
  const topic = searchParams.get('topic')

  // Determine if stress is high based on metrics
  const isStressHigh = stressMetrics && !stressMetrics.error &&
    typeof stressMetrics.lf_hf_ratio === 'number' &&
    typeof stressMetrics.avg_heart_rate === 'number' &&
    (stressMetrics.lf_hf_ratio > 2 || stressMetrics.avg_heart_rate > 170 || stressMetrics.avg_heart_rate < 45);

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

  const stopMediaStream = () => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  const handleCheckStress = async () => {
    setIsAlertVisible(false);
    setShowStressCheckModal(true);
    setStressCheckStep('capturing');
    setStressMetrics(null);
    cleanupCaptureTimers(); 

    let localStream: MediaStream | null = null;

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCurrentStream(localStream); 

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = localStream;
        videoPreviewRef.current.onloadedmetadata = () => {
          videoPreviewRef.current?.play().catch(playError => {
            console.error("Error playing video preview:", playError);
            setStressMetrics({ error: "Could not play video preview." });
            setStressCheckStep('error');
          });
        };
        videoPreviewRef.current.onerror = (e) => {
          console.error("Video element error (preview):", e);
          setStressMetrics({ error: "Video preview element error." });
          setStressCheckStep('error');
        };
      }

      const hiddenProcessingVideo = document.createElement("video");
      hiddenProcessingVideo.srcObject = localStream;
      hiddenProcessingVideo.muted = true;
      hiddenProcessingVideo.playsInline = true;
      
      hiddenProcessingVideo.onloadedmetadata = async () => {
        try {
          await hiddenProcessingVideo.play();

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            setStressMetrics({ error: "Failed to initialize graphics for analysis." });
            setStressCheckStep('error');
            stopMediaStream();
            return;
          }
          canvas.width = 320;
          canvas.height = 240;
          const frames: string[] = [];
          const captureRate = 10; 
          const duration = 10 * 1000;

          captureIntervalRef.current = setInterval(() => {
            if (hiddenProcessingVideo.readyState >= hiddenProcessingVideo.HAVE_CURRENT_DATA && !hiddenProcessingVideo.paused) {
              context.drawImage(hiddenProcessingVideo, 0, 0, canvas.width, canvas.height);
              const frame = canvas.toDataURL("image/jpeg", 0.7);
              frames.push(frame);
            }
          }, 1000 / captureRate);

          captureTimeoutRef.current = setTimeout(async () => {
            cleanupCaptureTimers(); 
            hiddenProcessingVideo.pause();
            
            setStressCheckStep('analyzing');
            try {
              if (frames.length === 0) {
                setStressMetrics({ error: "No video frames were captured. Ensure camera is unobstructed and permissions are granted." });
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
      setStressCheckStep('error');
      stopMediaStream(); 
      cleanupCaptureTimers();
    }
  };

  const handleCloseStressCheckModal = () => {
    setShowStressCheckModal(false);
    setStressCheckStep(null);
    // Optionally clear stressMetrics if you always want to re-fetch
    // setStressMetrics(null); 
    
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
    // The main page div. When a modal is open, its backdrop should prevent interaction.
    // The z-index of modals (z-[100], z-[150]) ensures they are on top.
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

      {/* Chat Sidebar - z-40, lower than modals */}
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

      {/* Screen Time Alert Box - z-[100] */}
      {isAlertVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-sm sm:max-w-md text-center space-y-5 sm:space-y-6 mx-4">
            <div className="text-purple-500 text-5xl">⏰</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Time Check!</h2>
            <p className="text-gray-700 text-sm sm:text-base">You've been viewing for a while.</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-5 sm:mt-6">
              <button onClick={handleCheckStress} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base">Check Your Stress</button>
              <button onClick={handleExitLecture} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base">Exit Lecture</button>
            </div>
          </div>
        </div>
      )}

      {/* Stress Check Modal - z-[150], highest z-index */}
      {showStressCheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[150] p-4" aria-modal="true" role="dialog">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl max-w-md w-full text-white space-y-4">
            <h2 className="text-xl font-semibold text-center text-purple-300">Stress Check</h2>
            
            {stressCheckStep === 'capturing' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-purple-400 rounded-lg w-64 h-32 relative top-[-20%]">
                  <p className="text-center text-purple-400 mt-[-2rem]">
                    Please position your forehead within this box
                  </p>
                </div>
              </div>
            )}

            {(stressCheckStep === 'capturing' || stressCheckStep === 'analyzing') && (
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-48 sm:h-60 bg-gray-700 rounded-md object-cover border border-gray-600" 
              />
            )}

            {stressCheckStep === 'capturing' && (
              <p className="text-center text-gray-300">Capturing video for 10 seconds. Please look at the camera.</p>
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

            {/* Conditional Buttons based on stressCheckStep and isStressHigh */}
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
                    onClick={handleCloseStressCheckModal} // This will also stop camera and timers
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