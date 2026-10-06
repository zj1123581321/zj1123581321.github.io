// 公众号 HTML：兰青结构（mdnice 插件组）+ juice 样式内联。链接映射见 links.mjs（build 主流程先行完成）。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import markdownItImplicitFigures from 'markdown-it-implicit-figures';
import juice from 'juice';
import markdownItSpan from './mdnice/markdown-it-span.js';
import markdownItTableContainer from './mdnice/markdown-it-table-container.js';
import markdownItLinkfoot from './mdnice/markdown-it-linkfoot.js';
import markdownItLi from './mdnice/markdown-it-li.js';
import { highlightMdnice } from './highlight.mjs';
import { bundleWechatUrl } from './images.mjs';

const themesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'themes');
const LANQING_CSS = fs.readFileSync(path.join(themesDir, 'lanqing.css'), 'utf8');

export function mermaidFilename(source) {
  return `mermaid-${crypto.createHash('sha256').update(source).digest('hex').slice(0, 12)}.png`;
}

export function createWechatMd() {
  const md = new MarkdownIt({ html: true });
  md.use(markdownItSpan); // 在标题标签中添加span
  md.use(markdownItTableContainer); // 在表格外部添加容器
  md.use(markdownItLinkfoot); // 修改脚注
  md.use(markdownItImplicitFigures, { figcaption: true }); // 图片转 figure
  md.use(markdownItLi); // li 标签中加入 p 标签
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx];
    const info = token.info.trim();
    if (info === 'mermaid') {
      // PNG 已由 build 主流程预渲染到 content/posts/<目录>/images/generated/
      const filename = mermaidFilename(token.content);
      const url = bundleWechatUrl(env.dirName, `images/generated/${filename}`);
      return `<img src="${url}" alt="架构图">\n`;
    }
    return highlightMdnice(token.content, info);
  };
  return md;
}

// 渲染公众号 HTML：输入已完成链接变换的正文，返回带内联样式的 <section id="nice"> HTML
export function renderWechatHtml(markdown, dirName) {
  const md = createWechatMd();
  const rendered = md.render(markdown, { dirName });
  const wrapped = `<section id="nice">${rendered}</section>`;
  return juice.inlineContent(wrapped, LANQING_CSS, {
    inlinePseudoElements: true,
    preserveImportant: true,
  });
}
