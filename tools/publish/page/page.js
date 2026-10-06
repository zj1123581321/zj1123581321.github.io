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

function updateXProgress() {
  const badge = document.getElementById('x-progress');
  if (!badge) return;
  const cards = document.querySelectorAll('#x-segments-list .segment-card');
  const copiedCards = document.querySelectorAll('#x-segments-list .segment-card.copied');
  badge.textContent = `${copiedCards.length} / ${cards.length} 已复制`;
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

async function fetchImageAsPngBlob(imgUrl) {
  const res = await fetch(imgUrl);
  if (!res.ok) {
    throw new Error(`获取图片失败 (HTTP ${res.status}): ${imgUrl}`);
  }
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(pngBlob => {
      if (pngBlob) resolve(pngBlob);
      else reject(new Error('Canvas 转换为 PNG 失败'));
    }, 'image/png');
  });
}

async function copyImage(imgUrl, btn, successText = '✓ 已复制') {
  clearError();
  try {
    const pngBlob = await fetchImageAsPngBlob(imgUrl);
    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    markButtonCopied(btn, successText);
  } catch (err) {
    showError(`图片复制失败: ${err.message}`, false);
  }
}

async function copyTitle(title, btn) {
  clearError();
  try {
    const item = new ClipboardItem({
      'text/plain': new Blob([title], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
    markButtonCopied(btn, '✓ 标题已复制');
  } catch (err) {
    showError(`标题复制失败: ${err.message}`, false);
  }
}

function renderHeaderActions(data, post) {
  const actionsEl = document.getElementById('header-actions');
  if (!actionsEl) return;
  actionsEl.innerHTML = '';

  const titleBtn = document.createElement('button');
  titleBtn.id = 'btn-copy-title';
  titleBtn.className = 'btn btn-secondary';
  titleBtn.type = 'button';
  titleBtn.textContent = '复制标题';
  titleBtn.onclick = () => copyTitle(data.title || '', titleBtn);
  actionsEl.appendChild(titleBtn);

  const coverBtn = document.createElement('button');
  coverBtn.id = 'btn-copy-cover';
  coverBtn.className = 'btn btn-secondary';
  coverBtn.type = 'button';
  if (data.cover) {
    coverBtn.textContent = '复制封面图';
    const coverUrl = `../out/${encodeURIComponent(post)}/${data.cover}`;
    coverBtn.onclick = () => copyImage(coverUrl, coverBtn, '✓ 封面已复制');
  } else {
    coverBtn.textContent = '无封面图';
    coverBtn.disabled = true;
  }
  actionsEl.appendChild(coverBtn);
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

function renderXSegments(data, post) {
  const listEl = document.getElementById('x-segments-list');
  const segments = data.x?.segments || [];
  if (!listEl) return;
  listEl.innerHTML = '';

  segments.forEach((seg, idx) => {
    const segNum = idx + 1;
    const card = document.createElement('div');
    card.className = 'segment-card';
    card.id = `x-segment-${segNum}`;

    const header = document.createElement('div');
    header.className = 'segment-header';

    const indexSpan = document.createElement('span');
    indexSpan.className = 'segment-index';
    indexSpan.textContent = `第 ${segNum} 段 · ${seg.kind === 'image' ? '图片' : '富文本'}`;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary btn-copy-segment';
    copyBtn.type = 'button';
    copyBtn.textContent = `复制第 ${segNum} 段`;

    const body = document.createElement('div');
    body.className = 'segment-body';

    if (seg.kind === 'html') {
      body.innerHTML = seg.html || '';
      copyBtn.onclick = async () => {
        await copyHtmlAndText(seg.html || '', copyBtn, `✓ 第 ${segNum} 段已复制`);
        card.classList.add('copied');
        updateXProgress();
      };
    } else if (seg.kind === 'image') {
      const imgUrl = `../out/${encodeURIComponent(post)}/${seg.src}`;
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = seg.alt || `第 ${segNum} 段配图`;
      body.appendChild(img);

      copyBtn.onclick = async () => {
        await copyImage(imgUrl, copyBtn, `✓ 第 ${segNum} 段已复制`);
        card.classList.add('copied');
        updateXProgress();
      };
    }

    header.appendChild(indexSpan);
    header.appendChild(copyBtn);
    card.appendChild(header);
    card.appendChild(body);
    listEl.appendChild(card);
  });

  updateXProgress();
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

  renderHeaderActions(data, post);
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
  renderXSegments(data, post.trim());
}

window.addEventListener('DOMContentLoaded', init);
