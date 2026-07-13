/**
 * 苦手範囲分析システム (analytics.js)
 * 解答履歴をLocalStorageに記録し、単元ごとの正答率を分析・可視化します。
 */

const Analytics = (function() {

  const HISTORY_KEY = 'math_app_history';

  // ==========================================
  // LocalStorage ヘルパー
  // ==========================================

  /** 解答履歴をLocalStorageから取得 */
  function getHistory() {
    try {
      const str = localStorage.getItem(HISTORY_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      console.warn('履歴の読み込みエラー:', e);
      return [];
    }
  }

  /** 解答履歴をLocalStorageに保存 */
  function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  // ==========================================
  // 公開インターフェース
  // ==========================================

  return {

    /**
     * 解答結果を履歴に記録する
     * @param {string} chapterId - 章ID
     * @param {string} sectionId - 節ID
     * @param {string} difficulty - 難易度 ('basic' | 'standard' | 'advanced')
     * @param {boolean} isCorrect - 正解かどうか
     */
    record: function(chapterId, sectionId, difficulty, isCorrect) {
      const history = getHistory();
      history.push({
        chapterId,
        sectionId,
        difficulty,
        isCorrect,
        timestamp: Date.now()
      });
      // 最新500件のみ保持（ストレージ節約）
      if (history.length > 500) history.splice(0, history.length - 500);
      saveHistory(history);
    },

    /**
     * 単元ごとの正答率レポートを生成
     * @returns {Object} key: "chapterId-sectionId-difficulty" → {total, correct, accuracy, ...}
     */
    getReport: function() {
      const history = getHistory();
      const report = {};
      history.forEach(item => {
        const key = `${item.chapterId}-${item.sectionId}-${item.difficulty}`;
        if (!report[key]) {
          report[key] = {
            total: 0,
            correct: 0,
            chapterId: item.chapterId,
            sectionId: item.sectionId,
            difficulty: item.difficulty
          };
        }
        report[key].total++;
        if (item.isCorrect) report[key].correct++;
      });
      Object.values(report).forEach(r => {
        r.accuracy = r.total > 0 ? Math.round((r.correct / r.total) * 100) : null;
      });
      return report;
    },

    /**
     * 正答率60%未満（2問以上解いた）の苦手単元を返す
     * @returns {Array} 苦手単元のリスト（正答率昇順）
     */
    getWeakAreas: function() {
      const report = this.getReport();
      return Object.values(report)
        .filter(r => r.total >= 2 && r.accuracy < 60)
        .sort((a, b) => a.accuracy - b.accuracy);
    },

    /** 解答履歴を全件削除する */
    clearHistory: function() {
      localStorage.removeItem(HISTORY_KEY);
    },

    /** 解答件数を取得 */
    getTotalCount: function() {
      return getHistory().length;
    },

    /**
     * 苦手分析ダッシュボードをHTMLとして描画する
     * @param {HTMLElement} containerEl - 描画先のコンテナ要素
     * @param {Object} structure - MathProblems.getStructure() の戻り値
     * @param {Function} onNavigate - 苦手単元ボタンクリック時のコールバック (chapterId, sectionId, difficulty) => void
     */
    renderDashboard: function(containerEl, structure, onNavigate) {
      const history = getHistory();
      const report = this.getReport();
      const diffLabels = { basic: '基本', standard: '標準', advanced: '応用' };

      // データなし
      if (history.length === 0) {
        containerEl.innerHTML = `
          <div class="analytics-empty">
            <div class="analytics-empty-icon">📝</div>
            <p>まだ学習記録がありません。</p>
            <p>問題を解き始めると、ここに分析結果が表示されます！</p>
          </div>
        `;
        return;
      }

      // 全体正答率
      const totalCorrect = history.filter(h => h.isCorrect).length;
      const overallAcc = Math.round((totalCorrect / history.length) * 100);
      const circleColor = overallAcc >= 80 ? '#10b981' : overallAcc >= 60 ? '#f59e0b' : '#ef4444';
      const circumference = 2 * Math.PI * 40;
      const strokeOffset = circumference * (1 - overallAcc / 100);

      let html = `
        <div class="analytics-overview">
          <div class="accuracy-circle-wrapper">
            <svg viewBox="0 0 100 100" class="accuracy-circle">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="10"/>
              <circle cx="50" cy="50" r="40" fill="none"
                stroke="${circleColor}" stroke-width="10"
                stroke-dasharray="${circumference.toFixed(1)}"
                stroke-dashoffset="${strokeOffset.toFixed(1)}"
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
                class="accuracy-arc"/>
              <text x="50" y="47" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--text-primary)">${overallAcc}%</text>
              <text x="50" y="62" text-anchor="middle" font-size="9" fill="var(--text-secondary)">総合正答率</text>
            </svg>
          </div>
          <div class="analytics-stats-grid">
            <div class="stat-card">
              <span class="stat-num">${history.length}</span>
              <span class="stat-label">総解答数</span>
            </div>
            <div class="stat-card">
              <span class="stat-num correct-color">${totalCorrect}</span>
              <span class="stat-label">正解数</span>
            </div>
            <div class="stat-card">
              <span class="stat-num wrong-color">${history.length - totalCorrect}</span>
              <span class="stat-label">不正解数</span>
            </div>
          </div>
        </div>
      `;

      // 章・節ごとの棒グラフ
      html += `<div class="analytics-breakdown">`;
      Object.keys(structure).forEach(chapterId => {
        const chapter = structure[chapterId];
        html += `
          <div class="analytics-chapter-card">
            <div class="analytics-chapter-header">${chapter.name}</div>
        `;
        Object.keys(chapter.sections).forEach(sectionId => {
          const sectionName = chapter.sections[sectionId];
          html += `<div class="analytics-section"><div class="analytics-section-label">${sectionName}</div>`;
          ['basic', 'standard', 'advanced'].forEach(diff => {
            const key = `${chapterId}-${sectionId}-${diff}`;
            const r = report[key];
            if (!r || r.total === 0) {
              html += `
                <div class="analytics-bar-row">
                  <span class="analytics-diff-tag ${diff}">${diffLabels[diff]}</span>
                  <div class="analytics-bar-track"><div class="analytics-bar-fill untouched" style="width:0%"></div></div>
                  <span class="analytics-bar-pct muted">未挑戦</span>
                </div>
              `;
            } else {
              const acc = r.accuracy;
              const barClass = acc >= 80 ? 'good' : acc >= 60 ? 'okay' : 'weak';
              const emoji = acc >= 80 ? '✅' : acc >= 60 ? '🔶' : '🔴';
              html += `
                <div class="analytics-bar-row">
                  <span class="analytics-diff-tag ${diff}">${diffLabels[diff]}</span>
                  <div class="analytics-bar-track">
                    <div class="analytics-bar-fill ${barClass}" style="width:${acc}%"></div>
                  </div>
                  <span class="analytics-bar-pct">${emoji} ${acc}%（${r.correct}/${r.total}）</span>
                </div>
              `;
            }
          });
          html += `</div>`;
        });
        html += `</div>`;
      });
      html += `</div>`;

      // 苦手エリア（要復習）
      const weakAreas = this.getWeakAreas();
      if (weakAreas.length > 0) {
        html += `
          <div class="weak-areas-section">
            <h4 class="weak-areas-title">🔴 重点復習エリア（正答率60%未満）</h4>
            <p class="weak-areas-desc">クリックするとそのユニットの問題に直接ジャンプします</p>
            <div class="weak-areas-list">
        `;
        weakAreas.forEach(r => {
          const chapterName = structure[r.chapterId]?.name || r.chapterId;
          const sectionName = structure[r.chapterId]?.sections[r.sectionId] || r.sectionId;
          html += `
            <button class="weak-area-btn"
              data-chapter="${r.chapterId}"
              data-section="${r.sectionId}"
              data-diff="${r.difficulty}">
              <div class="weak-area-info">
                <span class="weak-area-name">${chapterName} › ${sectionName}</span>
                <span class="weak-area-diff">${diffLabels[r.difficulty]}</span>
              </div>
              <div class="weak-area-right">
                <span class="weak-area-pct">${r.accuracy}%</span>
                <span class="weak-area-count">（${r.correct}/${r.total}）</span>
                <span class="weak-area-arrow">▶</span>
              </div>
            </button>
          `;
        });
        html += `</div></div>`;
      }

      // リセットボタン
      html += `
        <div class="analytics-footer">
          <button class="btn-secondary btn-reset-history" id="btn-clear-history">
            🗑️ 学習記録をリセット
          </button>
        </div>
      `;

      containerEl.innerHTML = html;

      // 苦手単元ボタンのクリックイベント
      containerEl.querySelectorAll('.weak-area-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeof onNavigate === 'function') {
            onNavigate(btn.dataset.chapter, btn.dataset.section, btn.dataset.diff);
          }
        });
      });

      // リセットボタン
      const resetBtn = containerEl.querySelector('#btn-clear-history');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('学習記録と学習進捗をすべてリセットしますか？\nこの操作は取り消せません。')) {
            this.clearHistory();
            localStorage.removeItem('math_app_progress');
            this.renderDashboard(containerEl, structure, onNavigate);
            // index.htmlの進捗UIも即時更新できるようイベント発行
            window.dispatchEvent(new Event('math_app_progress_reset'));
          }
        });
      }
    }
  };

})();
