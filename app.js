/**
 * 高校数学Ⅰ 個別最適化学習Webアプリケーション (app.js)
 * UI制御、動的入力フォームの構築、カスタムテンキーの連動、KaTeXの動的適用
 */

document.addEventListener("DOMContentLoaded", function() {
  
  // ==========================================
  // 1. アプリケーションの状態管理 (State)
  // ==========================================
  const state = {
    currentChapter: "",
    currentSection: "",
    currentDifficulty: "",
    currentProblem: null,
    activeInput: null, // 現在フォーカスされている入力要素
    theme: "light"     // デフォルトテーマ
  };

  // ==========================================
  // 2. DOM要素の取得
  // ==========================================
  const elements = {
    body: document.body,
    
    // テーマボタン
    btnThemeLight: document.getElementById("btn-theme-light"),
    btnThemeDark: document.getElementById("btn-theme-dark"),
    btnThemeContrast: document.getElementById("btn-theme-contrast"),
    
    // パネル
    selectionPanel: document.getElementById("selection-panel"),
    sectionContainer: document.getElementById("section-selection-container"),
    difficultyContainer: document.getElementById("difficulty-selection-container"),
    workspacePanel: document.getElementById("workspace-panel"),
    resultPanel: document.getElementById("result-panel"),
    solutionPanel: document.getElementById("solution-panel"),
    
    // 進捗表示要素
    totalProgressPanel: document.getElementById("total-progress-panel"),
    totalProgressPercent: document.getElementById("total-progress-percent"),
    totalProgressFill: document.getElementById("total-progress-fill"),
    totalProgressMeta: document.getElementById("total-progress-meta"),
    
    // メニュー選択要素
    chapterButtons: document.getElementById("chapter-buttons"),
    sectionSelect: document.getElementById("section-select"),
    
    // 難易度ボタン
    diffBasic: document.getElementById("diff-basic"),
    diffStandard: document.getElementById("diff-standard"),
    diffAdvanced: document.getElementById("diff-advanced"),
    
    // 問題表示エリア
    currentChapterName: document.getElementById("current-chapter-name"),
    currentSectionName: document.getElementById("current-section-name"),
    currentDifficultyTag: document.getElementById("current-difficulty-tag"),
    problemTextArea: document.getElementById("problem-text-area"),
    problemInstructionArea: document.getElementById("problem-instruction-area"),
    dynamicInputArea: document.getElementById("dynamic-input-area"),
    
    // 操作ボタン
    btnCheckAnswer: document.getElementById("btn-check-answer"),
    btnNextProblem: document.getElementById("btn-next-problem"),
    btnBackToMenu: document.getElementById("btn-back-to-menu"),
    
    // カスタムテンキー
    customTenkey: document.getElementById("custom-tenkey"),
    btnCloseTenkey: document.getElementById("btn-close-tenkey"),
    btnTenkeyConfirm: document.getElementById("btn-tenkey-confirm"),
    tenkeyTargetLabel: document.getElementById("tenkey-target-label"),
    tenkeySpacer: document.getElementById("tenkey-spacer"),
    
    // 解説エリア
    solutionContentArea: document.getElementById("solution-content-area"),

    // 苦手分析パネル
    btnOpenAnalytics: document.getElementById("btn-open-analytics"),
    btnCloseAnalytics: document.getElementById("btn-close-analytics"),
    analyticsPanel: document.getElementById("analytics-panel"),
    analyticsDashboard: document.getElementById("analytics-dashboard-content"),
    analyticsBadge: document.getElementById("analytics-badge")
  };

  // ==========================================
  // 3. 数式レンダリング（KaTeX）の設定
  // ==========================================
  function renderMath() {
    if (typeof renderMathInElement === "function") {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    } else {
      // KaTeXのロードが遅れた場合の再トライ
      setTimeout(renderMath, 100);
    }
  }

  // ==========================================
  // 4. カラーテーマ制御 (UD)
  // ==========================================
  function setTheme(themeName) {
    state.theme = themeName;
    elements.body.className = `theme-${themeName}`;
    
    // ボタンのaria-checkedとactiveクラスを更新
    const buttons = [elements.btnThemeLight, elements.btnThemeDark, elements.btnThemeContrast];
    buttons.forEach(btn => {
      const isCurrent = btn.dataset.theme === themeName;
      btn.setAttribute("aria-checked", isCurrent ? "true" : "false");
      if (isCurrent) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    
    localStorage.setItem("math_app_theme", themeName);
  }

  // 保存されたテーマの復元
  const savedTheme = localStorage.getItem("math_app_theme");
  if (savedTheme) {
    setTheme(savedTheme);
  }

  // テーマ切り替えイベント
  [elements.btnThemeLight, elements.btnThemeDark, elements.btnThemeContrast].forEach(btn => {
    btn.addEventListener("click", () => {
      setTheme(btn.dataset.theme);
    });
  });

  // ==========================================
  // 4.5. 学習進捗管理システム (LocalStorage)
  // ==========================================
  
  // LocalStorageから進捗情報を取得
  function getProgress() {
    const progressStr = localStorage.getItem("math_app_progress");
    try {
      return progressStr ? JSON.parse(progressStr) : {};
    } catch (e) {
      console.error("進捗データの読み込みエラー", e);
      return {};
    }
  }

  // LocalStorageに進捗情報を保存
  function saveProgress(progress) {
    localStorage.setItem("math_app_progress", JSON.stringify(progress));
  }

  // 単元をクリア済みにマークする
  function markComplete(chapterId, sectionId, difficulty) {
    const progress = getProgress();
    const key = `${chapterId}-${sectionId}-${difficulty}`;
    if (!progress[key]) {
      progress[key] = true;
      saveProgress(progress);
      
      // 動的UIの更新
      updateProgressDisplay();
      initMenu(); // 章ボタンの進捗パーセントを再描画
      
      // 難易度ボタンのクリア状況も再描画
      updateDifficultyButtonsProgress();
    }
  }

  // 指定した章の中でのクリア済み単元数をカウント
  function getChapterCompletedCount(chapterId) {
    const progress = getProgress();
    const structure = MathProblems.getStructure();
    const sections = structure[chapterId].sections;
    let completed = 0;
    
    Object.keys(sections).forEach(sectionId => {
      ["basic", "standard", "advanced"].forEach(diff => {
        const key = `${chapterId}-${sectionId}-${diff}`;
        if (progress[key]) {
          completed++;
        }
      });
    });
    return completed;
  }

  // 全体の進捗状況を計算・描画更新する
  function updateProgressDisplay() {
    const progress = getProgress();
    const structure = MathProblems.getStructure();
    
    let totalUnits = 0; // 全単元数 (4章 * 9節合計 * 3難易度 = 27)
    let completedUnits = 0;
    
    Object.keys(structure).forEach(chapterId => {
      const sections = structure[chapterId].sections;
      Object.keys(sections).forEach(sectionId => {
        ["basic", "standard", "advanced"].forEach(diff => {
          totalUnits++;
          const key = `${chapterId}-${sectionId}-${diff}`;
          if (progress[key]) {
            completedUnits++;
          }
        });
      });
    });
    
    const percent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
    
    // UI反映
    if (elements.totalProgressPercent) {
      elements.totalProgressPercent.textContent = `${percent}%`;
    }
    if (elements.totalProgressFill) {
      elements.totalProgressFill.style.width = `${percent}%`;
    }
    if (elements.totalProgressMeta) {
      elements.totalProgressMeta.textContent = `全 ${totalUnits} 単元中、 ${completedUnits} 単元をクリアしました！`;
    }
  }

  // ==========================================
  // 5. ナビゲーションメニューの動的構築
  // ==========================================
  function initMenu() {
    const structure = MathProblems.getStructure();
    elements.chapterButtons.innerHTML = "";
    
    // 章ボタンの生成
    Object.keys(structure).forEach(chapterId => {
      const chapterData = structure[chapterId];
      const btn = document.createElement("button");
      btn.className = "nav-btn";
      btn.role = "radio";
      btn.setAttribute("aria-checked", state.currentChapter === chapterId ? "true" : "false");
      if (state.currentChapter === chapterId) {
        btn.classList.add("selected");
      }
      
      // 章ごとの進捗率を計算 (節の数 * 難易度の数=3)
      const totalUnits = Object.keys(chapterData.sections).length * 3;
      const completedUnits = getChapterCompletedCount(chapterId);
      const percent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
      
      btn.innerHTML = `
        <div class="chapter-btn-content">
          <div class="chapter-btn-title-row">
            <span class="chapter-name">${chapterData.name}</span>
            <span class="chapter-percent-badge">${percent}%</span>
          </div>
          <div class="chapter-mini-progress">
            <div class="chapter-mini-progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
        <span style="font-size: 1.2rem; margin-left: 8px;">➔</span>
      `;
      btn.dataset.chapter = chapterId;
      
      btn.addEventListener("click", () => {
        selectChapter(chapterId, btn);
      });
      
      elements.chapterButtons.appendChild(btn);
    });
  }

  function selectChapter(chapterId, buttonEl) {
    state.currentChapter = chapterId;
    
    // ボタンのアクティブ状態更新
    Array.from(elements.chapterButtons.children).forEach(btn => {
      btn.classList.remove("selected");
      btn.setAttribute("aria-checked", "false");
    });
    buttonEl.classList.add("selected");
    buttonEl.setAttribute("aria-checked", "true");
    
    // 節選択の構築
    const structure = MathProblems.getStructure();
    const sections = structure[chapterId].sections;
    
    const sectionKeys = Object.keys(sections);
    elements.sectionSelect.innerHTML = '';
    // 節が複数ある場合はプレースホルダーを追加
    if (sectionKeys.length > 1) {
      const placeholder = document.createElement("option");
      placeholder.value = '';
      placeholder.textContent = '節を選択してください...';
      elements.sectionSelect.appendChild(placeholder);
    }
    sectionKeys.forEach(sectionId => {
      const option = document.createElement("option");
      option.value = sectionId;
      option.textContent = sections[sectionId];
      elements.sectionSelect.appendChild(option);
    });
    
    // 表示のアニメーション
    elements.sectionContainer.style.display = "block";
    elements.sectionContainer.style.animation = "fadeIn 0.3s ease-out";
    
    // 難易度は一度リセット
    elements.difficultyContainer.style.display = "none";
    resetDifficultyButtons();
    
    // 節が1つなら自動選択、複数なら最初の節を自動で選択して難易度を展開
    if (sectionKeys.length === 1) {
      elements.sectionSelect.value = sectionKeys[0];
      elements.sectionSelect.dispatchEvent(new Event('change'));
    } else {
      // 最初の節を自動選択
      elements.sectionSelect.value = sectionKeys[0];
      elements.sectionSelect.dispatchEvent(new Event('change'));
    }
    
    // スクロール調整
    setTimeout(() => {
      elements.sectionContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  // 節のドロップダウン変更時
  elements.sectionSelect.addEventListener("change", (e) => {
    state.currentSection = e.target.value;
    if (state.currentSection) {
      elements.difficultyContainer.style.display = "block";
      elements.difficultyContainer.style.animation = "fadeIn 0.3s ease-out";
      resetDifficultyButtons();
      
      elements.difficultyContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      elements.difficultyContainer.style.display = "none";
    }
  });

  // 難易度ボタンのクリア状況表示を更新する
  function updateDifficultyButtonsProgress() {
    if (!state.currentChapter || !state.currentSection) {
      // 選択されていない場合はデフォルトに戻す
      const diffs = { "basic": "基本", "standard": "標準", "advanced": "応用" };
      [elements.diffBasic, elements.diffStandard, elements.diffAdvanced].forEach(btn => {
        if (!btn) return;
        const diff = btn.dataset.diff;
        btn.classList.remove("completed-task");
        btn.innerHTML = `<span>${diffs[diff]}</span>`;
      });
      return;
    }
    
    const progress = getProgress();
    const difficulties = ["basic", "standard", "advanced"];
    const buttons = {
      "basic": elements.diffBasic,
      "standard": elements.diffStandard,
      "advanced": elements.diffAdvanced
    };
    
    difficulties.forEach(diff => {
      const btn = buttons[diff];
      if (!btn) return;
      
      const key = `${state.currentChapter}-${state.currentSection}-${diff}`;
      const isCompleted = !!progress[key];
      
      // 元の難易度の和名
      const diffNames = { "basic": "基本", "standard": "標準", "advanced": "応用" };
      const baseName = diffNames[diff];
      
      if (isCompleted) {
        btn.classList.add("completed-task");
        btn.innerHTML = `<span>${baseName} ✓ クリア済</span>`;
      } else {
        btn.classList.remove("completed-task");
        btn.innerHTML = `<span>${baseName}</span>`;
      }
    });
  }

  function resetDifficultyButtons() {
    state.currentDifficulty = "";
    [elements.diffBasic, elements.diffStandard, elements.diffAdvanced].forEach(btn => {
      btn.classList.remove("selected");
      btn.setAttribute("aria-checked", "false");
    });
    updateDifficultyButtonsProgress();
  }

  // 難易度ボタンの選択イベント
  [elements.diffBasic, elements.diffStandard, elements.diffAdvanced].forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentDifficulty = btn.dataset.diff;
      
      [elements.diffBasic, elements.diffStandard, elements.diffAdvanced].forEach(b => {
        b.classList.remove("selected");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");
      
      // 自動で問題生成画面へ遷移
      setTimeout(startLearning, 300);
    });
  });

  // ==========================================
  // 6. 問題生成 ＆ 画面の初期化
  // ==========================================
  function startLearning() {
    if (!state.currentChapter || !state.currentSection || !state.currentDifficulty) return;
    
    // メニュー非表示、問題エリア表示
    elements.selectionPanel.style.display = "none";
    elements.workspacePanel.style.display = "flex";
    elements.workspacePanel.style.animation = "fadeIn 0.4s ease-out";
    
    loadNewProblem();
  }

  function loadNewProblem() {
    // 状態のクリア
    elements.resultPanel.style.display = "none";
    elements.solutionPanel.style.display = "none";
    elements.btnNextProblem.style.display = "none";
    elements.btnCheckAnswer.style.display = "block";
    closeTenkey();
    
    // 問題の生成
    try {
      const problem = MathProblems.generate(state.currentChapter, state.currentSection, state.currentDifficulty);
      state.currentProblem = problem;
      
      // メタ情報表示
      const structure = MathProblems.getStructure();
      elements.currentChapterName.textContent = structure[state.currentChapter].name;
      elements.currentSectionName.textContent = structure[state.currentChapter].sections[state.currentSection];
      
      // 難易度タグ
      const diffLabels = { "basic": "基本", "standard": "標準", "advanced": "応用" };
      elements.currentDifficultyTag.textContent = diffLabels[state.currentDifficulty];
      elements.currentDifficultyTag.className = `difficulty-tag ${state.currentDifficulty}`;
      
      // 問題文と指示
      elements.problemTextArea.innerHTML = problem.questionHtml;
      elements.problemInstructionArea.innerHTML = problem.instruction;
      
      // 動的解答フォームの生成
      buildAnswerForm(problem);
      
      // 数式レンダリングの適用
      setTimeout(renderMath, 0);

      // 問題に図・グラフがある場合はCanvasを生成して描画
      const existingCanvas = document.getElementById('problem-canvas');
      if (existingCanvas) existingCanvas.parentElement.removeChild(existingCanvas);
      if (typeof problem.drawCanvas === 'function') {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'canvas-container';
        const canvas = document.createElement('canvas');
        canvas.id = 'problem-canvas';
        canvas.width = 320;
        canvas.height = 200;
        canvas.setAttribute('aria-label', '問題の図・グラフ');
        canvasWrapper.appendChild(canvas);
        elements.problemTextArea.appendChild(canvasWrapper);
        // 描画は少し遅らせてレンダリング完了待ち
        setTimeout(() => { problem.drawCanvas(canvas); }, 50);
      }
      
      // 最初の入力欄に自動フォーカス（タブレットでのテンキー自動立ち上げ）
      const firstInput = elements.dynamicInputArea.querySelector("input.math-input, select.math-select");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 200);
      }
      
      // 画面上部へスクロール
      window.scrollTo({ top: 0, behavior: "smooth" });
      
    } catch (error) {
      console.error(error);
      alert("問題の生成中にエラーが発生しました。メニューに戻ります。");
      backToMenu();
    }
  }

  // 解答入力欄の構築
  function buildAnswerForm(problem) {
    elements.dynamicInputArea.innerHTML = "";
    
    if (problem.answerForm.type === "choice") {
      // 選択肢問題（4択など）
      const container = document.createElement("div");
      container.className = "choice-container";
      
      // 隠しinput（値保持用）
      const hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.id = "ans_choice_value";
      hiddenInput.className = "math-input"; // 判定ロジックが見つけるためのクラス
      container.appendChild(hiddenInput);
      
      problem.answerForm.options.forEach(optionText => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.innerHTML = `$ ${optionText} $`;
        
        btn.addEventListener("click", () => {
          // 選択状態の更新
          Array.from(container.querySelectorAll(".choice-btn")).forEach(b => {
            b.classList.remove("selected");
          });
          btn.classList.add("selected");
          hiddenInput.value = optionText;
          
          // タッチフィードバックおよび答え合わせへの即時誘導
          hiddenInput.dispatchEvent(new Event("change"));
        });
        container.appendChild(btn);
      });
      
      elements.dynamicInputArea.appendChild(container);
      
    } else if (problem.answerForm.type === "number") {
      // 単一の数値入力
      const field = problem.answerForm.fields[0];
      const input = document.createElement("input");
      input.type = "text";
      input.id = field.id;
      input.className = "math-input long-input";
      input.inputMode = "none"; // デフォルトキーボードを完全に抑止
      input.placeholder = field.placeholder || "解答を数値で入力";
      input.setAttribute("aria-label", field.label);
      input.dataset.allowed = field.allowedKeys.join(",");
      
      elements.dynamicInputArea.appendChild(input);
      
    } else if (problem.answerForm.type === "custom") {
      // 複雑なレイアウト（分数、根号、複数入力）はテンプレートHTMLを挿入
      elements.dynamicInputArea.innerHTML = problem.answerForm.html;
      
      // 生成されたすべてのinputに入力抑止を設定
      const inputs = elements.dynamicInputArea.querySelectorAll("input.math-input");
      inputs.forEach(input => {
        input.inputMode = "none"; // 標準キーボード抑止
        
        // 許可されたキーの情報を付与
        const fieldConfig = problem.answerForm.fields.find(f => f.id === input.id);
        if (fieldConfig) {
          input.dataset.allowed = fieldConfig.allowedKeys.join(",");
        }
      });
    }
    
    // 入力要素へのイベント割り当て
    setupInputEvents();
  }

  // ==========================================
  // 7. カスタムテンキー制御 ＆ 連動
  // ==========================================
  function setupInputEvents() {
    const inputs = elements.dynamicInputArea.querySelectorAll("input.math-input");
    
    inputs.forEach(input => {
      // フォーカス時にテンキーを開く
      input.addEventListener("focus", () => {
        state.activeInput = input;
        openTenkey(input);
      });
      
      // タップ時にも確実にフォーカス＆テンキー起動
      input.addEventListener("click", () => {
        state.activeInput = input;
        openTenkey(input);
      });
    });
    
    // 選択肢問題用の変更検知
    const choiceValueInput = document.getElementById("ans_choice_value");
    if (choiceValueInput) {
      choiceValueInput.addEventListener("change", () => {
        // 選択されたらテンキーは閉じる
        closeTenkey();
      });
    }
  }

  // テンキーを表示する
  function openTenkey(activeInputElement) {
    elements.customTenkey.classList.add("open");
    elements.body.classList.add("tenkey-active");
    elements.customTenkey.setAttribute("aria-hidden", "false");
    
    // ラベルの更新（何を入力しているか伝える）
    const labelText = activeInputElement.getAttribute("aria-label") || "解答入力";
    elements.tenkeyTargetLabel.textContent = `入力中： ${labelText}`;
    
    // 許可されたキー以外のテンキーボタンを無効化（UD誤入力防止）
    const allowedStr = activeInputElement.dataset.allowed || "";
    const allowedKeys = allowedStr.split(",");
    
    const keyButtons = elements.customTenkey.querySelectorAll(".key-btn[data-key]");
    keyButtons.forEach(btn => {
      const keyVal = btn.dataset.key;
      
      // 特殊キーは常に有効
      if (keyVal === "backspace" || keyVal === "clear" || keyVal === "next") {
        btn.disabled = false;
        return;
      }
      
      // 0-9の判定
      if (allowedKeys.includes("0-9") && !isNaN(keyVal)) {
        btn.disabled = false;
        return;
      }
      
      // その他のキーの個別判定
      if (allowedKeys.includes(keyVal)) {
        btn.disabled = false;
      } else {
        btn.disabled = true;
      }
    });
    
    // フォーカスされた入力欄が見えるようにスクロール
    setTimeout(() => {
      activeInputElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }

  // テンキーを閉じる
  function closeTenkey() {
    elements.customTenkey.classList.remove("open");
    elements.body.classList.remove("tenkey-active");
    elements.customTenkey.setAttribute("aria-hidden", "true");
    state.activeInput = null;
  }

  elements.btnCloseTenkey.addEventListener("click", closeTenkey);

  // テンキーのボタンクリック処理
  elements.customTenkey.querySelectorAll(".key-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      // 答え合わせボタンの場合は特殊処理
      if (btn.id === "btn-tenkey-confirm") {
        checkAnswer();
        return;
      }
      
      const key = btn.dataset.key;
      const input = state.activeInput;
      if (!input) return;
      
      // 現在のテキスト・カーソル位置
      const val = input.value;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      
      if (key === "backspace") {
        // 1文字消去
        if (start === end && start > 0) {
          input.value = val.substring(0, start - 1) + val.substring(end);
          input.setSelectionRange(start - 1, start - 1);
        } else {
          input.value = val.substring(0, start) + val.substring(end);
          input.setSelectionRange(start, start);
        }
      } else if (key === "clear") {
        // すべて消去
        input.value = "";
      } else if (key === "next") {
        // 次の入力フィールドへフォーカス移動
        focusNextInput();
      } else {
        // 文字入力 (数字、マイナス、カンマ、ドットなど)
        input.value = val.substring(0, start) + key + val.substring(end);
        const newPos = start + key.length;
        input.setSelectionRange(newPos, newPos);
      }
      
      // inputイベントを手動発火させて値の変化を通知
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
  });

  // 次のインプットにフォーカスを移す
  function focusNextInput() {
    const inputs = Array.from(elements.dynamicInputArea.querySelectorAll("input.math-input, select.math-select"));
    const currentIndex = inputs.indexOf(state.activeInput);
    
    if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
      inputs[currentIndex + 1].focus();
    } else {
      // 最後ならフォーカスを外してテンキーを閉じる
      closeTenkey();
    }
  }

  // ==========================================
  // 8. 答え合わせ・解説表示
  // ==========================================
  function checkAnswer() {
    if (!state.currentProblem) return;
    
    // 入力データの収集
    const inputs = {};
    let hasEmpty = false;
    
    // 選択肢問題の場合
    const choiceValueInput = document.getElementById("ans_choice_value");
    if (choiceValueInput) {
      inputs.ans = choiceValueInput.value;
      if (!inputs.ans) hasEmpty = true;
    } else {
      // 記述式テキストボックスの場合
      const inputElements = elements.dynamicInputArea.querySelectorAll("input.math-input, select.math-select");
      inputElements.forEach(el => {
        inputs[el.id] = el.value.trim();
        if (!inputs[el.id]) {
          hasEmpty = true;
          el.style.borderColor = "var(--incorrect-border)"; // 空欄強調
        } else {
          el.style.borderColor = "var(--border)";
        }
      });
    }
    
    // 未入力チェック (UD: わかりやすいエラー表示)
    if (hasEmpty) {
      alert("すべての空欄を入力してください。");
      return;
    }
    
    // テンキーを閉じる
    closeTenkey();
    
    // 正誤判定
    const isCorrect = state.currentProblem.checkAnswer(inputs);
    
    // 正解の場合はLocalStorageに進捗を保存
    if (isCorrect) {
      markComplete(state.currentChapter, state.currentSection, state.currentDifficulty);
    }

    // 解答履歴を記録（正誤問わず）
    if (typeof Analytics !== 'undefined') {
      Analytics.record(state.currentChapter, state.currentSection, state.currentDifficulty, isCorrect);
      // 苦手分析バッジを更新
      updateAnalyticsBadge();
    }
    
    // 結果表示の構築 (色だけに頼らないトリプル表現)
    elements.resultPanel.innerHTML = "";
    elements.resultPanel.className = `result-card ${isCorrect ? 'correct' : 'incorrect'}`;
    
    const banner = document.createElement("div");
    banner.className = "result-banner";
    
    const symbol = document.createElement("span");
    symbol.className = "result-symbol";
    symbol.innerHTML = isCorrect ? "💮" : "❌";
    banner.appendChild(symbol);
    
    const text = document.createElement("div");
    text.className = "result-text";
    
    const title = document.createElement("span");
    title.className = "result-title";
    title.textContent = isCorrect ? "正解！素晴らしい！" : "おしい！もう一度解いてみよう";
    text.appendChild(title);
    
    const subtitle = document.createElement("span");
    subtitle.className = "result-subtitle";
    subtitle.textContent = isCorrect ? "完璧な解答です。この調子で進みましょう！" : "間違えた部分を解説で確認して、復習しましょう。";
    text.appendChild(subtitle);
    
    banner.appendChild(text);
    elements.resultPanel.appendChild(banner);
    
    // 正解の数式表示エリア
    const correctAnswerBox = document.createElement("div");
    correctAnswerBox.className = "result-correct-answer";
    correctAnswerBox.innerHTML = `
      <strong>【正しい答え】</strong>
      <div>${state.currentProblem.correctAnswerTextHtml}</div>
    `;
    elements.resultPanel.appendChild(correctAnswerBox);
    
    // 結果パネルを表示
    elements.resultPanel.style.display = "flex";
    elements.resultPanel.style.animation = "fadeIn 0.3s ease-out";
    
    // 解説パネルの表示
    elements.solutionContentArea.innerHTML = state.currentProblem.solutionHtml;
    elements.solutionPanel.style.display = "block";
    elements.solutionPanel.style.animation = "slideUp 0.5s ease-out";
    
    // ボタンの切り替え
    elements.btnCheckAnswer.style.display = "none";
    elements.btnNextProblem.style.display = "block";
    
    // 数式の再レンダリング
    setTimeout(renderMath, 0);
    
    // 結果までスクロール
    setTimeout(() => {
      elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // イベント登録
  elements.btnCheckAnswer.addEventListener("click", checkAnswer);
  
  // 次の問題ボタン
  elements.btnNextProblem.addEventListener("click", loadNewProblem);

  // ==========================================
  // 9. メニュー遷移制御
  // ==========================================
  function backToMenu() {
    closeTenkey();
    elements.workspacePanel.style.display = "none";
    elements.resultPanel.style.display = "none";
    elements.solutionPanel.style.display = "none";
    
    // メニュー選択状態の維持またはリセット
    elements.selectionPanel.style.display = "block";
    elements.selectionPanel.style.animation = "fadeIn 0.4s ease-out";
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  elements.btnBackToMenu.addEventListener("click", backToMenu);

  // ==========================================
  // 11. 苦手分析パネル制御
  // ==========================================

  /** 苦手分析バッジ（約く（！マーク）の更新 */
  function updateAnalyticsBadge() {
    if (!elements.analyticsBadge || typeof Analytics === 'undefined') return;
    const weakCount = Analytics.getWeakAreas().length;
    if (weakCount > 0) {
      elements.analyticsBadge.textContent = `${weakCount}単元要複習`;
      elements.analyticsBadge.style.display = 'inline-block';
    } else {
      elements.analyticsBadge.style.display = 'none';
    }
  }

  /** 苦手分析パネルを開く */
  function openAnalyticsPanel() {
    if (!elements.analyticsPanel) return;
    elements.selectionPanel.style.display = 'none';
    elements.analyticsPanel.style.display = 'block';
    elements.analyticsPanel.style.animation = 'fadeIn 0.4s ease-out';

    // ダッシュボードを描画
    if (typeof Analytics !== 'undefined') {
      Analytics.renderDashboard(
        elements.analyticsDashboard,
        MathProblems.getStructure(),
        function(chapterId, sectionId, difficulty) {
          // 苦手単元にジャンプ
          closeAnalyticsPanel();
          state.currentChapter = chapterId;
          state.currentSection = sectionId;
          state.currentDifficulty = difficulty;
          startLearning();
        }
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** 苦手分析パネルを閉じる */
  function closeAnalyticsPanel() {
    if (!elements.analyticsPanel) return;
    elements.analyticsPanel.style.display = 'none';
    elements.selectionPanel.style.display = 'block';
    elements.selectionPanel.style.animation = 'fadeIn 0.3s ease-out';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 苦手分析ボタンのイベント
  if (elements.btnOpenAnalytics) {
    elements.btnOpenAnalytics.addEventListener('click', openAnalyticsPanel);
  }
  if (elements.btnCloseAnalytics) {
    elements.btnCloseAnalytics.addEventListener('click', closeAnalyticsPanel);
  }

  // ==========================================
  // 12. 初期起動
  // ==========================================
  initMenu();
  updateProgressDisplay(); // 全体進捗の初期描画
  updateAnalyticsBadge();  // 苦手分析バッジの初期描画
  renderMath();

});
