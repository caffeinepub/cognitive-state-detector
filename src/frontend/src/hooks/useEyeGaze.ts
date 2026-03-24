import { useCallback, useEffect, useRef, useState } from "react";

export interface GazePoint {
  x: number;
  y: number;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: {
      fastMode?: boolean;
      maxDetectedFaces?: number;
    }) => {
      detect(
        source: HTMLVideoElement,
      ): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

export function useEyeGaze(enabled: boolean) {
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [faceDetectorSupported, setFaceDetectorSupported] = useState<
    boolean | null
  >(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const detectorRef = useRef<InstanceType<
    NonNullable<Window["FaceDetector"]>
  > | null>(null);
  const lastFaceHeightRef = useRef<number | null>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
    setGazePoint(null);
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled) return;

    // Check FaceDetector support
    const supported = "FaceDetector" in window;
    setFaceDetectorSupported(supported);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.style.position = "absolute";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      video.style.width = "1px";
      video.style.height = "1px";
      document.body.appendChild(video);
      videoRef.current = video;

      await video.play();
      setIsCameraReady(true);

      if (supported && window.FaceDetector) {
        detectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      }

      const detect = async () => {
        if (!videoRef.current || !streamRef.current) return;

        if (
          supported &&
          detectorRef.current &&
          videoRef.current.readyState >= 2
        ) {
          try {
            const faces = await detectorRef.current.detect(videoRef.current);
            if (faces.length > 0) {
              const face = faces[0].boundingBox;
              // Map face center to screen coordinates
              const vw = videoRef.current.videoWidth || 640;
              const vh = videoRef.current.videoHeight || 480;
              const faceCenterXRatio = (face.x + face.width / 2) / vw;
              const faceCenterYRatio = (face.y + face.height / 2) / vh;
              // Mirror horizontally (webcam is mirrored)
              const screenX = (1 - faceCenterXRatio) * window.innerWidth;
              const screenY = faceCenterYRatio * window.innerHeight;
              setGazePoint({ x: screenX, y: screenY });

              // Blink detection: if face height drops significantly, treat as nod/blink
              const currentHeight = face.height;
              if (lastFaceHeightRef.current !== null) {
                const ratio = currentHeight / lastFaceHeightRef.current;
                if (ratio < 0.75) {
                  setIsBlinking(true);
                  if (blinkTimerRef.current)
                    clearTimeout(blinkTimerRef.current);
                  blinkTimerRef.current = setTimeout(
                    () => setIsBlinking(false),
                    500,
                  );
                }
              }
              lastFaceHeightRef.current = currentHeight;
            }
          } catch {
            // detection error, skip frame
          }
        } else if (!supported) {
          // Fallback: use pointer position as gaze proxy
          // (pointer events tracked globally in GazeCursor component)
        }

        animFrameRef.current = requestAnimationFrame(() => {
          setTimeout(detect, 100); // ~10fps to reduce CPU
        });
      };

      detect();
    } catch {
      setIsCameraReady(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
    };
  }, [enabled, startCamera, stopCamera]);

  return {
    gazePoint,
    setGazePoint,
    isBlinking,
    isCameraReady,
    faceDetectorSupported,
    startCamera,
    stopCamera,
  };
}
