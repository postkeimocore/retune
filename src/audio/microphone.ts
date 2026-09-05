export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Microphone capture is not supported in this browser.', 'NotSupportedError');
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  });
}

export function stopMicrophoneStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
