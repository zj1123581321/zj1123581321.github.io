/*
 * 代码高亮：mdnice/markdown-nice src/utils/helper.js 中 highlight 函数的移植（GPL-3.0），
 * highlight.js 9 → 11 API 适配（hljs.highlight(str, {language})），其余逻辑（<br/> 换行、
 * &nbsp; 空格、span&nbsp; 修复、pre.custom 包裹）与 mdnice 一致。
 */
import hljs from 'highlight.js';

export function highlightMdnice(str, lang) {
  if (lang === undefined || lang === '') {
    lang = 'bash';
  }
  if (lang && hljs.getLanguage(lang)) {
    try {
      const formatted = hljs
        .highlight(str, { language: lang, ignoreIllegals: true })
        .value.replace(/\n/g, '<br/>') // 换行用br表示
        .replace(/\s/g, '&nbsp;') // 用nbsp替换空格
        .replace(/span&nbsp;/g, 'span '); // span标签修复
      return '<pre class="custom"><code class="hljs">' + formatted + '</code></pre>';
    } catch (e) {
      // 与 mdnice 一致：高亮失败降级为转义输出（保留原行为）
      console.error(e);
    }
  }
  return '<pre class="custom"><code class="hljs">' + hljsEscape(str) + '</code></pre>';
}

function hljsEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
