/**
 * AI問題自動生成エンジン (ai_generator.js)
 * テンプレートベースのパラメータランダム化により、毎回異なる問題を無制限に生成します。
 * 二次関数・三角比の問題にはCanvas描画関数（drawCanvas）を付与します。
 */

const AIGenerator = (function() {

  // ==========================================
  // ヘルパー関数
  // ==========================================

  /** min以上max以下のランダム整数 */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** 配列からランダムに1要素を選ぶ */
  function randFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** 最大公約数（GCD） */
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  /**
   * 二次式の係数 b, c から表示文字列を生成
   * 例: b=3, c=-2 → "+3x - 2"
   */
  function quadTermStr(b, c) {
    let s = '';
    if (b !== 0) {
      if (b === 1) s += '+ x';
      else if (b === -1) s += '- x';
      else s += (b === 1 ? '+ x' : b === -1 ? '- x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`);
    }
    if (c !== 0) s += (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`);
    return s;
  }

  /** 符号付き数値文字列（先頭プラスあり） */
  function withSign(n) {
    return n >= 0 ? `+${n}` : `${n}`;
  }

  /** 二項の符号付き文字列（係数が1なら省略） */
  function termStr(coef, varName) {
    if (coef === 0) return '';
    if (coef === 1) return `+ ${varName}`;
    if (coef === -1) return `- ${varName}`;
    return coef > 0 ? `+ ${coef}${varName}` : `- ${Math.abs(coef)}${varName}`;
  }

  // ==========================================
  // Canvas描画：二次関数のグラフ
  // ==========================================
  function drawQuadraticGraph(canvas, a, h, k, domain) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 表示範囲の計算
    const halfSpanX = 5;
    const xMin = h - halfSpanX;
    const xMax = h + halfSpanX;
    const halfSpanY = 7;
    const yMin = k - 2;
    const yMax = k + halfSpanY * 2;

    const scaleX = W / (xMax - xMin);
    const scaleY = H / (yMax - yMin);

    function cx(x) { return (x - xMin) * scaleX; }
    function cy(y) { return H - (y - yMin) * scaleY; }

    // 背景
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg') || '#f3f4f8';
    ctx.fillRect(0, 0, W, H);

    // グリッド
    ctx.strokeStyle = 'rgba(180,185,210,0.5)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath(); ctx.moveTo(cx(x), 0); ctx.lineTo(cx(x), H); ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      ctx.beginPath(); ctx.moveTo(0, cy(y)); ctx.lineTo(W, cy(y)); ctx.stroke();
    }

    // x軸
    if (yMin <= 0 && yMax >= 0) {
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy(0)); ctx.lineTo(W - 8, cy(0)); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 14, cy(0) - 5); ctx.lineTo(W - 2, cy(0)); ctx.lineTo(W - 14, cy(0) + 5);
      ctx.stroke();
      ctx.fillStyle = '#444'; ctx.font = '13px serif';
      ctx.fillText('x', W - 12, cy(0) - 6);
    }

    // y軸
    if (xMin <= 0 && xMax >= 0) {
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx(0), H); ctx.lineTo(cx(0), 8); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx(0) - 5, 14); ctx.lineTo(cx(0), 2); ctx.lineTo(cx(0) + 5, 14);
      ctx.stroke();
      ctx.fillStyle = '#444'; ctx.font = '13px serif';
      ctx.fillText('y', cx(0) + 4, 14);
    }

    // 軸ラベル
    ctx.fillStyle = '#666'; ctx.font = '10px serif'; ctx.textAlign = 'center';
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x !== 0 && Math.abs(x) <= 4) {
        const yAxis = yMin <= 0 && yMax >= 0 ? cy(0) + 14 : H - 5;
        ctx.fillText(x, cx(x), yAxis);
      }
    }
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y !== 0 && y % 2 === 0) {
        const xAxis = xMin <= 0 && xMax >= 0 ? cx(0) - 3 : 20;
        ctx.fillText(y, xAxis, cy(y) + 4);
      }
    }

    // 対称軸（点線）
    ctx.strokeStyle = 'rgba(99,102,241,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(cx(h), 0); ctx.lineTo(cx(h), H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(99,102,241,0.8)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`x=${h}`, cx(h) + 3, 12);

    // 定義域の塗りつぶし
    if (domain) {
      const [dL, dR] = domain;
      ctx.fillStyle = 'rgba(99,102,241,0.08)';
      ctx.beginPath();
      ctx.moveTo(cx(dL), cy(0));
      for (let px = 0; px <= W; px++) {
        const x = xMin + px / scaleX;
        if (x < dL || x > dR) continue;
        const y = a * (x - h) * (x - h) + k;
        ctx.lineTo(px, cy(y));
      }
      ctx.lineTo(cx(dR), cy(0));
      ctx.closePath(); ctx.fill();

      // 定義域境界（赤破線）
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      [dL, dR].forEach(d => {
        ctx.beginPath(); ctx.moveTo(cx(d), 0); ctx.lineTo(cx(d), H); ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444'; ctx.font = '11px serif'; ctx.textAlign = 'center';
      ctx.fillText(dL, cx(dL), H - 4);
      ctx.fillText(dR, cx(dR), H - 4);
    }

    // 放物線
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px <= W; px++) {
      const x = xMin + px / scaleX;
      const y = a * (x - h) * (x - h) + k;
      if (y < yMin - 2 || y > yMax + 2) { first = true; continue; }
      if (first) { ctx.moveTo(px, cy(y)); first = false; }
      else ctx.lineTo(px, cy(y));
    }
    ctx.stroke();

    // 頂点
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cx(h), cy(k), 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
    const vtxLabelX = cx(h) + (h < xMax - 1 ? 8 : -60);
    ctx.fillText(`(${h}, ${k})`, vtxLabelX, cy(k) - 7);
  }

  // ==========================================
  // Canvas描画：直角三角形
  // ==========================================
  function drawRightTriangleCanvas(canvas, opp, adj, hyp, angleLabel) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--surface') || '#fff';
    ctx.fillRect(0, 0, W, H);

    const mg = 50;
    // 直角を左下に配置
    const A = { x: mg, y: H - mg };       // 直角
    const B = { x: W - mg, y: H - mg };   // 右下
    const C = { x: mg, y: mg };           // 左上

    // 三角形塗りつぶし
    ctx.fillStyle = 'rgba(99,102,241,0.07)';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y);
    ctx.closePath(); ctx.fill();

    // 三角形の辺
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y); ctx.closePath();
    ctx.stroke();

    // 直角マーク
    const sq = 14;
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(A.x + sq, A.y);
    ctx.lineTo(A.x + sq, A.y - sq);
    ctx.lineTo(A.x, A.y - sq);
    ctx.stroke();

    // ラベル
    ctx.font = 'bold 14px serif'; ctx.fillStyle = '#333';

    // 底辺（A-B）
    ctx.textAlign = 'center';
    ctx.fillText(`底辺 = ${adj}`, (A.x + B.x) / 2, A.y + 26);

    // 高さ（A-C）
    ctx.textAlign = 'right';
    ctx.fillText(`高さ = ${opp}`, A.x - 8, (A.y + C.y) / 2 + 5);

    // 斜辺（B-C）
    const midBCx = (B.x + C.x) / 2;
    const midBCy = (B.y + C.y) / 2;
    ctx.textAlign = 'center';
    // 斜辺のラベルは少し右上にオフセット
    ctx.save();
    ctx.translate(midBCx + 28, midBCy - 12);
    ctx.fillText(`斜辺 = ${hyp}`, 0, 0);
    ctx.restore();

    // 角θのラベル（右下・B頂点）
    if (angleLabel) {
      ctx.font = 'italic bold 18px serif';
      ctx.fillStyle = '#6366f1';
      ctx.textAlign = 'left';
      ctx.fillText(angleLabel, B.x - 34, B.y - 10);
    }
  }

  // ==========================================
  // 問題生成テンプレート
  // ==========================================
  const generators = {

    // ============================
    // 数と式（第一節：数と式）
    // ============================
    // ============================
    // 第1章 数と式
    // ============================
    expressions: {

      // 第1節 数と式（展開・因数分解）
      polynomials: {

        basic: function() {
          const a = randInt(1, 9), b = randInt(1, 9);
          const p = a + b, q = a * b;
          return {
            questionHtml: `<p>$(x + ${a})(x + ${b})$ を展開すると $x^2 + ax + ${q}$ となります。</p><p>定数 $a$ の値を求めなさい。</p>`,
            instruction: '解答を半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'], placeholder: '例: 7' }] },
            answers: { ans_a: String(p) },
            correctAnswerTextHtml: `$a = ${p}$`,
            solutionHtml: `<p>展開公式 $(x + a)(x + b) = x^2 + (a+b)x + ab$ を用います。</p><p>$(x + ${a})(x + ${b}) = x^2 + (${a} + ${b})x + ${a} \\times ${b} = x^2 + ${p}x + ${q}$</p><p>よって $a = ${p}$ です。</p>`
          };
        },

        standard: function() {
          let r1, r2;
          do { r1 = randInt(-7, 7); r2 = randInt(-7, 7); }
          while (r1 === r2 || r1 === 0 || r2 === 0);
          const b = -(r1 + r2), c = r1 * r2;
          const bStr = b === 1 ? '+ x' : b === -1 ? '- x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
          const cStr = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
          const small = Math.min(r1, r2), large = Math.max(r1, r2);
          return {
            questionHtml: `<p>$x^2 ${bStr} ${cStr}$ を因数分解すると $(x - a)(x - b)$（$a &lt; b$）となります。</p><p>定数 $a, b$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="定数 a"><span style="margin:0 15px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="定数 b"></div>`,
              fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '定数 b', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(small), ans_b: String(large) },
            correctAnswerTextHtml: `$a = ${small}, \\ b = ${large}$`,
            solutionHtml: `<p>積が $${c}$、和が $${r1 + r2}$ となる2数は $${r1}$ と $${r2}$ です。</p><p>よって $(x - ${small})(x - ${large})$ となります。</p><p>条件 $a &lt; b$ より $a = ${small}, \\ b = ${large}$ です。</p>`
          };
        },

        advanced: function() {
          const a = randInt(2, 5), b = randInt(1, 6);
          const A = a * a, B = 2 * a * b, C = b * b;
          return {
            questionHtml: `<p>$(${a}x + ${b})^2$ を展開すると $Ax^2 + Bx + C$ となります。</p><p>定数 $A, B, C$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>A = </span><input type="text" id="ans_A" class="math-input very-short-input" aria-label="定数 A"><span style="margin:0 8px;">,</span><span>B = </span><input type="text" id="ans_B" class="math-input very-short-input" aria-label="定数 B"><span style="margin:0 8px;">,</span><span>C = </span><input type="text" id="ans_C" class="math-input very-short-input" aria-label="定数 C"></div>`,
              fields: [{ id: 'ans_A', label: '定数 A', allowedKeys: ['0-9'] }, { id: 'ans_B', label: '定数 B', allowedKeys: ['0-9'] }, { id: 'ans_C', label: '定数 C', allowedKeys: ['0-9'] }]
            },
            answers: { ans_A: String(A), ans_B: String(B), ans_C: String(C) },
            correctAnswerTextHtml: `$A = ${A}, \\ B = ${B}, \\ C = ${C}$`,
            solutionHtml: `<p>展開公式 $(a + b)^2 = a^2 + 2ab + b^2$ を用います。</p><p>$(${a}x + ${b})^2 = (${a}x)^2 + 2 \\times ${a}x \\times ${b} + ${b}^2 = ${A}x^2 + ${B}x + ${C}$</p><p>よって $A = ${A}, \\ B = ${B}, \\ C = ${C}$ です。</p>`
          };
        }
      },


      // 第2節 実数（平方根の計算・有理化）
      reals: {

        basic: function() {
          // k²m 型の根号を k√m に簡略化する計算
          const bases = [[4,2],[4,3],[4,5],[9,2],[9,3],[9,5],[16,2],[16,3]];
          const [sq, m] = bases[randInt(0, bases.length - 1)];
          const k = Math.sqrt(sq); // 整数
          const coef = randInt(1, 5);
          const total = coef + k;
          const a = sq * m;
          return {
            questionHtml: `<p>次の計算をしなさい。</p><p>$${coef}\\sqrt{${m}} + \\sqrt{${a}}$</p><p>答えが $n\\sqrt{${m}}$ と表されるとき、整数 $n$ の値を求めなさい。</p>`,
            instruction: '半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: 'n の値', allowedKeys: ['0-9'], placeholder: '例: 5' }] },
            answers: { ans: String(total) },
            correctAnswerTextHtml: `$${total}\\sqrt{${m}}$`,
            solutionHtml: `<p>$\\sqrt{${a}} = \\sqrt{${sq} \\times ${m}} = ${k}\\sqrt{${m}}$</p><p>$${coef}\\sqrt{${m}} + ${k}\\sqrt{${m}} = ${total}\\sqrt{${m}}$</p>`
          };
        },

        standard: function() {
          // 有理化 1/(√a - b) 型
          const b = randInt(1, 4);
          const extra = randInt(1, 5);
          const a = b * b + extra; // a > b² を保証
          const denom = a - b * b; // = extra (>0)
          return {
            questionHtml: `<p>次の式の分母を有理化しなさい。</p><p>$\\dfrac{1}{\\sqrt{${a}} - ${b}}$</p><p>有理化後の分母 $d$ の値を求めなさい。</p>`,
            instruction: '半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '分母 d', allowedKeys: ['0-9'], placeholder: '例: 3' }] },
            answers: { ans: String(denom) },
            correctAnswerTextHtml: `分母 $d = ${denom}$（答え：$\\dfrac{\\sqrt{${a}}+${b}}{${denom}}$）`,
            solutionHtml: `<p>共役な式 $(\\sqrt{${a}}+${b})$ を分子・分母にかけます。</p><p>$\\dfrac{1}{\\sqrt{${a}}-${b}}\\cdot\\dfrac{\\sqrt{${a}}+${b}}{\\sqrt{${a}}+${b}}=\\dfrac{\\sqrt{${a}}+${b}}{${a}-${b*b}}=\\dfrac{\\sqrt{${a}}+${b}}{${denom}}$</p>`
          };
        },

        advanced: function() {
          // a=√m+n, b=√m-n のとき a²+kab+b² を求める（整数値になる保証あり）
          const m = randInt(2, 9);
          const n = randInt(1, 4);
          const k = randInt(1, 4);
          const pq = m - n * n; // ab = m - n²
          const p2q2 = 4 * m - 2 * pq; // a²+b² = 2m+2n²
          const ans = p2q2 + k * pq;
          const mLabel = m, nLabel = n;
          return {
            questionHtml: `<p>$a=\\sqrt{${mLabel}}+${nLabel}$、$b=\\sqrt{${mLabel}}-${nLabel}$ のとき、$a^2+${k}ab+b^2$ の値を求めなさい。</p>`,
            instruction: '半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '式の値', allowedKeys: ['0-9', '-'], placeholder: '例: 12' }] },
            answers: { ans: String(ans) },
            correctAnswerTextHtml: `$a^2+${k}ab+b^2=${ans}$`,
            solutionHtml: `<p>$a+b=2\\sqrt{${mLabel}}$、$ab=(\\sqrt{${mLabel}})^2-${nLabel}^2=${mLabel}-${n*n}=${pq}$</p><p>$a^2+b^2=(a+b)^2-2ab=${4*m}-${2*pq}=${p2q2}$</p><p>$a^2+${k}ab+b^2=${p2q2}+${k}\\times${pq}=${ans}$</p>`
          };
        }
      },

      // ============================
      // 実数と一次不等式
      // ============================
      inequalities: {

        basic: function() {
          const a = randInt(2, 6);
          const ans_val = randInt(-4, 8);
          const b = randInt(-5, 5);
          const c = a * ans_val + b;
          const bStr = b > 0 ? `+ ${b}` : b < 0 ? `- ${Math.abs(b)}` : '';
          return {
            questionHtml: `<p>一次不等式 $${a}x ${bStr} &lt; ${c}$ を解きなさい。</p><p>解が $x &lt; a$ と表されるとき、定数 $a$ の値を求めなさい。</p>`,
            instruction: '解答を半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'], placeholder: '例: 4' }] },
            answers: { ans_a: String(ans_val) },
            correctAnswerTextHtml: `$x &lt; ${ans_val}$`,
            solutionHtml: `<p>$${a}x ${bStr} &lt; ${c}$</p><p>$${a}x &lt; ${c - b}$</p><p>両辺を $${a}$ で割ります（正の数なので不等号の向きは変わりません）。</p><p>$x &lt; ${ans_val}$　よって $a = ${ans_val}$ です。</p>`
          };
        },

        standard: function() {
          const a = randInt(2, 4);
          const ans_upper = randInt(2, 8);
          const b_rhs = a * ans_upper;
          const c = randInt(2, 4);
          const ans_lower = randInt(-3, ans_upper - 1);
          const d_rhs = c * ans_lower;
          return {
            questionHtml: `<p>連立不等式 $\\begin{cases} ${a}x &lt; ${b_rhs} \\\\\\\\ ${c}x &gt; ${d_rhs} \\end{cases}$ を解きなさい。</p><p>解が $a &lt; x &lt; b$ と表されるとき、定数 $a, b$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="定数 a"><span style="margin:0 15px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="定数 b"></div>`,
              fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '定数 b', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(ans_lower), ans_b: String(ans_upper) },
            correctAnswerTextHtml: `$${ans_lower} &lt; x &lt; ${ans_upper}$`,
            solutionHtml: `<p>① $${a}x &lt; ${b_rhs} \\implies x &lt; ${ans_upper}$</p><p>② $${c}x &gt; ${d_rhs} \\implies x &gt; ${ans_lower}$</p><p>共通部分は $${ans_lower} &lt; x &lt; ${ans_upper}$ です。</p>`
          };
        },

        advanced: function() {
          const center = randInt(-2, 5);
          const radius = randInt(2, 6);
          const lower = center - radius, upper = center + radius;
          const cStr = center >= 0 ? `- ${center}` : `+ ${Math.abs(center)}`;
          return {
            questionHtml: `<p>絶対値を含む不等式 $|x ${cStr}| &lt; ${radius}$ を解きなさい。</p><p>解が $a &lt; x &lt; b$ と表されるとき、定数 $a, b$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="定数 a"><span style="margin:0 15px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="定数 b"></div>`,
              fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '定数 b', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(lower), ans_b: String(upper) },
            correctAnswerTextHtml: `$${lower} &lt; x &lt; ${upper}$`,
            solutionHtml: `<p>$|X| &lt; r \\iff -r &lt; X &lt; r$ の形に変形します。</p><p>$-${radius} &lt; x ${cStr} &lt; ${radius}$</p><p>各辺に $${center}$ を加えます。</p><p>$${lower} &lt; x &lt; ${upper}$</p>`
          };
        }
      }
    },


    // ============================
    // 第2章 集合と命題
    // ============================
    sets: {
      sets_logic: {

        basic: function() {
          // n(A∩B) を求める問題
          const total = randInt(6, 12);
          const nA = randInt(3, total - 1);
          const nB = randInt(3, total - 1);
          const maxInter = Math.min(nA, nB, total - Math.max(nA, nB));
          const nInter = randInt(1, Math.max(1, maxInter));
          return {
            questionHtml: `<p>全体集合 $U$ の要素の個数は $${total}$ です。</p><p>$n(A)=${nA}$、$n(B)=${nB}$、$n(A\\cup B)=${nA+nB-nInter}$ のとき、$n(A\\cap B)$ を求めなさい。</p>`,
            instruction: '半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: 'n(A∩B)', allowedKeys: ['0-9'], placeholder: '例: 2' }] },
            answers: { ans: String(nInter) },
            correctAnswerTextHtml: `$n(A\\cap B)=${nInter}$`,
            solutionHtml: `<p>加法定理 $n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$ より、</p><p>$${nA+nB-nInter}=${nA}+${nB}-n(A\\cap B)$</p><p>$n(A\\cap B)=${nA}+${nB}-${nA+nB-nInter}=${nInter}$</p>`
          };
        },

        standard: function() {
          // 命題の真偽問題（条件p,qの設定）
          const pairs = [
            { p: 'x=3', q: 'x^2=9', correct: true,
              reason: '$x=3$ のとき $x^2=9$ は成立します。' },
            { p: 'x^2=9', q: 'x=3', correct: false,
              reason: '$x=-3$ のとき $x^2=9$ だが $x\\ne3$。反例があります。' },
            { p: 'x>2', q: 'x>0', correct: true,
              reason: '$x>2$ なら必ず $x>0$ が成り立ちます。' },
            { p: 'x>0', q: 'x>2', correct: false,
              reason: '$x=1$ のとき $x>0$ だが $x\\not>2$。反例があります。' },
            { p: 'x=1\\text{ かつ }y=1', q: 'x+y=2', correct: true,
              reason: '$x=1,y=1$ なら $x+y=2$ は成立します。' }
          ];
          const item = pairs[randInt(0, pairs.length - 1)];
          return {
            questionHtml: `<p>「$${item.p}$ ならば $${item.q}$」という命題の真偽を答えなさい。</p><p>真なら $1$、偽なら $0$ を入力してください。</p>`,
            instruction: '真(1) または 偽(0) を入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '真(1)/偽(0)', allowedKeys: ['0-1'], placeholder: '1 または 0' }] },
            answers: { ans: item.correct ? '1' : '0' },
            correctAnswerTextHtml: item.correct ? '真（$1$）' : '偽（$0$）',
            solutionHtml: `<p>${item.reason}</p><p>よってこの命題は<strong>${item.correct ? '真' : '偽'}</strong>です。</p>`
          };
        },

        advanced: function() {
          // n(A∩B̄) = n(A) - n(A∩B) 型
          const nU = randInt(10, 20);
          const nA = randInt(4, nU - 2);
          const nB = randInt(4, nU - 2);
          const nInter = randInt(1, Math.min(nA, nB) - 1);
          const nAnotB = nA - nInter; // n(A∩B̄)
          return {
            questionHtml: `<p>$n(U)=${nU}$、$n(A)=${nA}$、$n(B)=${nB}$、$n(A\\cap B)=${nInter}$ のとき、</p><p>$n(A\\cap \\overline{B})$（$A$ に属するが $B$ に属さない要素の個数）を求めなさい。</p>`,
            instruction: '半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: 'n(A∩B̄)', allowedKeys: ['0-9'], placeholder: '例: 3' }] },
            answers: { ans: String(nAnotB) },
            correctAnswerTextHtml: `$n(A\\cap\\overline{B})=${nAnotB}$`,
            solutionHtml: `<p>$A=(A\\cap B)\\cup(A\\cap\\overline{B})$（互いに素）より、</p><p>$n(A)=n(A\\cap B)+n(A\\cap\\overline{B})$</p><p>$n(A\\cap\\overline{B})=${nA}-${nInter}=${nAnotB}$</p>`
          };
        }
      }
    },

    // ============================
    // 二次関数
    // ============================
    quadratic: {
      graphs: {

        basic: function() {
          const h = randInt(-4, 4), k = randInt(-6, 4);
          const b = -2 * h, c = h * h + k;
          const eqStr = `x^2${b !== 0 ? (b === 1 ? ' + x' : b === -1 ? ' - x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`) : ''}${c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : ''}`;
          return {
            questionHtml: `<p>$2$次関数 $y = ${eqStr}$ の頂点の座標を求めなさい。</p>`,
            instruction: '頂点の座標 $(p, q)$ の各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>頂点 ( </span><input type="text" id="ans_p" class="math-input very-short-input" aria-label="頂点のx座標"><span style="margin:0 5px;">,</span><input type="text" id="ans_q" class="math-input very-short-input" aria-label="頂点のy座標"><span> )</span></div>`,
              fields: [{ id: 'ans_p', label: '頂点のx座標', allowedKeys: ['0-9', '-'] }, { id: 'ans_q', label: '頂点のy座標', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_p: String(h), ans_q: String(k) },
            correctAnswerTextHtml: `頂点 $(${h}, ${k})$`,
            solutionHtml: `<p>平方完成を行います。</p><p>$y = x^2 ${b !== 0 ? (b === 1 ? '+ x ' : b === -1 ? '- x ' : b > 0 ? `+ ${b}x ` : `- ${Math.abs(b)}x `) : ''}${c !== 0 ? (c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`) : ''}$</p><p>$y = (x ${h >= 0 ? `- ${h}` : `+ ${Math.abs(h)}`})^2 ${k >= 0 ? `+ ${k}` : `- ${Math.abs(k)}`}$</p><p>よって頂点は $(${h}, ${k})$ です。</p>`,
            drawCanvas: function(canvas) { drawQuadraticGraph(canvas, 1, h, k, null); }
          };
        },

        standard: function() {
          const h = randInt(-2, 2), k = randInt(-5, -1);
          const domL = h - randInt(2, 4), domR = h + randInt(2, 4);
          const fL = (domL - h) * (domL - h) + k;
          const fR = (domR - h) * (domR - h) + k;
          const maxVal = Math.max(fL, fR), minVal = k;
          const maxAtX = fL >= fR ? domL : domR;
          const b = -2 * h, c = h * h + k;
          const eqStr = `x^2${b !== 0 ? (b === 1 ? ' + x' : b === -1 ? ' - x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`) : ''}${c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : ''}`;
          return {
            questionHtml: `<p>$2$次関数 $y = ${eqStr}$ の、定義域 $${domL} \\le x \\le ${domR}$ における最大値 $M$ と最小値 $m$ を求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>最大値 M = </span><input type="text" id="ans_M" class="math-input very-short-input" aria-label="最大値 M"><span style="margin:0 15px;">,</span><span>最小値 m = </span><input type="text" id="ans_m" class="math-input very-short-input" aria-label="最小値 m"></div>`,
              fields: [{ id: 'ans_M', label: '最大値 M', allowedKeys: ['0-9', '-'] }, { id: 'ans_m', label: '最小値 m', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_M: String(maxVal), ans_m: String(minVal) },
            correctAnswerTextHtml: `最大値 $M = ${maxVal}$, 最小値 $m = ${minVal}$`,
            solutionHtml: `<p>平方完成すると $y = (x ${h >= 0 ? `- ${h}` : `+ ${Math.abs(h)}`})^2 ${k >= 0 ? `+ ${k}` : `- ${Math.abs(k)}`}$、軸は $x = ${h}$ です。</p><p>定義域内に軸があるため、最小値は頂点 $x = ${h}$ で $m = ${minVal}$ となります。</p><p>最大値は軸から遠い端点 $x = ${maxAtX}$ で $M = ${maxVal}$ となります。</p>`,
            drawCanvas: function(canvas) { drawQuadraticGraph(canvas, 1, h, k, [domL, domR]); }
          };
        },

        advanced: function() {
          const h = randInt(-3, 3), k = randInt(-8, -1);
          const a = randInt(1, 3);
          const px = h + randInt(1, 3);
          const py = a * (px - h) * (px - h) + k;
          const B = -2 * a * h, C = a * h * h + k;
          const eqStr = `${a !== 1 ? a : ''}x^2${B !== 0 ? (B === 1 ? ' + x' : B === -1 ? ' - x' : B > 0 ? ` + ${B}x` : ` - ${Math.abs(B)}x`) : ''}${C !== 0 ? (C > 0 ? ` + ${C}` : ` - ${Math.abs(C)}`) : ''}`;
          return {
            questionHtml: `<p>頂点が $(${h}, ${k})$ で、点 $(${px}, ${py})$ を通る $2$次関数 $y = ax^2 + bx + c$ を求めるとき、定数 $a, b, c$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="定数 a"><span style="margin:0 8px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="定数 b"><span style="margin:0 8px;">,</span><span>c = </span><input type="text" id="ans_c" class="math-input very-short-input" aria-label="定数 c"></div>`,
              fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '定数 b', allowedKeys: ['0-9', '-'] }, { id: 'ans_c', label: '定数 c', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(a), ans_b: String(B), ans_c: String(C) },
            correctAnswerTextHtml: `$y = ${eqStr}$（$a=${a}, b=${B}, c=${C}$）`,
            solutionHtml: `<p>頂点が $(${h}, ${k})$ なので $y = a(x ${h >= 0 ? `- ${h}` : `+ ${Math.abs(h)}`})^2 + ${k}$ とおきます。</p><p>点 $(${px}, ${py})$ を代入します。</p><p>$${py} = a(${px} ${h >= 0 ? `- ${h}` : `+ ${Math.abs(h)}` })^2 + ${k}$</p><p>$${py - k} = ${(px - h) * (px - h)} a$</p><p>$a = ${a}$</p><p>展開すると $y = ${eqStr}$ となり、$a = ${a}, b = ${B}, c = ${C}$ です。</p>`,
            drawCanvas: function(canvas) { drawQuadraticGraph(canvas, a, h, k, null); }
          };
        }
      },

      equations: {

        basic: function() {
          let r1, r2;
          do { r1 = randInt(-6, 6); r2 = randInt(-6, 6); }
          while (r1 === r2);
          const b = -(r1 + r2), c = r1 * r2;
          const bStr = b !== 0 ? (b === 1 ? ' + x' : b === -1 ? ' - x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`) : '';
          const cStr = c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : '';
          const small = Math.min(r1, r2), large = Math.max(r1, r2);
          return {
            questionHtml: `<p>$2$次方程式 $x^2${bStr}${cStr} = 0$ を解きなさい。</p><p>解が $x = a, \\ b$（$a &lt; b$）のとき、定数 $a, b$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="解 a"><span style="margin:0 15px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="解 b"></div>`,
              fields: [{ id: 'ans_a', label: '解 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '解 b', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(small), ans_b: String(large) },
            correctAnswerTextHtml: `$x = ${small}, \\ ${large}$`,
            solutionHtml: `<p>左辺を因数分解します。</p><p>積が $${c}$、和が $${r1 + r2}$ となる2数は $${r1}$ と $${r2}$ です。</p><p>$(x - ${r1})(x - ${r2}) = 0$</p><p>$x = ${small}, \\ ${large}$（$a &lt; b$ より）</p>`
          };
        },

        standard: function() {
          // 解の公式を使う問題（判別式が完全平方数）
          let r1, r2;
          do { r1 = randInt(-7, 7); r2 = randInt(-7, 7); }
          while (r1 === r2 || Math.abs(r1 - r2) < 2);
          const bv = -(r1 + r2), cv = r1 * r2;
          const disc = bv * bv - 4 * cv;
          const sqrtDisc = Math.round(Math.sqrt(disc));
          const bStr = bv !== 0 ? (bv === 1 ? ' + x' : bv === -1 ? ' - x' : bv > 0 ? ` + ${bv}x` : ` - ${Math.abs(bv)}x`) : '';
          const cStr = cv !== 0 ? (cv > 0 ? ` + ${cv}` : ` - ${Math.abs(cv)}`) : '';
          const small = Math.min(r1, r2), large = Math.max(r1, r2);
          return {
            questionHtml: `<p>$2$次方程式 $x^2${bStr}${cStr} = 0$ を解の公式を用いて解きなさい。</p><p>解が $x = a, \\ b$（$a &lt; b$）のとき、$a, b$ の値を求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="解 a"><span style="margin:0 15px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="解 b"></div>`,
              fields: [{ id: 'ans_a', label: '解 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '解 b', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(small), ans_b: String(large) },
            correctAnswerTextHtml: `$x = ${small}, \\ ${large}$`,
            solutionHtml: `<p>解の公式 $x = \\frac{-b \\pm \\sqrt{b^2 - 4c}}{2}$ を用います（$a=1$）。</p><p>$x = \\frac{${-bv} \\pm \\sqrt{${bv}^2 - 4 \\times ${cv}}}{2} = \\frac{${-bv} \\pm \\sqrt{${disc}}}{2} = \\frac{${-bv} \\pm ${sqrtDisc}}{2}$</p><p>$x = ${large}$ または $x = ${small}$</p>`
          };
        },

        advanced: function() {
          let r1, r2;
          do { r1 = randInt(-5, 5); r2 = randInt(-5, 5); }
          while (r1 === r2);
          const b = -(r1 + r2), c = r1 * r2;
          const small = Math.min(r1, r2), large = Math.max(r1, r2);
          const bStr = b !== 0 ? (b === 1 ? ' + x' : b === -1 ? ' - x' : b > 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`) : '';
          const cStr = c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : '';
          return {
            questionHtml: `<p>$2$次不等式 $x^2${bStr}${cStr} &lt; 0$ を解きなさい。</p><p>解が $a &lt; x &lt; b$ と表されるとき、定数 $a, b$ の値をそれぞれ求めなさい。</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>a = </span><input type="text" id="ans_a" class="math-input very-short-input" aria-label="定数 a"><span style="margin:0 15px;">,</span><span>b = </span><input type="text" id="ans_b" class="math-input very-short-input" aria-label="定数 b"></div>`,
              fields: [{ id: 'ans_a', label: '定数 a', allowedKeys: ['0-9', '-'] }, { id: 'ans_b', label: '定数 b', allowedKeys: ['0-9', '-'] }]
            },
            answers: { ans_a: String(small), ans_b: String(large) },
            correctAnswerTextHtml: `$${small} &lt; x &lt; ${large}$`,
            solutionHtml: `<p>$x^2${bStr}${cStr} = 0$ を解くと $(x - ${r1})(x - ${r2}) = 0$ より $x = ${small}, \\ ${large}$ です。</p><p>$2$次の係数が正なので放物線は下に凸です。</p><p>不等号が $&lt; 0$（$y$ が負）なので、解は2根の間（内側）になります。</p><p>$${small} &lt; x &lt; ${large}$</p>`
          };
        }
      }
    },

    // ============================
    // 図形と計量（三角比）
    // ============================
    trigonometry: {
      ratios: {

        basic: function() {
          const triples = [[3,4,5],[5,12,13],[8,15,17],[6,8,10],[7,24,25]];
          const [opp, adj, hyp] = randFrom(triples);
          const askType = randFrom(['sin', 'cos']);
          const ans_n = askType === 'sin' ? opp : adj;
          const ans_d = hyp;
          const g = gcd(ans_n, ans_d);
          return {
            questionHtml: `<p>直角三角形において、斜辺 $= ${hyp}$、底辺 $= ${adj}$、高さ $= ${opp}$ のとき、角 $\\theta$ に対応する $\\${askType} \\theta$ の値を分数で求めなさい。</p>`,
            instruction: '分数の各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="fraction-input-wrapper"><div class="fraction-input-container"><div class="fraction-numerator"><input type="text" id="ans_num" class="math-input very-short-input" aria-label="分子"></div><div class="fraction-line"></div><div class="fraction-denominator"><input type="text" id="ans_den" class="math-input very-short-input" aria-label="分母"></div></div></div>`,
              fields: [{ id: 'ans_num', label: '分子', allowedKeys: ['0-9'] }, { id: 'ans_den', label: '分母', allowedKeys: ['0-9'] }]
            },
            answers: { ans_num: String(ans_n / g), ans_den: String(ans_d / g) },
            correctAnswerTextHtml: `$\\${askType} \\theta = \\frac{${ans_n / g}}{${ans_d / g}}$`,
            solutionHtml: `<p>三角比の定義より、$\\${askType} \\theta = \\frac{${askType === 'sin' ? '高さ（対辺）' : '底辺（隣辺）'}}{斜辺}$ です。</p><p>$\\${askType} \\theta = \\frac{${ans_n}}{${ans_d}}${g > 1 ? ` = \\frac{${ans_n/g}}{${ans_d/g}}` : ''}$</p>`,
            drawCanvas: function(canvas) { drawRightTriangleCanvas(canvas, opp, adj, hyp, 'θ'); }
          };
        },

        standard: function() {
          const triples = [[3,4,5],[5,12,13],[8,15,17],[6,8,10]];
          const [opp, adj, hyp] = randFrom(triples);
          const g_s = gcd(opp, hyp), g_c = gcd(adj, hyp), g_t = gcd(opp, adj);
          const [sn, sd] = [opp/g_s, hyp/g_s];
          const [cn, cd] = [adj/g_c, hyp/g_c];
          const [tn, td] = [opp/g_t, adj/g_t];
          return {
            questionHtml: `<p>$\\theta$ は鋭角とします。$\\sin \\theta = \\frac{${sn}}{${sd}}$ のとき、$\\cos \\theta$ と $\\tan \\theta$ の値をそれぞれ分数で求めなさい。</p>`,
            instruction: '分数の各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="stacked-input-col"><div><span>cos θ = </span><div class="fraction-input-wrapper" style="display:inline-block;vertical-align:middle;"><div class="fraction-input-container"><input type="text" id="cos_num" class="math-input very-short-input mini-fraction" aria-label="cos分子"><div class="fraction-line"></div><input type="text" id="cos_den" class="math-input very-short-input mini-fraction" aria-label="cos分母"></div></div></div><div style="margin-top:10px;"><span>tan θ = </span><div class="fraction-input-wrapper" style="display:inline-block;vertical-align:middle;"><div class="fraction-input-container"><input type="text" id="tan_num" class="math-input very-short-input mini-fraction" aria-label="tan分子"><div class="fraction-line"></div><input type="text" id="tan_den" class="math-input very-short-input mini-fraction" aria-label="tan分母"></div></div></div></div>`,
              fields: [{ id: 'cos_num', label: 'cos分子', allowedKeys: ['0-9'] }, { id: 'cos_den', label: 'cos分母', allowedKeys: ['0-9'] }, { id: 'tan_num', label: 'tan分子', allowedKeys: ['0-9'] }, { id: 'tan_den', label: 'tan分母', allowedKeys: ['0-9'] }]
            },
            answers: { cos_num: String(cn), cos_den: String(cd), tan_num: String(tn), tan_den: String(td) },
            correctAnswerTextHtml: `$\\cos \\theta = \\frac{${cn}}{${cd}}, \\ \\tan \\theta = \\frac{${tn}}{${td}}$`,
            solutionHtml: `<p>相互関係式 $\\sin^2\\theta + \\cos^2\\theta = 1$ を用います。</p><p>$\\cos^2\\theta = 1 - \\frac{${opp*opp}}{${hyp*hyp}} = \\frac{${adj*adj}}{${hyp*hyp}}$</p><p>$\\theta$ は鋭角より $\\cos\\theta &gt; 0$ なので、$\\cos\\theta = \\frac{${cn}}{${cd}}$</p><p>$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta} = \\frac{${sn}/${sd}}{${cn}/${cd}} = \\frac{${tn}}{${td}}$</p>`,
            drawCanvas: function(canvas) { drawRightTriangleCanvas(canvas, opp, adj, hyp, 'θ'); }
          };
        },

        advanced: function() {
          // 特殊角の値を求める
          const cases = [
            { q: '$\\sin 30^\\circ$ の値を求めなさい。分子と分母を入力してください。', n: 1, d: 2, sol: '<p>$\\sin 30^\\circ = \\frac{1}{2}$（特殊角の値として覚えておきましょう）</p>' },
            { q: '$\\cos 60^\\circ$ の値を求めなさい。分子と分母を入力してください。', n: 1, d: 2, sol: '<p>$\\cos 60^\\circ = \\frac{1}{2}$（$\\cos 60^\\circ = \\sin 30^\\circ$ です）</p>' },
            { q: '$\\sin 150^\\circ$ の値を求めなさい。分子と分母を入力してください。', n: 1, d: 2, sol: '<p>$\\sin 150^\\circ = \\sin(180^\\circ - 30^\\circ) = \\sin 30^\\circ = \\frac{1}{2}$</p>' },
            { q: '$\\cos 180^\\circ$ の値を求めなさい。分子と分母を入力してください（負の値は分子に符号を入力）。', n: -1, d: 1, sol: '<p>$\\cos 180^\\circ = -1$（単位円上の点 $(-1, 0)$ の $x$ 座標です）</p>' },
          ];
          const c = randFrom(cases);
          return {
            questionHtml: `<p>${c.q}</p>`,
            instruction: '分数の各欄に当てはまる半角の整数を入力してください（負の値は分子に符号を含めてください）。',
            answerForm: {
              type: 'custom',
              html: `<div class="fraction-input-wrapper"><div class="fraction-input-container"><div class="fraction-numerator"><input type="text" id="ans_num" class="math-input very-short-input" aria-label="分子"></div><div class="fraction-line"></div><div class="fraction-denominator"><input type="text" id="ans_den" class="math-input very-short-input" aria-label="分母"></div></div></div>`,
              fields: [{ id: 'ans_num', label: '分子', allowedKeys: ['0-9', '-'] }, { id: 'ans_den', label: '分母', allowedKeys: ['0-9'] }]
            },
            answers: { ans_num: String(c.n), ans_den: String(c.d) },
            correctAnswerTextHtml: `$\\frac{${c.n}}{${c.d}}$`,
            solutionHtml: c.sol
          };
        }
      },

      theorems: {

        basic: function() {
          const triples = [[3,4,5],[5,12,13],[8,15,17],[6,8,10]];
          const [a, b, c] = randFrom(triples);
          const findHyp = Math.random() > 0.5;
          if (findHyp) {
            return {
              questionHtml: `<p>直角三角形において、$2$辺の長さが $${a}$ と $${b}$ であるとき、斜辺の長さを求めなさい。</p>`,
              instruction: '解答を半角の整数で入力してください。',
              answerForm: { type: 'number', fields: [{ id: 'ans', label: '斜辺の長さ', allowedKeys: ['0-9'], placeholder: '例: 5' }] },
              answers: { ans: String(c) },
              correctAnswerTextHtml: `$${c}$`,
              solutionHtml: `<p>三平方の定理より $c^2 = ${a}^2 + ${b}^2 = ${a*a} + ${b*b} = ${c*c}$</p><p>$c = ${c}$</p>`,
              drawCanvas: function(canvas) { drawRightTriangleCanvas(canvas, a, b, c, null); }
            };
          } else {
            return {
              questionHtml: `<p>直角三角形において、斜辺が $${c}$、一辺が $${a}$ であるとき、もう一辺の長さを求めなさい。</p>`,
              instruction: '解答を半角の整数で入力してください。',
              answerForm: { type: 'number', fields: [{ id: 'ans', label: '辺の長さ', allowedKeys: ['0-9'], placeholder: '例: 4' }] },
              answers: { ans: String(b) },
              correctAnswerTextHtml: `$${b}$`,
              solutionHtml: `<p>三平方の定理より $${a}^2 + x^2 = ${c}^2$</p><p>$x^2 = ${c*c} - ${a*a} = ${b*b}$</p><p>$x = ${b}$</p>`,
              drawCanvas: function(canvas) { drawRightTriangleCanvas(canvas, a, b, c, null); }
            };
          }
        },

        standard: function() {
          // 余弦定理でACを求める（角Bが60°または120°）
          const a_side = randInt(3, 8), b_side = randInt(3, 8);
          const C_deg = randFrom([60, 120]);
          const cos_C = C_deg === 60 ? 0.5 : -0.5;
          const c_sq = a_side * a_side + b_side * b_side - 2 * a_side * b_side * cos_C;
          const c_side = Math.round(Math.sqrt(c_sq));
          if (c_side * c_side !== c_sq) {
            // 固定の正例にフォールバック
            return {
              questionHtml: `<p>三角形 $ABC$ において、$AB = 5$、$BC = 7$、$\\angle B = 60°$ のとき、$AC^2$ の値を求めなさい。</p>`,
              instruction: '解答を半角の整数で入力してください。',
              answerForm: { type: 'number', fields: [{ id: 'ans', label: 'AC²', allowedKeys: ['0-9'], placeholder: '例: 39' }] },
              answers: { ans: '39' },
              correctAnswerTextHtml: '$AC^2 = 39$（$AC = \\sqrt{39}$）',
              solutionHtml: '<p>余弦定理 $AC^2 = AB^2 + BC^2 - 2 \\cdot AB \\cdot BC \\cdot \\cos B$ を用います。</p><p>$AC^2 = 25 + 49 - 2 \\times 5 \\times 7 \\times \\frac{1}{2} = 74 - 35 = 39$</p>'
            };
          }
          return {
            questionHtml: `<p>三角形 $ABC$ において、$AB = ${b_side}$、$BC = ${a_side}$、$\\angle B = ${C_deg}°$ のとき、$AC$ の長さを求めなさい。</p>`,
            instruction: '解答を半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: 'AC の長さ', allowedKeys: ['0-9'], placeholder: '例: 5' }] },
            answers: { ans: String(c_side) },
            correctAnswerTextHtml: `$AC = ${c_side}$`,
            solutionHtml: `<p>余弦定理 $AC^2 = AB^2 + BC^2 - 2 \\cdot AB \\cdot BC \\cdot \\cos B$ を用います。</p><p>$\\cos ${C_deg}° = ${C_deg === 60 ? '\\frac{1}{2}' : '-\\frac{1}{2}'}$ なので</p><p>$AC^2 = ${b_side*b_side} + ${a_side*a_side} - 2 \\times ${b_side} \\times ${a_side} \\times (${C_deg === 60 ? '\\frac{1}{2}' : '-\\frac{1}{2}'}) = ${c_sq}$</p><p>$AC = ${c_side}$</p>`
          };
        },

        advanced: function() {
          // 3辺からcos A = 1/2 → A=60° の問題（固定）
          return {
            questionHtml: `<p>三角形 $ABC$ において、$a = 7$、$b = 5$、$c = 8$ のとき、角 $A$ の大きさを求めなさい。</p>`,
            instruction: '解答を半角の整数で入力してください（単位：度）。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '角A（度）', allowedKeys: ['0-9'], placeholder: '例: 60' }] },
            answers: { ans: '60' },
            correctAnswerTextHtml: '$A = 60°$',
            solutionHtml: '<p>余弦定理 $\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}$ を用います。</p><p>$\\cos A = \\frac{25 + 64 - 49}{2 \\times 5 \\times 8} = \\frac{40}{80} = \\frac{1}{2}$</p><p>$A = 60°$</p>'
          };
        }
      }
    },

    // ============================
    // データの分析
    // ============================
    data_analysis: {
      stats: {

        basic: function() {
          let data, mean;
          let tries = 0;
          do {
            data = Array.from({ length: 5 }, () => randInt(1, 15));
            mean = data.reduce((a, b) => a + b, 0) / 5;
            tries++;
          } while (!Number.isInteger(mean) && tries < 200);
          const sorted = [...data].sort((a, b) => a - b);
          const median = sorted[2];
          return {
            questionHtml: `<p>次の $5$ つのデータの平均値と中央値を求めなさい。</p><p class="data-display">${data.join('&emsp;')}</p>`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>平均値 = </span><input type="text" id="ans_mean" class="math-input very-short-input" aria-label="平均値"><span style="margin:0 15px;">,</span><span>中央値 = </span><input type="text" id="ans_med" class="math-input very-short-input" aria-label="中央値"></div>`,
              fields: [{ id: 'ans_mean', label: '平均値', allowedKeys: ['0-9'] }, { id: 'ans_med', label: '中央値', allowedKeys: ['0-9'] }]
            },
            answers: { ans_mean: String(mean), ans_med: String(median) },
            correctAnswerTextHtml: `平均値 $= ${mean}$, 中央値 $= ${median}$`,
            solutionHtml: `<p>データを昇順に並べます：${sorted.join(' , ')}</p><p>平均値：$\\frac{${data.join('+')}}{5} = \\frac{${data.reduce((a,b)=>a+b,0)}}{5} = ${mean}$</p><p>中央値：$5$ 個の中央（$3$ 番目）の値 $= ${median}$</p>`
          };
        },

        standard: function() {
          let data, mean, variance;
          let tries = 0;
          do {
            data = Array.from({ length: 4 }, () => randInt(1, 10));
            mean = data.reduce((a, b) => a + b, 0) / 4;
            variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / 4;
            tries++;
          } while ((!Number.isInteger(variance) || !Number.isInteger(mean)) && tries < 300);
          return {
            questionHtml: `<p>次の $4$ つのデータの分散を求めなさい。</p><p class="data-display">${data.join('&emsp;')}</p>`,
            instruction: '解答を半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '分散', allowedKeys: ['0-9'], placeholder: '例: 4' }] },
            answers: { ans: String(variance) },
            correctAnswerTextHtml: `分散 $= ${variance}$`,
            solutionHtml: `<p>平均 $\\bar{x} = \\frac{${data.join('+')}}{4} = ${mean}$</p><p>各値の偏差の2乗：${data.map(x => `$(${x}-${mean})^2=${(x-mean)**2}$`).join(', ')}</p><p>分散 $= \\frac{${data.map(x=>(x-mean)**2).join('+')}}{4} = ${variance}$</p>`
          };
        },

        advanced: function() {
          let data;
          let tries = 0;
          let Q1, Q3;
          do {
            data = Array.from({ length: 6 }, () => randInt(2, 18)).sort((a, b) => a - b);
            Q1 = (data[1] + data[2]) / 2;
            Q3 = (data[3] + data[4]) / 2;
            tries++;
          } while ((!Number.isInteger(Q1) || !Number.isInteger(Q3) || new Set(data).size < 6) && tries < 200);
          const iqr = Q3 - Q1;
          return {
            questionHtml: `<p>次の $6$ つのデータについて、四分位範囲（$Q_3 - Q_1$）を求めなさい。</p><p class="data-display">${data.join('&emsp;')}</p>`,
            instruction: '解答を半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '四分位範囲', allowedKeys: ['0-9'], placeholder: '例: 5' }] },
            answers: { ans: String(iqr) },
            correctAnswerTextHtml: `四分位範囲 $= ${iqr}$`,
            solutionHtml: `<p>昇順データ：${data.join(', ')}</p><p>$Q_1 = \\frac{${data[1]} + ${data[2]}}{2} = ${Q1}$</p><p>$Q_3 = \\frac{${data[3]} + ${data[4]}}{2} = ${Q3}$</p><p>四分位範囲 $= Q_3 - Q_1 = ${Q3} - ${Q1} = ${iqr}$</p>`
          };
        }
      },

      correlation: {

        basic: function() {
          let xs, ys, mx, my;
          let tries = 0;
          do {
            xs = Array.from({ length: 4 }, () => randInt(1, 10));
            ys = xs.map(x => x * 2 + randInt(-1, 1));
            mx = xs.reduce((a, b) => a + b, 0) / 4;
            my = ys.reduce((a, b) => a + b, 0) / 4;
            tries++;
          } while ((!Number.isInteger(mx) || !Number.isInteger(my)) && tries < 200);
          const table = `<table class="data-table"><tr><th>x</th>${xs.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>y</th>${ys.map(v=>`<td>${v}</td>`).join('')}</tr></table>`;
          return {
            questionHtml: `<p>次のデータについて、$x$ の平均値 $\\bar{x}$ と $y$ の平均値 $\\bar{y}$ を求めなさい。</p>${table}`,
            instruction: '各欄に当てはまる半角の整数を入力してください。',
            answerForm: {
              type: 'custom',
              html: `<div class="inline-input-row"><span>x̄ = </span><input type="text" id="ans_mx" class="math-input very-short-input" aria-label="xの平均"><span style="margin:0 15px;">,</span><span>ȳ = </span><input type="text" id="ans_my" class="math-input very-short-input" aria-label="yの平均"></div>`,
              fields: [{ id: 'ans_mx', label: 'xの平均', allowedKeys: ['0-9'] }, { id: 'ans_my', label: 'yの平均', allowedKeys: ['0-9'] }]
            },
            answers: { ans_mx: String(mx), ans_my: String(my) },
            correctAnswerTextHtml: `$\\bar{x} = ${mx}, \\ \\bar{y} = ${my}$`,
            solutionHtml: `<p>$\\bar{x} = \\frac{${xs.join('+')}}{4} = ${mx}$</p><p>$\\bar{y} = \\frac{${ys.join('+')}}{4} = ${my}$</p>`
          };
        },

        standard: function() {
          const dirs = [
            { label: '正の相関', key: '1', xs: [1,2,3,4,5], ys: [2,4,5,7,9], desc: '$x$ が増えると $y$ も増える傾向があります。' },
            { label: '負の相関', key: '2', xs: [1,2,3,4,5], ys: [9,7,5,3,2], desc: '$x$ が増えると $y$ は減る傾向があります。' },
            { label: '相関なし', key: '3', xs: [1,2,3,4,5], ys: [3,7,2,8,4], desc: '$x$ と $y$ に規則的な関係は見られません。' }
          ];
          const d = randFrom(dirs);
          const table = `<table class="data-table"><tr><th>x</th>${d.xs.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>y</th>${d.ys.map(v=>`<td>${v}</td>`).join('')}</tr></table>`;
          return {
            questionHtml: `<p>次のデータについて、$x$ と $y$ の相関の種類を数字で選びなさい。</p>${table}<p>（1: 正の相関, 2: 負の相関, 3: 相関なし）</p>`,
            instruction: '当てはまる番号（1, 2, 3 のいずれか）を入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '番号（1〜3）', allowedKeys: ['0-9'], placeholder: '1, 2, または 3' }] },
            answers: { ans: d.key },
            correctAnswerTextHtml: `${d.label}（${d.key}）`,
            solutionHtml: `<p>${d.desc}</p><p>よって「<strong>${d.label}</strong>」（${d.key}）です。</p>`
          };
        },

        advanced: function() {
          let xs, ys, mx, my, cov;
          let tries = 0;
          do {
            xs = Array.from({ length: 4 }, () => randInt(1, 6));
            ys = Array.from({ length: 4 }, () => randInt(1, 6));
            mx = xs.reduce((a, b) => a + b, 0) / 4;
            my = ys.reduce((a, b) => a + b, 0) / 4;
            const dx = xs.map(x => x - mx), dy = ys.map(y => y - my);
            cov = dx.reduce((s, d, i) => s + d * dy[i], 0) / 4;
            tries++;
          } while ((!Number.isInteger(mx) || !Number.isInteger(my) || !Number.isInteger(cov)) && tries < 300);
          const dx = xs.map(x => x - mx), dy = ys.map(y => y - my);
          const table = `<table class="data-table"><tr><th>x</th>${xs.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>y</th>${ys.map(v=>`<td>${v}</td>`).join('')}</tr></table>`;
          return {
            questionHtml: `<p>次のデータの $x$ と $y$ の共分散を求めなさい。（$\\bar{x} = ${mx}, \\ \\bar{y} = ${my}$）</p>${table}`,
            instruction: '解答を半角の整数で入力してください。',
            answerForm: { type: 'number', fields: [{ id: 'ans', label: '共分散', allowedKeys: ['0-9', '-'], placeholder: '例: 2' }] },
            answers: { ans: String(cov) },
            correctAnswerTextHtml: `共分散 $= ${cov}$`,
            solutionHtml: `<p>共分散 $= \\frac{1}{n}\\sum(x_i - \\bar{x})(y_i - \\bar{y})$</p><p>${dx.map((d,i)=>'(' + d + ')(' + dy[i] + ')=' + (d*dy[i])).join(', ')}</p><p>共分散 $= \\frac{${dx.map((d,i)=>d*dy[i]).join('+')}}{4} = ${cov}$</p>`
          };
        }
      }
    }
  };

  // ==========================================
  // 公開インターフェース
  // ==========================================
  return {
    /**
     * 指定章・節・難易度の問題を1問生成して返す。
     * 生成器が存在しない場合はnullを返す。
     */
    generate: function(chapterId, sectionId, difficulty) {
      try {
        const gen = generators[chapterId]?.[sectionId]?.[difficulty];
        if (!gen) return null;
        return gen();
      } catch (e) {
        console.warn('AI問題生成エラー:', e);
        return null;
      }
    },

    /** 指定した章・節・難易度の生成器が存在するか確認する */
    hasGenerator: function(chapterId, sectionId, difficulty) {
      return !!(generators[chapterId]?.[sectionId]?.[difficulty]);
    }
  };

})();
