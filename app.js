(() => {
  const data = window.HAIR_KB;
  const learnedKey = 'hair-kb-learned-v1';
  const checklistKey = 'hair-kb-practical-checklist-v1';
  const checklistGroups = [
    {
      name: '服裝與防護',
      items: [
        { id: 'workwear', name: '工作服或背心式圍裙', qty: '2 件', spec: '白色、黑色各 1 件；染髮時穿黑色，其餘技能穿白色。' },
        { id: 'masks', name: '口罩', qty: '若干', spec: '應試時須遮住口、鼻，建議多備幾片。' },
        { id: 'capes', name: '圍巾', qty: '2 件', spec: '白色、黑色各 1 件。' },
        { id: 'towels', name: '毛巾', qty: '若干', spec: '白色。' },
        { id: 'gloves', name: '手套', qty: '若干雙', spec: '準備足夠替換的數量。' }
      ]
    },
    {
      name: '假髮與架具',
      items: [
        { id: 'mannequins', name: '假髮', qty: '4 個', spec: '燙、整、染髮用 3 個，約 14～15 公分均等長度；剪吹髮用 1 個，未曾修剪。頭皮不得做記號。' },
        { id: 'stand', name: '腳架', qty: '1 個', spec: '確認可穩固固定假髮。' },
        { id: 'head-shells', name: '頭殼', qty: '若干', spec: '依練習與應試需要準備。' },
        { id: 'sprayer', name: '噴水壺', qty: '1 個', spec: '先測試噴頭是否順暢。' }
      ]
    },
    {
      name: '燙髮與整髮',
      items: [
        { id: 'combs', name: '大小髮梳', qty: '若干', spec: '依個人習慣選擇使用。' },
        { id: 'perm-rods', name: '冷燙捲棒', qty: '60 支以上', spec: '藍、綠、紫紅三種顏色。' },
        { id: 'rubber-bands', name: '紅色橡皮圈', qty: '1 包', spec: '檢查彈性並準備足量。' },
        { id: 'perm-paper', name: '冷燙紙', qty: '1 包', spec: '白色。' },
        { id: 'hair-pins', name: '髮夾', qty: '1 包', spec: '黑色。' },
        { id: 'rollers', name: '髮筒', qty: '24 個以上', spec: '直徑約 2.5～3 公分。' },
        { id: 'section-clips', name: '鴨嘴夾、鯊魚夾', qty: '若干', spec: '依個人習慣選擇使用。' },
        { id: 'hairspray', name: '整髮用髮膠', qty: '1 罐', spec: '依個人習慣選擇使用。' }
      ]
    },
    {
      name: '染髮',
      items: [
        { id: 'tint-brush', name: '染髮刷', qty: '1 支', spec: '染髮劑由術科測試辦理單位供應。' },
        { id: 'tint-bowl', name: '染髮碗', qty: '1 個', spec: '確認乾淨、無殘留。' }
      ]
    },
    {
      name: '剪吹髮',
      items: [
        { id: 'scissors', name: '剪刀', qty: '1 把', spec: '考前確認刀口與鬆緊度。' },
        { id: 'dryer', name: '吹風機', qty: '1 支', spec: '考前確認電線、開關與風力正常。' }
      ]
    }
  ];
  let selectedGroup = '';
  let selectedSubtopic = '';
  let query = '';
  const attempts = new Map();

  const loadSavedSet = key => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch { return new Set(); }
  };

  let learned = loadSavedSet(learnedKey);
  let checkedTools = loadSavedSet(checklistKey);

  const $ = selector => document.querySelector(selector);
  const els = {
    topics: $('#topics'), search: $('#search'), subtopic: $('#subtopic'), cards: $('#cards'),
    empty: $('#empty'), random: $('#random'), resultCount: $('#resultCount'),
    title: $('#sectionTitle'), eyebrow: $('#sectionEyebrow'), learnedTop: $('#learnedTop'),
    totalTop: $('#totalTop'), totalCount: $('#totalCount'), template: $('#cardTemplate'),
    notesView: $('#notesView'), checklistView: $('#checklistView'), checklistGroups: $('#checklistGroups'),
    checklistDone: $('#checklistDone'), checklistTotal: $('#checklistTotal'),
    checklistProgressBar: $('#checklistProgressBar'), checklistProgressText: $('#checklistProgressText')
  };

  els.totalTop.textContent = data.total;
  els.totalCount.textContent = data.total;

  const normalize = value => value.toLocaleLowerCase('zh-Hant').replace(/\s+/g, '');

  function currentItems() {
    const needle = normalize(query);
    return data.questions.filter(q => {
      if (selectedGroup && q.group !== selectedGroup) return false;
      if (selectedSubtopic && q.subtopic !== selectedSubtopic) return false;
      if (!needle) return true;
      return normalize([q.prompt,q.answer,q.explanation,q.memory,q.group,q.subtopic].join(' ')).includes(needle);
    });
  }

  function updateProgress() {
    const learnedCount = data.questions.reduce((count, q) => count + Number(learned.has(q.id)), 0);
    els.learnedTop.textContent = learnedCount;
    els.topics.querySelectorAll('.topic').forEach(button => {
      const group = button.dataset.group;
      const items = group ? data.questions.filter(q => q.group === group) : data.questions;
      const done = items.reduce((count, q) => count + Number(learned.has(q.id)), 0);
      const percent = items.length ? Math.round(done / items.length * 100) : 0;
      button.querySelector('.topic-count').textContent = `${done}/${items.length}`;
      button.querySelector('.topic-progress i').style.width = `${percent}%`;
      button.querySelector('.topic-progress').setAttribute('aria-label', `${labelForGroup(group)}完成 ${percent}%`);
      button.querySelector('.topic-progress').setAttribute('aria-valuenow', String(percent));
    });
  }

  const labelForGroup = group => group || '全部主題';

  function buildTopics() {
    const entries = [['', '全部主題', data.total], ...data.groupOrder.map(g => [g,g,data.counts[g]])];
    els.topics.replaceChildren(...entries.map(([value,label,count]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `topic${selectedGroup === value ? ' active' : ''}`;
      button.dataset.group = value;
      button.innerHTML = `<span class="topic-row"><span>${label}</span><b class="topic-count">0/${count}</b></span><span class="topic-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></span>`;
      button.addEventListener('click', () => {
        selectedGroup = value;
        selectedSubtopic = '';
        buildTopics();
        buildSubtopics();
        render();
        window.scrollTo({top: document.querySelector('.workspace').offsetTop - 78, behavior:'smooth'});
      });
      return button;
    }));
    updateProgress();
  }

  function setView(view) {
    const showChecklist = view === 'checklist';
    els.notesView.hidden = showChecklist;
    els.checklistView.hidden = !showChecklist;
    document.querySelectorAll('.view-tab').forEach(tab => {
      const active = tab.dataset.view === view;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateChecklistProgress() {
    const ids = checklistGroups.flatMap(group => group.items.map(item => item.id));
    const done = ids.reduce((count, id) => count + Number(checkedTools.has(id)), 0);
    const percent = ids.length ? Math.round(done / ids.length * 100) : 0;
    els.checklistDone.textContent = done;
    els.checklistTotal.textContent = ids.length;
    els.checklistProgressBar.style.width = `${percent}%`;
    els.checklistProgressText.textContent = done === ids.length ? '全部備齊，可以安心應試！' : done ? `已完成 ${percent}%，還差 ${ids.length - done} 項` : '還沒開始準備';
  }

  function buildChecklist() {
    els.checklistGroups.replaceChildren(...checklistGroups.map(group => {
      const section = document.createElement('section');
      section.className = 'checklist-group';
      const heading = document.createElement('h2');
      heading.textContent = group.name;
      const list = document.createElement('div');
      list.className = 'checklist-list';
      group.items.forEach(item => {
        const label = document.createElement('label');
        label.className = 'checklist-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checkedTools.has(item.id);
        const copy = document.createElement('span');
        copy.className = 'checklist-copy';
        copy.innerHTML = `<b>${item.name}</b><small>${item.spec}</small>`;
        const qty = document.createElement('strong');
        qty.textContent = item.qty;
        input.addEventListener('change', () => {
          input.checked ? checkedTools.add(item.id) : checkedTools.delete(item.id);
          localStorage.setItem(checklistKey, JSON.stringify([...checkedTools]));
          label.classList.toggle('checked', input.checked);
          updateChecklistProgress();
        });
        label.classList.toggle('checked', input.checked);
        label.append(input, copy, qty);
        list.append(label);
      });
      section.append(heading, list);
      return section;
    }));
    updateChecklistProgress();
  }

  function buildSubtopics() {
    const base = selectedGroup ? data.questions.filter(q => q.group === selectedGroup) : data.questions;
    const names = [...new Set(base.map(q => q.subtopic))].sort((a,b) => a.localeCompare(b,'zh-Hant'));
    els.subtopic.replaceChildren(new Option('全部小主題',''), ...names.map(name => new Option(name,name)));
    els.subtopic.value = selectedSubtopic;
  }

  function makeCard(q) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.dataset.id = q.id;
    node.querySelector('.pill').textContent = q.subtopic;
    node.querySelector('.source').textContent = `原題：${q.sourceSection} ${q.sourceNumber}`;
    node.querySelector('h3').textContent = q.prompt;
    node.querySelector('.answer b').textContent = q.answer;
    node.querySelector('.explain p').textContent = q.explanation;
    node.querySelector('.memory').textContent = `好記法｜${q.memory}`;
    const optionBox = node.querySelector('.quiz-options');
    const checkButton = node.querySelector('.check-answer');
    const reveal = node.querySelector('.answer-reveal');
    const resultBadge = node.querySelector('.result-badge');
    const retryButton = node.querySelector('.retry');
    const learnButton = node.querySelector('.learn');
    const savedAttempt = attempts.get(q.id) || { selectedIndex: -1, revealed: false };
    let selectedIndex = savedAttempt.selectedIndex;

    q.options.forEach((option, index) => {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `answer-${q.id}`;
      input.value = option;
      input.checked = index === selectedIndex;
      const letter = document.createElement('span');
      letter.className = 'option-letter';
      letter.textContent = String.fromCharCode(65 + index);
      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = option;
      input.addEventListener('change', () => {
        selectedIndex = index;
        attempts.set(q.id, { selectedIndex, revealed: false });
        checkButton.disabled = false;
        optionBox.querySelectorAll('.quiz-option').forEach(item => item.classList.remove('selected'));
        label.classList.add('selected');
      });
      label.classList.toggle('selected', input.checked);
      label.append(input, letter, text);
      optionBox.append(label);
    });

    checkButton.disabled = q.options.length > 0 && selectedIndex < 0;

    if (!q.options.length) {
      optionBox.hidden = true;
      checkButton.disabled = false;
      checkButton.textContent = '查看答案';
    }

    const showAnswer = () => {
      const isCorrect = selectedIndex >= 0 && q.options[selectedIndex] === q.answer;
      attempts.set(q.id, { selectedIndex, revealed: true });
      optionBox.querySelectorAll('.quiz-option').forEach((label, index) => {
        const input = label.querySelector('input');
        input.disabled = true;
        label.classList.toggle('correct', q.options[index] === q.answer);
        label.classList.toggle('wrong', index === selectedIndex && !isCorrect);
      });
      resultBadge.textContent = q.options.length ? (isCorrect ? '答對了' : '再想一下') : '答案揭曉';
      resultBadge.className = `result-badge ${isCorrect ? 'success' : q.options.length ? 'needs-review' : 'neutral'}`;
      reveal.hidden = false;
      checkButton.hidden = true;
      node.classList.add('answered');
    };

    checkButton.addEventListener('click', showAnswer);
    retryButton.addEventListener('click', () => {
      selectedIndex = -1;
      attempts.delete(q.id);
      optionBox.querySelectorAll('.quiz-option').forEach(label => {
        label.classList.remove('selected', 'correct', 'wrong');
        const input = label.querySelector('input');
        input.checked = false;
        input.disabled = false;
      });
      reveal.hidden = true;
      checkButton.hidden = false;
      checkButton.disabled = q.options.length > 0;
      node.classList.remove('answered');
    });

    if (savedAttempt.revealed) showAnswer();

    const sync = () => learnButton.setAttribute('aria-pressed', learned.has(q.id) ? 'true' : 'false');
    sync();
    learnButton.addEventListener('click', () => {
      learned.has(q.id) ? learned.delete(q.id) : learned.add(q.id);
      localStorage.setItem(learnedKey, JSON.stringify([...learned]));
      sync();
      updateProgress();
    });
    return node;
  }

  function render() {
    const items = currentItems();
    els.resultCount.textContent = items.length;
    els.eyebrow.textContent = selectedSubtopic || selectedGroup || '全部主題';
    els.title.textContent = query ? `「${query}」的搜尋結果` : selectedSubtopic || selectedGroup || '全部知識卡';
    els.cards.replaceChildren(...items.map(makeCard));
    els.empty.hidden = items.length !== 0;
  }

  els.search.addEventListener('input', event => {
    query = event.target.value.trim();
    render();
  });
  els.subtopic.addEventListener('change', event => {
    selectedSubtopic = event.target.value;
    render();
  });
  els.random.addEventListener('click', () => {
    const items = currentItems();
    if (!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    render();
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-id="${pick.id}"]`);
      card?.scrollIntoView({behavior:'smooth',block:'center'});
      card?.classList.add('flash');
    });
  });
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });

  buildTopics();
  buildSubtopics();
  buildChecklist();
  updateProgress();
  render();
})();
