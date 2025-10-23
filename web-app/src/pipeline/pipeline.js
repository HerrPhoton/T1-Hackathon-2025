export class FramePipeline {

  constructor({ segmenter, backgroundProcessor }) {
    this.segmenter = segmenter;
    this.backgroundProcessor = backgroundProcessor;
  }

  async init() {
    if (this.segmenter && this.segmenter.init)
      await this.segmenter.init();
  }

  async process(FrameCapture) {
    let videoElement = FrameCapture.source.videoElement || FrameCapture.source;

    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      throw new Error('Video element not ready');
    }

    const maskCanvas = await this.segmenter.segment(videoElement);

    const w = videoElement.videoWidth;
    const h = videoElement.videoHeight;

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = w;
    frameCanvas.height = h;

    const fctx = frameCanvas.getContext('2d');
    fctx.drawImage(videoElement, 0, 0, w, h);

    const out = this.backgroundProcessor.apply(frameCanvas, maskCanvas);

    return out;
  }
}

export default FramePipeline;
