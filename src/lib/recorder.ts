import { hidePluginWindow } from "./utils";
import { v4 as uuid } from "uuid";
import io from "socket.io-client";

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder | undefined;

const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
  withCredentials: true,
  path: "/socket.io",
  transports: ["websocket", "polling"],
  reconnection: true,
  timeout: 20000,
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connected", (message: string) => {
  console.log("Server:", message);
});

socket.on(
  "chunk-received",
  (data: { filename: string; bytes: number }) => {
    console.log("Chunk received:", data);
  }
);

socket.on(
  "processing-complete",
  (data: { filename: string; videoUrl: string }) => {
    console.log("Recorded video uploaded:", data);

    hidePluginWindow(false);

    // If needed, send this URL to your Electron UI.
  }
);

socket.on("upload-error", (data: { message: string }) => {
  console.error("Recorded video upload failed:", data.message);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

export const StartRecording = (onSource: {
  audio: string;
  id: string;
  screen: string;
}) => {
  if (!onSource || !onSource.id || !onSource.screen) {
    console.error("Invalid source provided for recording");
    return;
  }

  if (!mediaRecorder) {
    console.error("MediaRecorder is not initialized");
    return;
  }

  if (mediaRecorder.state !== "inactive") {
    console.error("MediaRecorder is already recording");
    return;
  }

  hidePluginWindow(true);

  videoTransferFileName = `${uuid()}-${onSource.id.slice(
    0,
    8
  )}.webm`;

  mediaRecorder.start(1000);

  console.log("Recording started:", videoTransferFileName);
};

export const onStopRecoiding = () => {
  hidePluginWindow(false);

  if (!mediaRecorder) {
    console.error("MediaRecorder is not initialized");
    return;
  }

  if (mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  } else {
    console.error("MediaRecorder is not recording");
  }
};

export const onDataAvailable = async (e: BlobEvent) => {
  if (!e.data.size || !videoTransferFileName) {
    return;
  }

  try {
    if (!socket.connected) {
      console.error("Socket is not connected");
      return;
    }

    const arrayBuffer = await e.data.arrayBuffer();

    socket.emit("video-chunks", {
      chunks: arrayBuffer,
      filename: videoTransferFileName,
    });
  } catch (error) {
    console.error("Error sending video chunk:", error);
  }
};

export const stopRecording = () => {
  hidePluginWindow(false);

  if (!videoTransferFileName) {
    console.error("Missing recording filename");
    return;
  }

  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }

  socket.emit("finish-video", {
    filename: videoTransferFileName,
  });

  console.log("Sent finish-video:", videoTransferFileName);
};

export const selectSource = async (
  onSource: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement>
) => {
  if (
    !onSource ||
    !onSource.screen ||
    !onSource.audio ||
    !onSource.id
  ) {
    console.error("Invalid source provided");
    return;
  }

  const constraints: any = {
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

  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      constraints
    );

    const audioStream =
      await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: onSource.audio
          ? {
              deviceId: {
                exact: onSource.audio,
              },
            }
          : false,
      });

    if (videoElement?.current) {
      videoElement.current.srcObject = stream;
      videoElement.current.muted = true;
      await videoElement.current.play();
    }

    const combinedStream = new MediaStream([
      ...stream.getTracks(),
      ...audioStream.getTracks(),
    ]);

    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm;codecs=vp9",
    });

    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = stopRecording;
  } catch (error) {
    console.error("Error selecting sources:", error);
  }
};