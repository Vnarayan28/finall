import logging
import numpy as np
from scipy.signal import find_peaks, detrend, butter, filtfilt
from scipy.fftpack import fft, fftfreq

logger = logging.getLogger(__name__)

class HeartMetricsCalculator:

    def __init__(self, fps=30, window_length_multiplier=2, step_size_multiplier=1):
        self.fps = fps
        if fps <= 0:
            logger.error(f"HeartMetricsCalculator: FPS ({fps}) must be positive. Defaulting to 30.")
            self.fps = 30 
        
        self.window_length = self.fps * window_length_multiplier
        self.step_size = self.fps * step_size_multiplier
        if self.window_length <=0 : self.window_length = self.fps * 2 
        if self.step_size <=0: self.step_size = self.fps 


    @staticmethod
    def bandpass_filter(data, lowcut, highcut, fs, order=5):
        if fs <= 0: 
            logger.error("Bandpass filter: fs must be positive.")
            return data
        nyquist = 0.5 * fs
        low = lowcut / nyquist
        high = highcut / nyquist
        if low >= high or low <= 0 or high >= 1: 
            logger.warning(f"Bandpass filter: Invalid cutoffs {lowcut, highcut} for fs {fs}. Low: {low}, High: {high}")
            return data 
        b, a = butter(order, [low, high], btype='band')
        return filtfilt(b, a, data)

    @staticmethod
    def calculate_heart_rate(peaks, fs):
        if len(peaks) < 2: return 0
        time_diff = np.diff(peaks) / fs
        if len(time_diff) == 0 or np.any(time_diff <= 0): return 0 
        heart_rates = 60 / time_diff
        return np.mean(heart_rates)

    @staticmethod
    def moving_average(data, window_size):
        if window_size <= 0 or window_size > len(data): return data 
        return np.convolve(data, np.ones(window_size)/window_size, mode='valid')

    @staticmethod
    def compute_IBI(peaks, fs):
        if len(peaks) < 2 or fs <= 0: return np.array([])
        return np.diff(peaks) / fs

    def estimate_heart_rate(self, roi_frames):
        heart_rates_list = [] 
        if len(roi_frames) <= 2: 
            logger.warning(f"HeartMetricsCalculator: Insufficient roi_frames ({len(roi_frames)}), need > 2.")
            return 0, 0, 0, 0, 0

        intensity_over_time = [np.mean(frame) for frame in roi_frames if frame.size > 0] # Ensure frames are not empty
        if len(intensity_over_time) <= 2: 
            logger.warning(f"HeartMetricsCalculator: Insufficient intensity_over_time ({len(intensity_over_time)}), need > 2 for detrend.")
            return 0,0,0,0,0

        detrended_intensity = detrend(intensity_over_time)
        
        filtered_signal = self.bandpass_filter(detrended_intensity, 0.5, 3, self.fps)

        ma_window_size = max(1, int(self.fps / 3.0))
        if len(filtered_signal) < ma_window_size: 
            logger.warning(f"HeartMetricsCalculator: Filtered signal length ({len(filtered_signal)}) is less than MA window size ({ma_window_size}). Using original filtered signal for smoothing.")
            smoothed_signal = filtered_signal
        else:
            smoothed_signal = self.moving_average(filtered_signal, ma_window_size)

        if len(smoothed_signal) < self.window_length:
            logger.warning(f"HeartMetricsCalculator: Smoothed signal length ({len(smoothed_signal)}) is less than window_length ({self.window_length}). HR might be 0.")

        for start in range(0, len(smoothed_signal) - self.window_length + 1, self.step_size):
            segment = smoothed_signal[start:start+self.window_length] 
            if len(segment) == 0: continue
            
            if np.max(segment) == np.min(segment) and np.max(segment) == 0 : continue 
            if np.max(segment) == np.min(segment) and np.max(segment) != 0 : 
                 peaks, _ = find_peaks(segment, distance=max(1, int(self.fps/3.0))) 
            else:
                 peaks, _ = find_peaks(segment, distance=max(1, int(self.fps/3.0)), height=np.max(segment)*0.6)


            if len(peaks) > 1:
                heart_rate = self.calculate_heart_rate(peaks, self.fps)
                if heart_rate > 0: 
                    heart_rates_list.append(heart_rate)

        avg_heart_rate = sum(heart_rates_list) / len(heart_rates_list) if heart_rates_list else 0
        
        all_peaks_height = np.max(filtered_signal) * 0.6 if np.max(filtered_signal) > 0 else 0
        all_peaks, _ = find_peaks(filtered_signal, distance=max(1, int(self.fps/3.0)), height=all_peaks_height)
        
        if len(all_peaks) < 2:
             logger.warning(f"HeartMetricsCalculator: Not enough peaks ({len(all_peaks)}) in full filtered_signal for IBI/HRV. HRV metrics will be 0.")
             return avg_heart_rate, 0, 0, 0, 0

        ibi = self.compute_IBI(all_peaks, self.fps)
        if len(ibi) == 0:
            logger.warning("HeartMetricsCalculator: IBI calculation resulted in an empty array. HRV metrics will be 0.")
            return avg_heart_rate, 0, 0, 0, 0

        sdnn = np.std(ibi) if len(ibi) > 0 else 0
        rmssd = np.sqrt(np.mean(np.square(np.diff(ibi)))) if len(ibi) > 1 else 0
        bsi = (1 / rmssd) if rmssd > 0 else 0 # BSI calculation

        # LF/HF Ratio
        if len(ibi) < 2: # Need at least 2 IBI values for FFT
            logger.warning(f"HeartMetricsCalculator: IBI length ({len(ibi)}) too short for FFT. LF/HF will be 0.")
            lf_hf_ratio = 0
        else:
            mean_ibi_val = np.mean(ibi)
            if mean_ibi_val <= 0: 
                logger.warning(f"HeartMetricsCalculator: Mean IBI is non-positive ({mean_ibi_val}). Cannot compute FFT. LF/HF will be 0.")
                lf_hf_ratio = 0
            else:
                N = len(ibi)
                frequencies = fftfreq(N, d=mean_ibi_val) 
                power_spectrum = np.abs(fft(ibi))**2

                lf_band = (0.04, 0.15)  # Hz
                hf_band = (0.15, 0.4)   # Hz

                lf_power = np.sum(power_spectrum[(frequencies >= lf_band[0]) & (frequencies < lf_band[1])])
                hf_power = np.sum(power_spectrum[(frequencies >= hf_band[0]) & (frequencies < hf_band[1])])
                
                lf_hf_ratio = (lf_power / hf_power) if hf_power > 0 else 0

        return avg_heart_rate, sdnn, rmssd, bsi, lf_hf_ratio
