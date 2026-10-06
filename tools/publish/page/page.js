// tools/publish/page/page.js

function showError(message, fatal = false) {
  const banner = document.getElementById('error-banner');
  const appContent = document.getElementById('app-content');
  if (banner) {
    banner.textContent = message;
    banner.removeAttribute('hidden');
  }
  if (fatal && appContent) {
    appContent.setAttribute('hidden', '');
  }
}

function clearError() {
  const banner = document.getElementById('error-banner');
  if (banner) {
    banner.textContent = '';
    banner.setAttribute('hidden', '');
  }
}

function markButtonCopied(btn, text) {
  if (!btn) return;
  btn.textContent = text;
  btn.classList.add('copied');
}

function extractPlainText(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.innerText || '';
  } catch {
    return html;
  }
}

async function copyHtmlAndText(html, btn, successText = '✓ 已复制全文') {
  clearError();
  const plainText = extractPlainText(html);
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
    markButtonCopied(btn, successText);
  } catch (err) {
    showError(`剪贴板写入失败: ${err.message}`, false);
  }
}

function renderWeChat(data) {
  const previewEl = document.getElementById('wechat-preview');
  const copyBtn = document.getElementById('btn-copy-wechat');
  const html = data.wechat?.html || '';

  if (previewEl) {
    previewEl.innerHTML = html;
  }

  if (copyBtn) {
    copyBtn.onclick = () => {
      copyHtmlAndText(html, copyBtn, '✓ 已复制全文');
    };
  }
}

function renderMeta(data, post) {
  const titleEl = document.getElementById('post-title');
  const metaEl = document.getElementById('post-meta');
  if (titleEl) {
    titleEl.textContent = data.title || post;
  }
  document.title = `${data.title || post} - md2platforms 复制页`;

  if (metaEl) {
    metaEl.innerHTML = '';
    const dirSpan = document.createElement('span');
    dirSpan.textContent = `目录: ${post}`;
    metaEl.appendChild(dirSpan);

    if (data.blog_url) {
      const link = document.createElement('a');
      link.href = data.blog_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '查看博客原文';
      metaEl.appendChild(link);
    }
  }
}

async function loadPostData(post) {
  const dataUrl = `../out/${encodeURIComponent(post)}/data.json`;
  let res;
  try {
    res = await fetch(dataUrl);
  } catch (err) {
    showError(`加载失败: 网络错误或跨域问题 (${err.message})`, true);
    return null;
  }

  if (!res.ok) {
    showError(`加载失败: 未找到数据文件 ${dataUrl} (HTTP ${res.status})`, true);
    return null;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    showError(`加载失败: data.json 解析失败 (${err.message})`, true);
    return null;
  }

  if (data.schema !== 'md2platforms/v1') {
    showError(`不支持的 schema: "${data.schema || ''}"，页面仅支持 md2platforms/v1`, true);
    return null;
  }

  return data;
}

async function init() {
  clearError();
  const params = new URLSearchParams(window.location.search);
  const post = params.get('post');

  if (!post || !post.trim()) {
    showError('缺少 post 参数，请在 URL 中指定 ?post=<目录名>', true);
    return;
  }

  const data = await loadPostData(post.trim());
  if (!data) {
    return;
  }

  const appContent = document.getElementById('app-content');
  if (appContent) {
    appContent.removeAttribute('hidden');
  }

  renderMeta(data, post.trim());
  renderWeChat(data);
}

window.addEventListener('DOMContentLoaded', init);
