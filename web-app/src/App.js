import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { CameraController, FrameCapture } from './capture';
import { FramePipeline } from './pipeline';
import { YOLOSegSegmentor } from './segmentation';
import { SolidColorBackground, BackgroundProcessor, ImageBackground } from './background';


import officeBg1 from './assets/background/office_1.png';
import officeBg2 from './assets/background/office_2.png';
import officeBg3 from './assets/background/office_3.png';
import officeBg4 from './assets/background/office_4.png';
import spaceBg from './assets/background/space.jpg';
import beachBg from './assets/background/beach.jpg';
import forestBg from './assets/background/forest.jpg';
import cityBg from './assets/background/city.jpg';


const MODEL_URL = '/models/yolo11n-seg.onnx';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const pipelineRef = useRef(null);
  const frameCaptureRef = useRef(null);

  const loopRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [provider, setProvider] = useState('auto');
  const [running, setRunning] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1e1e1e');

  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  const colorPresets = [
    { name: 'Черный', value: '#170000' },
    { name: 'Темный', value: '#811e01' },
    { name: 'Красный', value: '#c13602' },
    { name: 'Синий', value: '#00ace7' },
    { name: 'Ночь', value: '#000117' },
    { name: 'Лайм', value: '#c2f221' },
    { name: 'Розовый', value: '#cf0060' },
    { name: 'Пурпурный', value: '#ff00ff' },
    { name: 'Глубокий', value: '#123C38' },
    { name: 'Зеленый', value: '#759242' },
    { name: 'Желтый', value: '#FCB31E' },
    { name: 'Белый', value: '#ffffff' }
  ];

  // Функция для вывода названия выбранного цвета
  const getColorName = (color) => {
    const preset = colorPresets.find(preset => preset.value === color);
    return preset ? preset.name : 'Свой цвет';
  };
  
  // Обновлениие фонового цвета
  async function updateBackgroundColor(newColor) {
    setBackgroundColor(newColor);

    if (pipelineRef.current && cameraRef.current) {
      try {
        const segmenter = new YOLOSegSegmentor(MODEL_URL);
        const bgEffect = new SolidColorBackground(newColor);
        const bgProcessor = new BackgroundProcessor(bgEffect);
        const pipeline = new FramePipeline({ segmenter, backgroundProcessor: bgProcessor });
        await pipeline.init();
        pipelineRef.current = pipeline;
      } catch (e) {
        console.error('Ошибка при обновлении цвета фона:', e);
      }
    }
  }

  // Встроенные фоны
  const [presetBackgrounds, setPresetBackgrounds] = useState([
      {
        id: 'office1',
        name: 'Офис_1',
        url: officeBg1,
        thumbnail: officeBg1
      },
      {
        id: 'office2',
        name: 'Офис_2',
        url: officeBg2,
        thumbnail: officeBg2
      },
      {
        id: 'office3',
        name: 'Офис_3',
        url: officeBg3,
        thumbnail: officeBg3
      },
      {
        id: 'office4',
        name: 'Офис_4',
        url: officeBg4,
        thumbnail: officeBg4
      },
      {
        id: 'city',
        name: 'Город',
        url: cityBg,
        thumbnail: cityBg
      },
      {
        id: 'space',
        name: 'Космос',
        url: spaceBg,
        thumbnail: spaceBg
      },
      {
        id: 'beach',
        name: 'Пляж',
        url: beachBg,
        thumbnail: beachBg
      },
      {
        id: 'forest',
        name: 'Лес',
        url: forestBg,
        thumbnail: forestBg
      }
    ]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  

  async function updateBackgroundImage(imageUrl) {
    try {
      // Создаем HTMLImageElement из URL
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
  
      // Обновляем состояние
      setSelectedPreset(imageUrl);
  
      if (pipelineRef.current) {
        try {
          const bgEffect = new ImageBackground(img);
          const bgProcessor = new BackgroundProcessor(bgEffect);
          
          // Обновляем только backgroundProcessor в существующем пайплайне
          pipelineRef.current.backgroundProcessor = bgProcessor;
          console.log('Фон успешно обновлен на изображение');
        } catch (e) {
          console.error('Ошибка при обновлении изображения фона:', e);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    }
  }
  // Переменнные для состояния настроеек фона
  const [backgroundMode, setBackgroundMode] = useState('color'); // 'color', 'image'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Функция для выбора встроенного фона
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    setUploadedImage({
      url: preset.url,
      name: preset.name,
      isPreset: true
    });
    setBackgroundMode('image');
  };

  // Функция для загрузки собственного изображения
  const handleCustomImageUpload = (file) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage({
      url: imageUrl,
      name: file.name,
      isPreset: false
    });
    setSelectedPreset(null); // Сбрасываем выбор пресета
    setBackgroundMode('image');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleCustomImageUpload(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleCustomImageUpload(file);
    }
  };

  // Функция для получения информации о текущем фоне
  const getCurrentBackgroundInfo = () => {
    if (backgroundMode === 'color') {
      return {
        type: 'color',
        name: getColorName(backgroundColor),
        value: backgroundColor
      };
    } else if (backgroundMode === 'image' && uploadedImage) {
      if (uploadedImage.isPreset) {
        const preset = presetBackgrounds.find(p => p.id === selectedPreset);
        return {
          type: 'preset',
          name: preset?.name || 'Встроенный фон',
          value: uploadedImage.url
        };
      } else {
        return {
          type: 'custom',
          name: uploadedImage.name,
          value: uploadedImage.url
        };
      }
    }
    return null;
  };
  // Обе функции отслеживают перетаскивание изображения в область загрузки
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  // Удалить выбранное изображение
  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.url);
      setUploadedImage(null);
      setBackgroundMode('color');
    }
  };

  // Кнопка применения настроек фона (моежт быть убрать потом ни наю)
  const applyBackground = () => {
    if (backgroundMode === 'color') {
      updateBackgroundColor(backgroundColor);
    } else if (backgroundMode === 'image' && uploadedImage) {

      console.log('Applying image background:', uploadedImage.url);
    }
  };

  async function start() {

    setStatus('init-camera');

    try {
      if (!videoRef.current) return;

      cameraRef.current = new CameraController(videoRef.current);
      await cameraRef.current.start();

      if (canvasRef.current && videoRef.current) {
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        canvasRef.current.width = Math.max(1, Math.floor(vw));
        canvasRef.current.height = Math.max(1, Math.floor(vh));
      }

    } catch (e) {
      console.error(e);
      setStatus('camera-error');
      return;
    }

    try {
      const segmenter = new YOLOSegSegmentor(MODEL_URL);
      const bgEffect = new SolidColorBackground(backgroundColor);
      const bgProcessor = new BackgroundProcessor(bgEffect);
      const pipeline = new FramePipeline({ segmenter, backgroundProcessor: bgProcessor });

      await pipeline.init();

      pipelineRef.current = pipeline;
      frameCaptureRef.current = new FrameCapture(cameraRef.current);

    } catch (e) {
      console.error(e);
      setStatus('model-error');
      return;
    }

    setRunning(true)

    setStatus('running');
    loop();
  }

  function stop() {
    setStatus('stopped');

    if (loopRef.current)
      cancelAnimationFrame(loopRef.current);

    loopRef.current = null;

    if (cameraRef.current)
      cameraRef.current.stop();

    pipelineRef.current = null;
    frameCaptureRef.current = null;

    setRunning(false)
  }

  async function loop() {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    const pipeline = pipelineRef.current;
    const frameCapture = frameCaptureRef.current;

    if (!pipeline || !videoEl || !canvasEl || !frameCapture) {
      loopRef.current = requestAnimationFrame(loop);
      return;
    }

    if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      loopRef.current = requestAnimationFrame(loop);
      return;
    }

    try {
      const outCanvas = await pipeline.process(frameCapture);

      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.drawImage(outCanvas, 0, 0, canvasEl.width, canvasEl.height);

      setStatus('running');

    } catch (e) {
      console.error(e);
      setStatus('infer-error');
    }

    loopRef.current = requestAnimationFrame(loop);
  }

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <div className="App">
      {/* Шапка */}
      <div className="header-gradient">
        <h1 className="header-title">Web Segmentation</h1>
      </div>
    
      <div className="background-video-layout">
    {/* Сайдбар с настройками фона */}
    <div className="background-settings-sidebar">
      <div className="settings-title">
        🎨 Настройки фона
      </div>
      
      {/* Выбор режима фона */}
      <div className="settings-group">
        <div className="settings-group-title">📋 Режим фона</div>
        <div className="background-mode-selector">
          <button
            className={`background-mode-btn ${backgroundMode === 'color' ? 'active' : ''}`}
            onClick={() => setBackgroundMode('color')}
          >
            🎨 Цвет
          </button>
          <button
            className={`background-mode-btn ${backgroundMode === 'image' ? 'active' : ''}`}
            onClick={() => setBackgroundMode('image')}
          >
            🖼️ Изображение
          </button>
        </div>
      </div>

      {/* Настройки цвета */}
      {backgroundMode === 'color' && (
        <div className="settings-group">
          <div className="settings-group-title">🌈 Выбор цвета</div>
          <div className="color-picker-container">
            <div className="color-dropdown">
              <button 
                className="color-dropdown-toggle"
                onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
              >
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: backgroundColor }}
                />
                <span>Выбрать цвет</span>
                <div className={`arrow ${isColorDropdownOpen ? 'open' : ''}`}>▼</div>
              </button>
              
              {isColorDropdownOpen && (
                <div className="color-dropdown-menu">
                  <div className="color-presets">
                    {colorPresets.map((color) => (
                      <button
                        key={color.value}
                        className={`color-preset ${backgroundColor === color.value ? 'active' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => updateBackgroundColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                  
                  <div className="custom-color-section">
                    <label className="custom-color-label">Свой цвет:</label>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => updateBackgroundColor(e.target.value)}
                      className="custom-color-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    {backgroundMode === 'image' && (
      <div className="settings-group">
        <div className="settings-group-title">🖼️ Выбор фона</div>
        
        {/* Встроенные фоны */}
        <div className="preset-backgrounds">
          <div className="preset-backgrounds-title">🎨 Встроенные фоны:</div>
          <div className="preset-backgrounds-grid">
            {presetBackgrounds.map((preset) => (
              <div
                key={preset.id}
                className={`preset-background ${selectedPreset === preset.id ? 'active' : ''}`}
                onClick={() => {
                  handlePresetSelect(preset);
                  updateBackgroundImage(preset.url); // Вызываем вашу функцию
                }}
              >
                <img 
                  src={preset.thumbnail} 
                  alt={preset.name}
                  className="preset-background-image"
                />
                <div className="preset-background-name">{preset.name}</div>
                {selectedPreset === preset.id && (
                  <div className="preset-indicator">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Или загрузите свой */}
        <div className="preset-backgrounds-title">📁 Или загрузите свой:</div>
        <div
          className={`image-upload-section ${isDragOver ? 'dragover' : ''} ${uploadedImage && !uploadedImage.isPreset ? 'has-image' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {(!uploadedImage || uploadedImage.isPreset) ? (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">Загрузите свой фон</div>
              <div className="upload-subtext">
                Перетащите или кликните для выбора
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageUpload(e);
                  // После загрузки изображения обновляем фон
                  if (e.target.files && e.target.files[0]) {
                    const imageUrl = URL.createObjectURL(e.target.files[0]);
                    updateBackgroundImage(imageUrl);
                  }}}
                className="upload-input"
              />
            </>
          ) : (
            <>
              <img 
                src={uploadedImage.url} 
                alt="Preview" 
                className="uploaded-image-preview"
              />
              <div className="upload-text">{uploadedImage.name}</div>
              <div className="upload-controls">
                <button 
                  className="upload-control-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  🗂️ Сменить
                </button>
                <button 
                  className="upload-control-btn remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUploadedImage();
                    updateBackgroundImage(null);
                  }}
                >
                  🗑️ Удалить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
      {/* Информация о текущем фоне */}
          <div className="current-background-info">
      <div className="current-background-title">Текущий фон:</div>
      <div className="current-background-preview">
        {(() => {
          const bgInfo = getCurrentBackgroundInfo();
          if (!bgInfo) return <div className="background-preview-text">Фон не выбран</div>;
          
          if (bgInfo.type === 'color') {
            return (
              <>
                <div 
                  className="background-preview-color" 
                  style={{ backgroundColor: bgInfo.value }}
                />
                <div className="background-preview-text">
                  🎨 {bgInfo.name}
                </div>
              </>
            );
          } else {
            return (
              <>
                <img 
                  src={bgInfo.value} 
                  alt="Current background" 
                  className="background-preview-image"
                />
                <div className="background-preview-text">
                  {bgInfo.type === 'preset' ? '🎨 ' : '📁 '}
                  {bgInfo.name}
                </div>
              </>
            );
          }
        })()}
      </div>
    </div>
      {/* Кнопка применения */}
      <button className="apply-background-btn" onClick={applyBackground}>
        ✅ Применить фон
      </button>
       {/* Кнопка запуска */}

        {!running ? (
          <button 
            className="glass-button start-button"
            onClick={start}
          >
            <span>🎬</span> Start Segmentation
          </button>
        ) : (
          <button 
            className="glass-button stop-button running-animation"
            onClick={stop}
          >
            <span>⏹️</span> Stop Segmentation
          </button>
        )}
        
        <span>Status: {status}</span>
        <span>Provider: {provider}</span>
    </div>

    {/* Основная область с видео */}
    <div className="video-main-container">
      <div className="video-wrapper">
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          className="video-element"
          style={{ display: 'none' }} 
        />
        <canvas 
          ref={canvasRef} 
          className="canvas-element"
        />
      </div>
      
      {/* Здесь можете добавить дополнительные элементы управления видео */}
      <div style={{ color: 'white', opacity: 0.8, fontSize: '0.9rem' }}>
        Разрешение: 640x480 • FPS: 30
      </div>
    </div>
  </div>
    </div>
  );
}

export default App;
