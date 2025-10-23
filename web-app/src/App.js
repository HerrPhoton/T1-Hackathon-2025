import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { CameraController, FrameCapture } from './capture';
import { FramePipeline } from './pipeline';
import { YOLOSegSegmentor } from './segmentation';
import { SolidColorBackground, BackgroundProcessor } from './background';

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
    <div className="App" style={{ padding: 16 }}>
      <h2>Web Segmentation</h2>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {!running ? (
          <button onClick={start}>Start</button>
        ) : (
          <button onClick={stop}>Stop</button>
        )}
        <span>Status: {status}</span>
        <span>Provider: {provider}</span>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Цвет фона:</span>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => updateBackgroundColor(e.target.value)}
            style={{ width: 50, height: 30, border: 'none', borderRadius: 4, cursor: 'pointer' }}
          />
        </label>
        <div style={{
          width: 30,
          height: 30,
          backgroundColor: backgroundColor,
          border: '1px solid #ccc',
          borderRadius: 4
        }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>Быстрый выбор:</span>
          {['#1e1e1e', '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
            <button
              key={color}
              onClick={() => updateBackgroundColor(color)}
              style={{
                width: 25,
                height: 25,
                backgroundColor: color,
                border: backgroundColor === color ? '2px solid #333' : '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 16 }}>
        <video ref={videoRef} playsInline muted style={{ width: 640, height: 480, display: 'none' }} />
        <canvas ref={canvasRef} style={{ width: 640, height: 480, background: '#000' }} />
      </div>
    </div>
  );
}

export default App;
