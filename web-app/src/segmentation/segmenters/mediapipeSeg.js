import * as ort from 'onnxruntime-web';
import { SegmentorBase } from './base';

const DEFAULT_MODEL_URL = '/models/selfie_segmenter.onnx';

export class MediaPipeSegmentor extends SegmentorBase {

  constructor(modelUrl = DEFAULT_MODEL_URL) {
    super();
    this.modelUrl = modelUrl;
    this._preprocessCanvas = null;
    this._maskCanvas = null;
    // MediaPipe модель ожидает входные данные 256x256 с именем 'image'
    this.input = { name: 'image', width: 256, height: 256 };
  }

  async init() {
    // Создаем сессию, но не перезаписываем размеры входных данных
    this.session = await this.createSession(this.modelUrl);
    // Размеры входных данных уже установлены в конструкторе (256x256)

    // Проверяем доступные входные имена
    console.log('Available input names:', this.session.inputNames);
    console.log('Input metadata:', this.session.inputMetadata);

    // Если доступны входные имена, используем первое доступное
    if (this.session.inputNames && this.session.inputNames.length > 0) {
      this.input.name = this.session.inputNames[0];
      console.log(`Using input name: '${this.input.name}'`);
    }
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

    // Очищаем canvas
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Получаем размеры видео
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    // Вычисляем соотношение сторон для сохранения пропорций
    const aspectRatio = videoWidth / videoHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (aspectRatio > targetAspectRatio) {
      // Видео шире, чем целевой размер
      drawWidth = targetWidth;
      drawHeight = targetWidth / aspectRatio;
      offsetX = 0;
      offsetY = (targetHeight - drawHeight) / 2;
    } else {
      // Видео выше, чем целевой размер
      drawHeight = targetHeight;
      drawWidth = targetHeight * aspectRatio;
      offsetX = (targetWidth - drawWidth) / 2;
      offsetY = 0;
    }

    // Рисуем видео с центрированием
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);

    return { offsetX, offsetY, drawWidth, drawHeight, videoWidth, videoHeight };
  }

  _imageDataToTensor(imageData, width, height) {
    const data = imageData.data;
    const tensor = new Float32Array(1 * 3 * height * width);

    // Конвертируем RGBA в RGB и нормализуем в диапазон [0, 1]
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const tensorIndex = y * width + x;

        // R, G, B каналы
        tensor[0 * height * width + tensorIndex] = data[pixelIndex] / 255.0;     // R
        tensor[1 * height * width + tensorIndex] = data[pixelIndex + 1] / 255.0; // G
        tensor[2 * height * width + tensorIndex] = data[pixelIndex + 2] / 255.0; // B
      }
    }

    return tensor;
  }

  _processSegmentationOutput(outputs, originalWidth, originalHeight, targetWidth, targetHeight) {
    // Получаем маску из выходных данных модели
    let maskData = null;
    let maskWidth = targetWidth;
    let maskHeight = targetHeight;

    console.log('MediaPipe outputs:', Object.keys(outputs));

    // Ищем выходной тензор с маской
    for (const [name, tensor] of Object.entries(outputs)) {
      const dims = tensor.dims || [];
      console.log(`Output ${name}:`, dims);

      if (dims.length >= 3) {
        // Предполагаем, что это маска сегментации
        maskData = tensor.data;
        if (dims.length === 4) {
          maskWidth = dims[3]; // [batch, channels, height, width]
          maskHeight = dims[2];
        } else if (dims.length === 3) {
          maskWidth = dims[2]; // [channels, height, width]
          maskHeight = dims[1];
        }
        console.log(`Using output ${name} with dimensions: ${maskWidth}x${maskHeight}`);
        break;
      }
    }

    if (!maskData) {
      throw new Error('Не удалось найти маску в выходных данных модели');
    }

    // Создаем canvas для маски
    const maskCanvas = this._getOrCreateMaskCanvas(originalWidth, originalHeight);
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.clearRect(0, 0, originalWidth, originalHeight);

    // Создаем временный canvas для маски из модели
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskWidth;
    tempCanvas.height = maskHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // Создаем ImageData для маски
    const maskImageData = tempCtx.createImageData(maskWidth, maskHeight);

    // Обрабатываем данные маски
    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const index = y * maskWidth + x;
        const pixelIndex = index * 4;

        // Получаем значение маски (предполагаем, что это вероятность)
        let maskValue = 0;
        if (Array.isArray(maskData)) {
          maskValue = maskData[index] || 0;
        } else {
          maskValue = maskData[index] || 0;
        }

        // Применяем пороговое значение (для MediaPipe обычно 0.5)
        const threshold = 0.5;
        const alpha = maskValue > threshold ? 255 : 0;

        // Устанавливаем белый цвет с альфой
        maskImageData.data[pixelIndex] = 255;     // R
        maskImageData.data[pixelIndex + 1] = 255; // G
        maskImageData.data[pixelIndex + 2] = 255; // B
        maskImageData.data[pixelIndex + 3] = alpha; // A
      }
    }

    console.log(`Processed mask: ${maskWidth}x${maskHeight}, data length: ${maskData.length}`);

    // Помещаем ImageData на временный canvas
    tempCtx.putImageData(maskImageData, 0, 0);

    // Масштабируем маску до исходного размера видео
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

    // Создаем ONNX тензор
    const inputTensor = new ort.Tensor('float32', tensor, [1, 3, targetHeight, targetWidth]);

    console.log(`Input tensor shape: [1, 3, ${targetHeight}, ${targetWidth}]`);

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
