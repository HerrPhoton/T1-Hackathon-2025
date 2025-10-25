import * as ort from 'onnxruntime-web';
import { SegmentorBase } from './base';

const DEFAULT_MODEL_URL = '/models/yolo11n-seg.onnx';
const PERSON_CLASS_INDEX = 0;
const SCORE_THRESHOLD = 0.25;
const MASK_THRESHOLD = 0.5;

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

export class YOLOSegmentor extends SegmentorBase {

  constructor(modelUrl = DEFAULT_MODEL_URL) {
    super();
    this.modelUrl = modelUrl;
    this._preprocessCanvas = null;
  }

  async init() {
    await this.initSession(this.modelUrl);
  }

  _getOrCreatePreCanvas(w, h) {
    if (!this._preprocessCanvas)
      this._preprocessCanvas = document.createElement('canvas');

    if (this._preprocessCanvas.width !== w)
      this._preprocessCanvas.width = w;

    if (this._preprocessCanvas.height !== h)
      this._preprocessCanvas.height = h;

    return this._preprocessCanvas;
  }

  _letterbox(canvas, video, dstW, dstH) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dstW, dstH);

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const r = Math.min(dstW / vw, dstH / vh);
    const newW = Math.round(vw * r), newH = Math.round(vh * r);
    const padX = Math.floor((dstW - newW) / 2), padY = Math.floor((dstH - newH) / 2);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, dstW, dstH);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(video, 0, 0, vw, vh, padX, padY, newW, newH);

    return { padX, padY, newW, newH, vw, vh };
  }

  _toNchw(imageData, w, h) {
    const out = new Float32Array(1 * 3 * h * w);
    const stride = w * h;
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
        const t = y * w + x;
        out[0 * stride + t] = r;
        out[1 * stride + t] = g;
        out[2 * stride + t] = b;
      }
    }

    return out;
  }

  _decode(outputs) {
    let detName = null;
    let protoName = null;

    for (const name of Object.keys(outputs)) {
      const t = outputs[name];
      const dims = t.dims || [];

      if (dims.length === 3)
        detName = name;

      if (dims.length === 4)
        protoName = name;
    }

    if (!detName || !protoName)
      throw new Error('Unexpected outputs');

    const det = outputs[detName];
    const proto = outputs[protoName];

    const detDims = det.dims;
    let no = detDims[1];
    let N = detDims[2]
    let transposed = false;

    if (detDims[1] > detDims[2]) {
      N = detDims[1];
      no = detDims[2];
      transposed = true;
    }

    const C = proto.dims[1];
    const Mh = proto.dims[2];
    const Mw = proto.dims[3];
    const numClasses = no - 4 - C;

    if (numClasses <= 0)
      throw new Error('Invalid channels');

    const detData = det.data;
    const plane = new Float32Array(no);
    const coeffs = [];

    for (let i = 0; i < N; i++) {
      if (!transposed) {
        for (let c = 0; c < no; c++)
          plane[c] = detData[c * N + i];

      } else {
        const base = i * no;

        for (let c = 0; c < no; c++)
          plane[c] = detData[base + c];
      }
      let bestScore = -1;
      let bestClass = -1;

      for (let c = 0; c < numClasses; c++) {
        const s = plane[4 + c];

        if (s > bestScore) {
          bestScore = s;
          bestClass = c;
        }
      }

      if (bestClass !== PERSON_CLASS_INDEX || bestScore < SCORE_THRESHOLD) continue;

      const co = new Float32Array(C);

      for (let k = 0; k < C; k++)
        co[k] = plane[4 + numClasses + k];

      coeffs.push(co);
    }

    return { coeffs, proto: { C, Mh, Mw, data: proto.data } };
  }

  _buildMask(coeff, proto) {
    const { C, Mh, Mw, data } = proto;
    const plane = Mh * Mw;
    const out = new Float32Array(plane);

    for (let j = 0; j < C; j++) {
      const w = coeff[j];
      const base = j * plane;

      for (let p = 0; p < plane; p++)
        out[p] += w * data[base + p];
    }

    for (let i = 0; i < out.length; i++)
      out[i] = sigmoid(out[i]) >= MASK_THRESHOLD ? 255 : 0;

    const img = new ImageData(Mw, Mh);

    for (let i = 0; i < out.length; i++) {
      const o = i * 4;
      const a = out[i];

      img.data[o] = 255;
      img.data[o+1] = 255;
      img.data[o+2] = 255;
      img.data[o+3] = a;
    }

    return img;
  }

  async segment(videoElement) {

    if (!this.session)
      await this.init();

    const { width: inW, height: inH, name: inputName } = this.input;
    const pre = this._getOrCreatePreCanvas(inW, inH);
    const { padX, padY, newW, newH } = this._letterbox(pre, videoElement, inW, inH);
    const imageData = pre.getContext('2d').getImageData(0, 0, inW, inH);
    const tensor = new ort.Tensor('float32', this._toNchw(imageData, inW, inH), [1, 3, inH, inW]);
    const outputs = await this.session.run({ [inputName]: tensor });
    const { coeffs, proto } = this._decode(outputs);

    const vw = videoElement.videoWidth;
    const vh = videoElement.videoHeight;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = vw;
    maskCanvas.height = vh;

    const mctx = maskCanvas.getContext('2d');
    mctx.clearRect(0, 0, vw, vh);
    mctx.fillStyle = 'rgba(0,0,0,0)';
    mctx.fillRect(0, 0, vw, vh);
    mctx.imageSmoothingEnabled = true;

    for (const co of coeffs) {
      const img = this._buildMask(co, proto);

      const tmp = document.createElement('canvas');
      tmp.width = proto.Mw;
      tmp.height = proto.Mh;
      tmp.getContext('2d').putImageData(img, 0, 0);

      const tmp2 = document.createElement('canvas');
      tmp2.width = inW;
      tmp2.height = inH;

      const t2 = tmp2.getContext('2d');
      t2.imageSmoothingEnabled = true;
      t2.drawImage(tmp, 0, 0, proto.Mw, proto.Mh, 0, 0, inW, inH);
      mctx.drawImage(tmp2, padX, padY, newW, newH, 0, 0, vw, vh);
    }

    return maskCanvas;
  }
}

export default YOLOSegmentor;
