// == Plugin: Tunnel Generator for Figma ==
// Version: 0.1k28 — Полная версия с выбором палитр и стилем градиентов for Figma ==
// Version: 0.1k28 — Полная версия с выбором палитр и стилем градиентов

// HTML/CSS UI шаблон
const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Tunnel Generator</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: Inter, sans-serif; background: #1e1e1e; color: #f5f5f5; }
    form { display: flex; flex-direction: column; gap: 12px; }
    fieldset { border: 1px solid #444; border-radius: 4px; padding: 8px; }
    legend { font-size: 12px; margin-bottom: 4px; }
    .group { display: flex; flex-wrap: wrap; gap: 8px; }
    label { display: flex; align-items: center; font-size: 13px; }
    input[type="radio"] { margin-right: 6px; }
    .swatch { width: 16px; height: 16px; border: 1px solid #888; margin-right: 6px; }
    button { margin-top: 8px; padding: 8px 12px; font-size: 14px; background: #007aff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #005fcc; }
  </style>
</head>
<body>
  <form id="form">
    <label>Ширина макета: <input id="width" type="number" value="1920" /></label>
    <label>Высота макета: <input id="height" type="number" value="1080" /></label>
    <label>Ширина окна: <input id="innerWidth" type="number" value="300" /></label>
    <label>Высота окна: <input id="innerHeight" type="number" value="500" /></label>
    <fieldset>
      <legend>Лучей стен</legend>
      <div class="group">
        <label><input type="radio" name="wallRays" value="1" checked />1</label>
        <label><input type="radio" name="wallRays" value="2" />2</label>
        <label><input type="radio" name="wallRays" value="3" />3</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Лучей пола/потолка</legend>
      <div class="group">
        <label><input type="radio" name="floorRays" value="1" checked />1</label>
        <label><input type="radio" name="floorRays" value="2" />2</label>
        <label><input type="radio" name="floorRays" value="3" />3</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Стиль стопов</legend>
      <div class="group">
        <label><input type="radio" name="style" value="glow" checked />Светящийся</label>
        <label><input type="radio" name="style" value="focus" />Фокусный</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Палитра</legend>
      <div class="group">
        <label><input type="radio" name="palette" value="0" checked /><span class="swatch" style="background:#FF5D5D"></span></label>
        <label><input type="radio" name="palette" value="1" /><span class="swatch" style="background:#B08B8B"></span></label>
        <label><input type="radio" name="palette" value="2" /><span class="swatch" style="background:#027D88"></span></label>
        <label><input type="radio" name="palette" value="3" /><span class="swatch" style="background:#447AE5"></span></label>
        <label><input type="radio" name="palette" value="4" /><span class="swatch" style="background:#5F55ED"></span></label>
        <label><input type="radio" name="palette" value="5" /><span class="swatch" style="background:#FF3554"></span></label>
        <label><input type="radio" name="palette" value="6" /><span class="swatch" style="background:#F14699"></span></label>
        <label><input type="radio" name="palette" value="7" /><span class="swatch" style="background:#C40744"></span></label>
        <label><input type="radio" name="palette" value="8" /><span class="swatch" style="background:#484879"></span></label>
      </div>
    </fieldset>
    <button type="submit">Сгенерировать</button>
  </form>
  <script>
    document.getElementById('form').addEventListener('submit', e => {
      e.preventDefault();
      const msg = {
        width: +document.getElementById('width').value,
        height: +document.getElementById('height').value,
        innerWidth: +document.getElementById('innerWidth').value,
        innerHeight:+document.getElementById('innerHeight').value,
        wallRays:  parseInt(document.querySelector('input[name="wallRays"]:checked').value, 10),
        floorRays: parseInt(document.querySelector('input[name="floorRays"]:checked').value,10),
        style:     document.querySelector('input[name="style"]:checked').value,
        palette:   parseInt(document.querySelector('input[name="palette"]:checked').value,10)
      };
      parent.postMessage({ pluginMessage: msg }, '*');
    });
  </script>
</body>
</html>`;
// Показываем UI
figma.showUI(html, { width: 360, height: 520 });

// Помощники
function hexToRgb(hex: string) {
  const v = parseInt(hex.replace('#',''), 16);
  return { r: (v>>16&255)/255, g: (v>>8&255)/255, b: (v&255)/255 };
}
function hexToRgba(hex: string) { return { ...hexToRgb(hex), a: 1 }; }
function computeGradientTransform(from: Vector, to: Vector, bounds: Rect): Transform {
  const x1 = (from.x - bounds.x) / bounds.width;
  const y1 = (from.y - bounds.y) / bounds.height;
  const x2 = (to.x   - bounds.x) / bounds.width;
  const y2 = (to.y   - bounds.y) / bounds.height;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return [[1,0,0],[0,1,0]];
  const ux = dx/len, uy = dy/len;
  return [[ux, uy, x1],[-uy, ux, y1]];
}

// Основная логика плагина
figma.ui.onmessage = (msg: any) => {
  const { width, height, innerWidth: iw, innerHeight: ih, wallRays, floorRays, style, palette } = msg;
  // Создаём фрейм
  const canvas = figma.createFrame();
  canvas.resize(width, height);
  canvas.name = 'Tunnel';
  canvas.fills = [];

  const cx = width/2, cy = height/2;
  const topLeft    = { x: cx - iw/2, y: cy - ih/2 };
  const topRight   = { x: cx + iw/2, y: cy - ih/2 };
  const bottomLeft = { x: cx - iw/2, y: cy + ih/2 };

  // Палитры: каждая строка три цвета [top, mid, bottom]
  const paletteColors = [
    ['#FF5D5D','#FFB56F','#FFDAEA'],
    ['#B08B8B','#FFD675','#FFEFE3'],
    ['#027D88','#75F1DA','#FFEFE3'],
    ['#447AE5','#86E1FF','#FFEFE3'],
    ['#5F55ED','#B083B2','#FFEFE3'],
    ['#FF3554','#FF8676','#FFDAEA'],
    ['#F14699','#FD9BFB','#FFDAEA'],
    ['#C40744','#FF6CA5','#FFDAEA'],
    ['#484879','#B083B2','#FFDAEA'],
  ];
  const [c1, c2, c3] = paletteColors[palette];

  // Стопы градиентов для двух стилей
  const glow1  = [{ pos: 0,   color: hexToRgba(c1) },{ pos: 0.4, color: hexToRgba(c2) },{ pos: 1, color: hexToRgba(c3) }];
  const glow2  = [{ pos: 0,   color: hexToRgba(c1) },{ pos: 0.5, color: hexToRgba(c2) },{ pos: 0.9, color: hexToRgba(c3) }];
  const glow3  = glow1;
  const focus1 = [{ pos: 0,   color: hexToRgba(c1) },{ pos: 0.8, color: hexToRgba(c2) },{ pos: 1, color: hexToRgba(c3) }];
  const focus2 = [{ pos: 0,   color: hexToRgba(c1) },{ pos: 0.7, color: hexToRgba(c2) },{ pos: 1, color: hexToRgba(c3) }];
  const focus3 = focus1;

  // Массив для всех лучей и центра
  const rays: SceneNode[] = [];

  // Функция рисования одной трапеции с градиентом
  function createRay(
    pA: Vector, pB: Vector, pC: Vector, pD: Vector,
    from: Vector, to: Vector,
    idx: number, count: number
  ): void {
    // Выбор набора стопов по стилю и позиции
    const stops = style === 'focus'
      ? (count === 1 ? focus1 : count === 2 ? (idx === 0 ? focus1 : focus2) : (idx === 1 ? focus2 : focus1))
      : (count === 1 ? glow1  : count === 2 ? (idx === 0 ? glow1  : glow2)  : (idx === 1 ? glow2  : glow1));

    // Вычисляем bounds трапеции
    const xs = [pA.x, pB.x, pC.x, pD.x];
    const ys = [pA.y, pB.y, pC.y, pD.y];
    const bounds: Rect = {
      x: Math.min(...xs), y: Math.min(...ys),
      width:  Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };

    // Создаём векторный шейп
    const v = figma.createVector();
    v.vectorPaths = [{
      windingRule: 'NONZERO',
      data: `M ${pA.x} ${pA.y} L ${pB.x} ${pB.y} L ${pC.x} ${pC.y} L ${pD.x} ${pD.y} Z`
    }];
    v.strokes = [];
    v.fills = [{
      type: 'GRADIENT_LINEAR',
      gradientStops: stops.map(s => ({ position: s.pos, color: s.color })),
      gradientTransform: computeGradientTransform(from, to, bounds)
    }];
    rays.push(v);
  }

  // Рисуем стены
  for (let i = 0; i < wallRays; i++) {
    const yO1 = (i * height) / wallRays;
    const yO2 = ((i + 1) * height) / wallRays;
    const yI1 = topLeft.y + (i * ih) / wallRays;
    const yI2 = topLeft.y + ((i + 1) * ih) / wallRays;
    // Левая стена
    createRay(
      { x: 0,          y: yO1 },
      { x: topLeft.x,  y: yI1 },
      { x: topLeft.x,  y: yI2 },
      { x: 0,          y: yO2 },
      { x: 0,          y: (yI1 + yI2) / 2 },
      { x: topLeft.x,  y: (yI1 + yI2) / 2 },
      i, wallRays
    );
    // Правая стена
    createRay(
      { x: width,      y: yO1 },
      { x: topRight.x, y: yI1 },
      { x: topRight.x, y: yI2 },
      { x: width,      y: yO2 },
      { x: width,      y: (yI1 + yI2) / 2 },
      { x: topRight.x, y: (yI1 + yI2) / 2 },
      i, wallRays
    );
  }

  // Рисуем пол и потолок
  for (let i = 0; i < floorRays; i++) {
    // Пол (градиент сверху-вниз по трапеции)
    const xO1 = (i * width) / floorRays;
    const xO2 = ((i + 1) * width) / floorRays;
    const xI1 = bottomLeft.x + (i * iw) / floorRays;
    const xI2 = bottomLeft.x + ((i + 1) * iw) / floorRays;
    // градиент от pD (пол) к pC (окно)
    createRay(
      { x: xO1, y: height },      // pA
      { x: xI1, y: bottomLeft.y }, // pB
      { x: xI2, y: bottomLeft.y }, // pC (конец градиента)
      { x: xO2, y: height },       // pD (начало градиента)
      { x: xO2, y: height },       // from = pD
      { x: xI2, y: bottomLeft.y }, // to   = pC
      i, floorRays
    );
    // Потолок (градиент снизу-вверх)
 (градиент снизу-вверх)
    const xJ1 = topLeft.x + (i * iw) / floorRays;
    const xJ2 = topLeft.x + ((i + 1) * iw) / floorRays;
    createRay(
      { x: xJ1, y: topLeft.y },   // pA
      { x: xO1, y: 0 },            // pB
      { x: xO2, y: 0 },            // pC (start)
      { x: xJ2, y: topLeft.y },    // pD (end)
      { x: xJ2, y: 0 },            // from
      { x: xJ2, y: topLeft.y },    // to
      i, floorRays
    );
  }

  // Центр (окно)
  const center = figma.createRectangle();
  center.resize(iw, ih);
  center.x = topLeft.x;
  center.y = topLeft.y;
  center.fills = [{ type: 'SOLID', color: hexToRgb(c3) }];
  rays.push(center);

  // Группируем все
  const group = figma.group(rays, canvas);
  group.name = 'Tunnel Pattern';
  figma.currentPage.appendChild(canvas);
  figma.viewport.scrollAndZoomIntoView([canvas]);
};
