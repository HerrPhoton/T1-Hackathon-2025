export class FrameCapture {

  constructor(source) {
    this.source = source;
    this._canvas = null;
  }

  _getCanvas(w, h) {
    if (!this._canvas)
      this._canvas = document.createElement('canvas');

    if (this._canvas.width !== w)
      this._canvas.width = w;

    if (this._canvas.height !== h)
      this._canvas.height = h;

    return this._canvas;
  }

  capture() {
    if (typeof this.source.captureFrame === 'function') {
      const v = this.source.videoElement || this.source;
      const w = v.videoWidth; const h = v.videoHeight;

      const canvas = this._getCanvas(w, h);
      const imageData = this.source.captureFrame(canvas);

      return { imageData, width: canvas.width, height: canvas.height };
    }

    const v = this.source;
    const w = v.videoWidth; const h = v.videoHeight;

    const canvas = this._getCanvas(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.drawImage(v, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);

    return { imageData, width: w, height: h };
  }
}

export default FrameCapture;
