/** Vector silhouettes sampled into the same particle system as the home-page mark. */
export function challengeTargets(index: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 200;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 8;
  const path = (shape: string, fill = false, color = '#063d2e') => {
    ctx.fillStyle = ctx.strokeStyle = color;
    const outline = new Path2D(shape);
    if (fill) ctx.fill(outline); else ctx.stroke(outline);
  };
  const circle = (x: number, y: number, radius: number, fill = false, color = '#659b5e') => {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle = color;
    if (fill) ctx.fill(); else ctx.stroke();
  };
  switch (index % 8) {
    case 0:
      path('M100 169L38 108C-1 65 50 13 100 60C150 13 201 65 162 108Z', true);
      path('M30 109H66L79 87L94 129L110 75L125 109H170', false, '#91b86c');
      break;
    case 1:
      path('M62 57H138V143H62Z', true); path('M79 77H121V123H79Z', true, '#659b5e');
      for (const n of [72, 100, 128]) path(`M${n} 39V57M${n} 143V161M43 ${n}H62M138 ${n}H157`);
      break;
    case 2:
      path('M100 24L163 47V99Q160 150 100 178Q40 150 37 99V47Z', true);
      path('M77 94V81A23 23 0 0 1 123 81V94', false, '#91b86c');
      path('M72 94H128V137H72Z', true, '#659b5e'); circle(100, 109, 4, true, '#063d2e'); path('M100 114V123');
      break;
    case 3:
      circle(100, 100, 76, true, '#659b5e');
      path('M69 57H133M69 74H133M81 57Q137 78 81 98L123 144', false, '#063d2e');
      break;
    case 4:
      path('M100 65Q66 39 25 57V151Q66 135 100 161Q134 135 175 151V57Q134 39 100 65Z', true);
      path('M100 65Q134 39 175 57V151Q134 135 100 161Z', true, '#659b5e');
      path('M100 65V161', false, '#a3c680');
      path('M43 78Q65 70 82 83M43 103Q65 95 82 108M118 83Q140 70 158 78M118 108Q140 95 158 103', false, '#659b5e');
      break;
    case 5:
      path('M70 76L44 48M130 76L156 48M70 123L44 151M130 123L156 151');
      [[42, 44], [158, 44], [42, 155], [158, 155]].forEach(([x,y]) => { circle(x, y, 22, true, '#659b5e'); circle(x, y, 8, true, '#063d2e'); });
      path('M72 73H128V128H72Z', true); circle(100, 100, 13, true, '#659b5e');
      break;
    case 6:
      path('M100 100V38M100 100L41 151M100 100L159 151');
      circle(100, 100, 28, true, '#063d2e');
      circle(100, 29, 16, true); circle(34, 157, 17, true); circle(166, 157, 17, true);
      path('M87 97Q100 86 113 97M94 106Q100 101 106 106', false, '#91b86c');
      break;
    default:
      path('M77 131C76 111 51 104 51 75A49 49 0 0 1 149 75C149 104 124 111 123 131Z', true);
      path('M79 147H121M88 162H112');
      path('M100 129V85M100 103Q73 103 73 76Q100 75 100 103ZM100 103Q129 93 129 67Q104 69 100 103Z', true, '#659b5e');
      path('M100 10V17M29 28L36 35M164 35L172 27');
  }
  const data = ctx.getImageData(0, 0, 200, 200).data;
  const targets: { x: number; y: number; color: string }[] = [];
  const palette = [[6,61,46,'#063d2e'],[101,155,94,'#659b5e'],[145,184,108,'#91b86c'],[163,198,128,'#a3c680']] as const;
  const colors = new Map<string, string>();
  const sampledColor = (r: number, g: number, b: number) => {
    const key = r + ',' + g + ',' + b;
    if (!colors.has(key)) {
      let nearest: string = palette[0][3], distance = Infinity;
      for (const [pr, pg, pb, color] of palette) {
        const difference = (r-pr)**2 + (g-pg)**2 + (b-pb)**2;
        if (difference < distance) { nearest = color; distance = difference; }
      }
      colors.set(key, nearest);
    }
    return colors.get(key)!;
  };
  const spacing = matchMedia('(max-width:700px)').matches ? 3 : 2;
  for (let y = 0; y < 200; y += spacing) for (let x = 0; x < 200; x += spacing) {
    const offset = (y * 200 + x) * 4;
    if (data[offset + 3] < 150) continue;
    targets.push({ x: (x - 100) / 180, y: (y - 100) / 180, color: sampledColor(data[offset], data[offset + 1], data[offset + 2]) });
  }
  return targets;
}
