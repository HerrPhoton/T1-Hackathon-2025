export class BackgroundProcessor {

  constructor(effect) {
    this.effect = effect;
  }

  apply(frameCanvas, maskCanvas) {
    const w = frameCanvas.width;
    const h = frameCanvas.height;

    const out = document.createElement('canvas');

    out.width = w;
    out.height = h;

    const ctx = out.getContext('2d');

    ctx.drawImage(frameCanvas, 0, 0, w, h);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-over';

    const bg = this.effect.makeBackgroundTo(w, h);

    ctx.drawImage(bg, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    return out;
  }
}

export default BackgroundProcessor;
