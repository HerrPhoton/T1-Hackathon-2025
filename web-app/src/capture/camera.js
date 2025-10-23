class CameraController {

  constructor(videoElement, constraints = undefined) {
    this.videoElement = videoElement;
    this.stream = null;
    this.constraints = constraints || {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    };
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      this.stream = stream;
      this.videoElement.srcObject = stream;

      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve(stream);
        };
      });

    } catch (e) {
      console.error('Не удалось получить доступ к камере:', e.name, e.message);
      throw e;
    }
  }

  stop() {
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      this.videoElement.srcObject = null;
    }
    this.stream = null;
  }

  captureFrame(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    ctx.drawImage(this.videoElement, 0, 0);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}

export default CameraController;
