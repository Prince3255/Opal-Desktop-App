import { hidePluginWindow } from "./utils";
import { v4 as uuid } from "uuid";
import io from 'socket.io-client'

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder;
let userId: string;

// const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
//   withCredentials: true,
//   path: '/socket.io',
// })

const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
  withCredentials: true,
  path: '/socket.io',
  transports: ['websocket', 'polling'], // Add polling as fallback
  // forceNew: true, // Force new connection
  // reconnection: true,
  // timeout: 20000
})

socket.on('connected', (arg) => {
  console.log(arg)
})

// Add error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

export const StartRecording = (onSource: {
  audio: string;
  id: string;
  screen: string;
}) => {
  if (!onSource || !onSource.id || !onSource.screen) {
    console.log("Invalid source provided for recording");
    return;
  }

  hidePluginWindow(true);

  videoTransferFileName = `${uuid()}-${onSource.id.slice(0, 8)}.webm`;

  if (mediaRecorder) {
    mediaRecorder.start(1000);
  } else {
    console.error("Media Recorder is not initialized");
  }
};

export const onStopRecoiding = () => {
  hidePluginWindow(false);

  if (mediaRecorder) {
    mediaRecorder.stop()
  }
  else {
    console.error("MediaRecorder is not active.")
  }
};

export const onDataAvailable = async (e: BlobEvent) => {
  if (e.data.size > 0 && videoTransferFileName) {
    try {
      socket.emit('video-chunks', ({
        chunks: e.data,
        filename: videoTransferFileName
      }))
    } catch (error) {
      console.log('Error in blob ', error)
    }
  }
  else {
    console.error('No data available or filename is missing')
  }
}

export const stopRecording = () => {
  hidePluginWindow(false)

  if (videoTransferFileName && userId) {
    socket.emit('process-video', {
      filename: videoTransferFileName,
      userId
    })
  }
  else {
    console.error('Missing file name or user id')
  }
}

export const selectSource = async (
  onSource: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement>
) => {
  if (!onSource || !onSource.screen || !onSource.audio || !onSource.id) {
    console.error("Invalid source provided");
    return;
  }

  const constraint: any = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: onSource.screen,
        minWidth: onSource.preset === "HD" ? 1920 : 1280,
        maxWidth: onSource.preset === "HD" ? 1920 : 1280,
        minHeight: onSource.preset === "HD" ? 1080 : 720,
        maxHeight: onSource.preset === "HD" ? 1080 : 720,
        frameRate: 30,
      },
    },
  };

  userId = onSource.id;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraint);

    const audioStrem = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: onSource.audio ? { deviceId: { exact: onSource.audio } } : false,
    });

    if (videoElement && videoElement.current) {
      videoElement.current.srcObject = stream;
      videoElement.current.muted = true;
      await videoElement.current.play();
    }

    const combineStream = new MediaStream([
      ...stream.getTracks(),
      ...audioStrem.getTracks(),
    ]);

    mediaRecorder = new MediaRecorder(combineStream, {
      mimeType: "video/webm; codecs=vp9",
    });

    mediaRecorder.ondataavailable = onDataAvailable
    mediaRecorder.onstop = stopRecording
  } catch (error) {
    console.error("Error selecting sources:", error);
  }
};
