let inspectMode = false;
let highlightedElement = null;
let highlightOverlay = null;
let activeModifiers = ['shift', 'alt'];
let settingsLoaded = false;

const STORAGE_KEY = 'showweb_modifiers';

// 加载用户设置
const loadSettings = () => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const saved = result[STORAGE_KEY];
        if (saved && saved.length > 0) {
          activeModifiers = saved;
        }
        settingsLoaded = true;
        resolve();
      });
    } else {
      settingsLoaded = true;
      resolve();
    }
  });
};

// 监听配置变化
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue;
      if (newValue && newValue.length > 0) {
        activeModifiers = newValue;
      }
    }
  });
}

// 检查修饰键是否满足条件
const checkModifiers = (event) => {
  let allMatch = true;
  for (const mod of activeModifiers) {
    if (mod === 'ctrl' && !event.ctrlKey) {
      allMatch = false;
      break;
    }
    if (mod === 'alt' && !event.altKey) {
      allMatch = false;
      break;
    }
    if (mod === 'shift' && !event.shiftKey) {
      allMatch = false;
      break;
    }
  }
  return allMatch;
};

// 创建高亮覆盖层
const createHighlightOverlay = () => {
  const overlay = document.createElement('div');
  overlay.classList.add('inspect-highlight');
  overlay.style.pointerEvents = 'none';
  document.body.appendChild(overlay);
  return overlay;
};

// 更新高亮框位置
const updateHighlight = (element) => {
  if (!element || element === document.body || element === document.documentElement) {
    removeHighlight();
    highlightedElement = null;
    return;
  }

  if (highlightedElement === element) return;

  highlightedElement = element;
  if (!highlightOverlay) {
    highlightOverlay = createHighlightOverlay();
  }

  const rect = element.getBoundingClientRect();
  highlightOverlay.style.display = 'block';
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
};

// 移除高亮框
const removeHighlight = () => {
  if (highlightOverlay) {
    highlightOverlay.style.display = 'none';
  }
  highlightedElement = null;
};

// 获取元素路径
const getElementPath = (element) => {
  const path = [];
  let current = element;

  while (current && current !== document.body && current !== document.documentElement) {
    const tagName = current.tagName.toLowerCase();
    const className = current.className;
    const id = current.id;

    let info = `<${tagName}`;
    if (className && typeof className === 'string') {
      info += ` class="${className}"`;
    }
    if (id) {
      info += ` id="${id}"`;
    }
    info += '>';

    path.unshift(info);
    current = current.parentElement;
  }

  return path.join(' > ');
};

// 显示弹窗
const showDialog = (element, event) => {
  const oldDialog = document.querySelector('.custom-dialog-box');
  if (oldDialog) oldDialog.remove();

  const path = getElementPath(element);
  const content = element.innerText?.trim() || '';

  const dialog = document.createElement('div');
  dialog.classList.add('custom-dialog-box');

  const pathTitle = document.createElement('h3');
  pathTitle.textContent = '路径';
  pathTitle.style.color = '#E66E50';
  dialog.appendChild(pathTitle);

  const codeElement = document.createElement('code');
  codeElement.textContent = path;
  codeElement.style.marginBottom = '20px';
  dialog.appendChild(codeElement);

  const contentTitle = document.createElement('h3');
  contentTitle.textContent = '元素内容';
  contentTitle.style.color = '#E66E50';
  dialog.appendChild(contentTitle);

  const codeContent = document.createElement('code');
  codeContent.textContent = content;
  dialog.appendChild(codeContent);

  // 复制路径按钮
  const copyBtn = document.createElement('button');
  copyBtn.textContent = '复制路径';
  copyBtn.classList.add('copy-btn');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(path).then(() => {
      copyBtn.textContent = '已复制!';
      setTimeout(() => {
        copyBtn.textContent = '复制路径';
      }, 1500);
    });
  });
  dialog.appendChild(copyBtn);

  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.classList.add('close-btn');
  closeBtn.addEventListener('click', () => dialog.remove());
  dialog.appendChild(closeBtn);

  // 定位 - 约束在视口内
  dialog.style.position = 'fixed';
  dialog.style.zIndex = '10000';

  // 拖拽
  let isDragging = false;
  let offsetX, offsetY;

  dialog.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'CODE' || e.target.tagName === 'BUTTON') return;
    isDragging = true;
    const rect = dialog.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      dialog.style.left = `${e.clientX - offsetX}px`;
      dialog.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  document.body.appendChild(dialog);

  // 计算约束位置
  const dialogRect = dialog.getBoundingClientRect();
  let x = event.clientX + 20;
  let y = event.clientY + 20;
  if (x + dialogRect.width > window.innerWidth) {
    x = window.innerWidth - dialogRect.width - 10;
  }
  if (y + dialogRect.height > window.innerHeight) {
    y = window.innerHeight - dialogRect.height - 10;
  }
  if (x < 10) x = 10;
  if (y < 10) y = 10;
  dialog.style.left = `${x}px`;
  dialog.style.top = `${y}px`;
};

// 键盘事件 - 检测修饰键组合
document.addEventListener('keydown', (e) => {
  if (!settingsLoaded || inspectMode) return;
  if (checkModifiers(e)) {
    inspectMode = true;
    document.body.classList.add('inspect-mode-active');
  }
});

document.addEventListener('keyup', (e) => {
  if (!checkModifiers(e)) {
    inspectMode = false;
    document.body.classList.remove('inspect-mode-active');
    removeHighlight();
  }
});

// 窗口失焦或页面隐藏时退出检测模式
const exitInspectMode = () => {
  if (inspectMode) {
    inspectMode = false;
    document.body.classList.remove('inspect-mode-active');
    removeHighlight();
  }
};

window.addEventListener('blur', exitInspectMode);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) exitInspectMode();
});

// 鼠标移动 - 高亮元素
document.addEventListener('mousemove', (e) => {
  if (!inspectMode) return;
  const target = e.target;
  updateHighlight(target);
});

// 点击事件 - 显示路径
document.addEventListener('click', (e) => {
  if (!inspectMode) return;
  if (!highlightedElement) return;

  e.preventDefault();
  e.stopPropagation();

  showDialog(highlightedElement, e);
  removeHighlight();
}, true);

// 点击弹窗外部关闭弹窗
document.addEventListener('click', (e) => {
  if (inspectMode) return;
  const dialog = document.querySelector('.custom-dialog-box');
  if (dialog && !dialog.contains(e.target)) {
    dialog.remove();
  }
});

// 初始化加载设置
loadSettings();
