import { BackgroundEffect } from './base';

export class SolidColorBackground extends BackgroundEffect {

  constructor(color = '#1e1e1e') {
    super();
    this.color = color;
  }

  makeBackgroundTo(frameWidth, frameHeight) {
    const c = document.createElement('canvas');

    c.width = frameWidth;
    c.height = frameHeight;

    const ctx = c.getContext('2d');
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, frameWidth, frameHeight);

    return c;
  }
}

export default SolidColorBackground;
