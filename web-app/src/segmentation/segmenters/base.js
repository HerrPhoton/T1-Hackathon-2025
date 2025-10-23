import * as ort from 'onnxruntime-web';

export class SegmentorBase {

  constructor() {
    this.session = null;
    this.input = { name: 'input', width: 640, height: 640 };
    this.provider = 'auto';
  }

  async init() {
    throw new Error('Not implemented');
  }

  async segment(videoElement) {
    throw new Error('Not implemented');
  }

  configureEnv() {
    try {
      ort.env.wasm.simd = true;
      ort.env.wasm.numThreads = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1));

      if (ort.env.webgpu)
        ort.env.webgpu.softmaxAccuracyMode = 'high-precision';

    } catch (_) {}
  }

  async createSession(modelUrl) {
    this.configureEnv();
    const providers = (typeof navigator !== 'undefined' && 'gpu' in navigator) ? ['webgpu', 'wasm'] : ['wasm'];

    let lastErr = null;

    for (const p of providers) {
      try {
        const session = await ort.InferenceSession.create(modelUrl, { executionProviders: [p] });
        this.provider = p;

        return session;

      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Failed to create session');
  }

  resolveInputInfo(session) {
    let inputName = (session.inputNames && session.inputNames.length > 0) ? session.inputNames[0] : undefined;

    if (!inputName && session.inputMetadata) {
      const keys = Object.keys(session.inputMetadata);

      if (keys.length > 0)
        inputName = keys[0];
    }

    const meta = (session.inputMetadata && inputName) ? session.inputMetadata[inputName] : undefined;
    const dims = meta ? (meta.dimensions || meta.shape || meta.dim) : undefined;
    const w = dims && dims.length >= 2 ? dims[dims.length - 1] : 640;
    const h = dims && dims.length >= 2 ? dims[dims.length - 2] : 640;

    return { name: inputName || 'input', width: w, height: h };
  }

  async initSession(modelUrl) {
    this.session = await this.createSession(modelUrl);
    this.input = this.resolveInputInfo(this.session);
  }

  getProvider() {
    return this.provider;
  }
}

export default SegmentorBase;
