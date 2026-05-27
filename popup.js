const checkboxes = document.querySelectorAll('.modifier-option input[type="checkbox"]');
const currentModeEl = document.getElementById('currentMode');
const statusEl = document.getElementById('status');

const STORAGE_KEY = 'showweb_modifiers';

const loadSettings = () => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const saved = result[STORAGE_KEY];
    if (saved) {
      checkboxes.forEach(cb => {
        cb.checked = saved.includes(cb.value);
      });
    }
    updateCurrentMode();
  });
};

const saveSettings = () => {
  const active = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      active.push(cb.value);
    }
  });

  if (active.length === 0) {
    statusEl.textContent = '至少需要选择一个修饰键';
    statusEl.style.color = '#ff5252';
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEY]: active }, () => {
    statusEl.textContent = '设置已保存';
    statusEl.style.color = '#4CAF50';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 2000);
  });

  updateCurrentMode();
};

const updateCurrentMode = () => {
  const active = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      active.push(cb.value.charAt(0).toUpperCase() + cb.value.slice(1));
    }
  });

  if (active.length === 0) {
    currentModeEl.textContent = '当前激活方式: 未选择 (请至少选择一个)';
    currentModeEl.style.color = '#ff5252';
  } else {
    currentModeEl.textContent = `当前激活方式: ${active.join(' + ')} + 点击`;
    currentModeEl.style.color = '#4CAF50';
  }
};

checkboxes.forEach(cb => {
  cb.addEventListener('change', saveSettings);
});

loadSettings();
