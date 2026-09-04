import pptxgen from 'pptxgenjs';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

export function createPresentation(): pptxgen {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'HVAC AI Platform';
  pres.company = 'Building Energy System';
  pres.title = '公共建筑暖通空调能效分析与 AI 智能改造决策系统';
  return pres;
}

export async function captureSlideElement(el: HTMLElement): Promise<string> {
  try {
    // 优先使用 html-to-image，完美保真网页 CSS 渐变、Lucide SVG 图标与圆角
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      quality: 0.98,
      backgroundColor: '#edf6f1',
      cacheBust: true,
      skipFonts: true,
    });
    if (dataUrl && dataUrl.length > 2000 && !dataUrl.includes('data:,')) {
      return dataUrl;
    }
    throw new Error('toPng returned invalid data');
  } catch (err) {
    console.warn('html-to-image capture fallback to html2canvas:', err);
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#edf6f1',
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL('image/png', 0.98);
  }
}

export function addSlideImage(pres: pptxgen, dataUrl: string): void {
  const slide = pres.addSlide();
  slide.background = { color: 'F4F9F6' };
  slide.addImage({
    data: dataUrl,
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
  });
}
