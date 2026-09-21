(() => {
  const data = window.HAIR_KB;
  const PAGE_SIZE = 24;
  const learnedKey = 'hair-kb-learned-v1';
  let selectedGroup = '';
  let selectedSubtopic = '';
  let query = '';
  let visible = PAGE_SIZE;
  let learned = new Set(JSON.parse(localStorage.getItem(learnedKey) || '[]'));

  const $ = selector => document.querySelector(selector);
  const els = {
    topics: $('#topics'), search: $('#search'), subtopic: $('#subtopic'), cards: $('#cards'),
    more: $('#more'), empty: $('#empty'), random: $('#random'), resultCount: $('#resultCount'),
    title: $('#sectionTitle'), eyebrow: $('#sectionEyebrow'), learnedTop: $('#learnedTop'),
    totalTop: $('#totalTop'), totalCount: $('#totalCount'), template: $('#cardTemplate')
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
    els.learnedTop.textContent = learned.size;
  }

  function buildTopics() {
    const entries = [['', '全部主題', data.total], ...data.groupOrder.map(g => [g,g,data.counts[g]])];
    els.topics.replaceChildren(...entries.map(([value,label,count]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `topic${selectedGroup === value ? ' active' : ''}`;
      button.innerHTML = `<span>${label}</span><b>${count}</b>`;
      button.addEventListener('click', () => {
        selectedGroup = value;
        selectedSubtopic = '';
        visible = PAGE_SIZE;
        buildTopics();
        buildSubtopics();
        render();
        window.scrollTo({top: document.querySelector('.workspace').offsetTop - 78, behavior:'smooth'});
      });
      return button;
    }));
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
    const list = node.querySelector('.options ol');
    q.options.forEach(option => {
      const li = document.createElement('li');
      li.textContent = option;
      if (option === q.answer) li.className = 'correct';
      list.append(li);
    });
    if (!q.options.length) node.querySelector('.options').hidden = true;
    const button = node.querySelector('.learn');
    const sync = () => button.setAttribute('aria-pressed', learned.has(q.id) ? 'true' : 'false');
    sync();
    button.addEventListener('click', () => {
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
    els.cards.replaceChildren(...items.slice(0, visible).map(makeCard));
    els.empty.hidden = items.length !== 0;
    els.more.hidden = items.length <= visible;
    els.more.textContent = `再顯示 ${Math.max(0, Math.min(PAGE_SIZE, items.length - visible))} 張`;
  }

  els.search.addEventListener('input', event => {
    query = event.target.value.trim();
    visible = PAGE_SIZE;
    render();
  });
  els.subtopic.addEventListener('change', event => {
    selectedSubtopic = event.target.value;
    visible = PAGE_SIZE;
    render();
  });
  els.more.addEventListener('click', () => {
    visible += PAGE_SIZE;
    render();
  });
  els.random.addEventListener('click', () => {
    const items = currentItems();
    if (!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    const position = items.findIndex(q => q.id === pick.id);
    visible = Math.max(visible, position + 1);
    render();
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-id="${pick.id}"]`);
      card?.scrollIntoView({behavior:'smooth',block:'center'});
      card?.classList.add('flash');
    });
  });

  buildTopics();
  buildSubtopics();
  updateProgress();
  render();
})();
