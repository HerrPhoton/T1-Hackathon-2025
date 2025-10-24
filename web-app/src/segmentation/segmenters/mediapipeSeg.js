import * as ort from 'onnxruntime-web';
import { SegmentorBase } from './base';

const DEFAULT_MODEL_URL = '/models/selfie_segmenter.onnx';

export class MediaPipeSegmentor extends SegmentorBase {

  constructor(modelUrl = DEFAULT_MODEL_URL) {
    super();
    this.modelUrl = modelUrl;
    this._preprocessCanvas = null;
    this._maskCanvas = null;
    this.input = { name: 'image', width: 256, height: 256 };
  }

  async init() {
    this.session = await this.createSession(this.modelUrl);

    if (this.session.inputNames && this.session.inputNames.length > 0)
      this.input.name = this.session.inputNames[0];
  }

  _getOrCreatePreCanvas(w, h) {
    if (!this._preprocessCanvas) {
      this._preprocessCanvas = document.createElement('canvas');
    }

    if (this._preprocessCanvas.width !== w) {
      this._preprocessCanvas.width = w;
    }

    if (this._preprocessCanvas.height !== h) {
      this._preprocessCanvas.height = h;
    }

    return this._preprocessCanvas;
  }

  _getOrCreateMaskCanvas(w, h) {
    if (!this._maskCanvas) {
      this._maskCanvas = document.createElement('canvas');
    }

    if (this._maskCanvas.width !== w) {
      this._maskCanvas.width = w;
    }

    if (this._maskCanvas.height !== h) {
      this._maskCanvas.height = h;
    }

    return this._maskCanvas;
  }

  _resizeAndNormalize(videoElement, targetWidth, targetHeight) {
    const canvas = this._getOrCreatePreCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, targetWidth, targetHeight);

    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    const aspectRatio = videoWidth / videoHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (aspectRatio > targetAspectRatio) {
      drawWidth = targetWidth;
      drawHeight = targetWidth / aspectRatio;
      offsetX = 0;
      offsetY = (targetHeight - drawHeight) / 2;
    } else {
      drawHeight = targetHeight;
      drawWidth = targetHeight * aspectRatio;
      offsetX = (targetWidth - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);

    return { offsetX, offsetY, drawWidth, drawHeight, videoWidth, videoHeight };
  }

  _imageDataToTensor(imageData, width, height) {
    const data = imageData.data;
    const tensor = new Float32Array(1 * height * width * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const tensorIndex = (y * width + x) * 3;

        tensor[tensorIndex] = data[pixelIndex] / 255.0;         // R
        tensor[tensorIndex + 1] = data[pixelIndex + 1] / 255.0;   // G
        tensor[tensorIndex + 2] = data[pixelIndex + 2] / 255.0;   // B
      }
    }

    return tensor;
  }

  _processSegmentationOutput(outputs, originalWidth, originalHeight, targetWidth, targetHeight) {
    let maskData = null;
    let maskWidth = targetWidth;
    let maskHeight = targetHeight;

    for (const [name, tensor] of Object.entries(outputs)) {
      const dims = tensor.dims || [];

      if (dims.length >= 3) {
        maskData = tensor.data;
        if (dims.length === 4) {
          maskWidth = dims[3];
          maskHeight = dims[2];
        } else if (dims.length === 3) {
          maskWidth = dims[2];
          maskHeight = dims[1];
        }
        break;
      }
    }

    if (!maskData) {
      throw new Error('Не удалось найти маску в выходных данных модели');
    }

    const maskCanvas = this._getOrCreateMaskCanvas(originalWidth, originalHeight);
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.clearRect(0, 0, originalWidth, originalHeight);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskWidth;
    tempCanvas.height = maskHeight;
    const tempCtx = tempCanvas.getContext('2d');

    const maskImageData = tempCtx.createImageData(maskWidth, maskHeight);

    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const index = y * maskWidth + x;
        const pixelIndex = index * 4;

        let maskValue = 0;
        if (Array.isArray(maskData)) {
          maskValue = maskData[index] || 0;
        } else {
          maskValue = maskData[index] || 0;
        }

        const threshold = 0.5;
        const alpha = maskValue > threshold ? 255 : 0;

        maskImageData.data[pixelIndex] = 255;     // R
        maskImageData.data[pixelIndex + 1] = 255; // G
        maskImageData.data[pixelIndex + 2] = 255; // B
        maskImageData.data[pixelIndex + 3] = alpha; // A
      }
    }

    tempCtx.putImageData(maskImageData, 0, 0);

    maskCtx.imageSmoothingEnabled = true;
    maskCtx.drawImage(tempCanvas, 0, 0, maskWidth, maskHeight, 0, 0, originalWidth, originalHeight);

    return maskCanvas;
  }

  async segment(videoElement) {
    if (!this.session) {
      await this.init();
    }

    const { width: targetWidth, height: targetHeight, name: inputName } = this.input;

    console.log(`MediaPipe segment: input size ${targetWidth}x${targetHeight}, input name: ${inputName}`);

    // Подготавливаем входные данные
    const { offsetX, offsetY, drawWidth, drawHeight, videoWidth, videoHeight } =
      this._resizeAndNormalize(videoElement, targetWidth, targetHeight);

    // Получаем ImageData
    const canvas = this._getOrCreatePreCanvas(targetWidth, targetHeight);
    const imageData = canvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);

    // Конвертируем в тензор
    const tensor = this._imageDataToTensor(imageData, targetWidth, targetHeight);

    // Создаем ONNX тензор в формате [batch, height, width, channels]
    const inputTensor = new ort.Tensor('float32', tensor, [1, targetHeight, targetWidth, 3]);

    console.log(`Input tensor shape: [1, ${targetHeight}, ${targetWidth}, 3]`);

    try {
      // Запускаем инференс
      console.log(`Running inference with input name: '${inputName}'`);
      const outputs = await this.session.run({ [inputName]: inputTensor });

      // Обрабатываем результат
      const maskCanvas = this._processSegmentationOutput(
        outputs,
        videoWidth,
        videoHeight,
        targetWidth,
        targetHeight
      );

      return maskCanvas;

    } catch (error) {
      console.error('Ошибка при сегментации MediaPipe:', error);

      // Возвращаем пустую маску в случае ошибки
      const emptyCanvas = this._getOrCreateMaskCanvas(videoWidth, videoHeight);
      const ctx = emptyCanvas.getContext('2d');
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, videoWidth, videoHeight);

      return emptyCanvas;
    }
  }
}

export default MediaPipeSegmentor;
