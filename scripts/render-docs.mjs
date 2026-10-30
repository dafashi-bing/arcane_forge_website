#!/usr/bin/env node
// Static local Markdown companions. No network resources or document scripts.
import { readFileSync, writeFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
const escape = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const safeURL = s => /^(?:https?:|mailto:|#|[./]|[a-zA-Z0-9_-]+(?:\/|\.))/.test(s || '') && !/^(?:javascript|data):/i.test(s || '') ? s : '#';
const render = node => {
 const children = () => (node.children || []).map(render).join('');
 switch (node.type) {
  case 'root': return children();
  case 'text': return escape(node.value);
  case 'paragraph': return `<p>${children()}</p>`;
  case 'heading': return `<h${node.depth}>${children()}</h${node.depth}>`;
  case 'code': return `<pre><code>${escape(node.value)}</code></pre>`;
  case 'inlineCode': return `<code>${escape(node.value)}</code>`;
  case 'strong': return `<strong>${children()}</strong>`;
  case 'emphasis': return `<em>${children()}</em>`;
  case 'list': return `<${node.ordered?'ol':'ul'}>${children()}</${node.ordered?'ol':'ul'}>`;
  case 'listItem': return `<li>${children()}</li>`;
  case 'blockquote': return `<blockquote>${children()}</blockquote>`;
  case 'link': return `<a href="${escape(safeURL(node.url).replace(/\.md(#.*)?$/,'.html$1'))}">${children()}</a>`;
  case 'thematicBreak': return '<hr>';
  case 'break': return '<br>';
  case 'image': return `<p class="muted">${escape(node.alt)}</p>`;
  case 'html': return `<pre>${escape(node.value)}</pre>`;
  default: return children();
 }
};
for (const file of process.argv.slice(2)) {
 if (!file.endsWith('.md')) throw Error('Expected .md file');
 const md = readFileSync(file,'utf8'); const ast = unified().use(remarkParse).parse(md);
 const title = ast.children.find(x=>x.type==='heading')?.children.map(x=>x.value||'').join('') || file;
 const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${escape(title)}</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{background:#0b1220;color:#dbe4f0;font:17px/1.75 system-ui,sans-serif;margin:0}main{max-width:1080px;margin:0 auto;padding:56px 28px 90px}h1{font-size:2.3rem;line-height:1.15;color:#f8fafc;margin:0 0 28px}h2{font-size:1.45rem;color:#91d5ff;margin:44px 0 16px;padding-top:20px;border-top:1px solid #243248}h3{color:#f8fafc}a{color:#80c9ff;text-underline-offset:4px}pre{background:#111e31;border:1px solid #2a3d58;border-radius:12px;padding:20px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.65}code{font-family:ui-monospace,SFMono-Regular,monospace;color:#c1e2ff}p code,li code{background:#142339;border-radius:4px;padding:2px 5px}li{margin:8px 0}blockquote{border-left:4px solid #e6b969;margin:24px 0;padding:8px 24px;background:#1b2331}hr{border:0;border-top:1px solid #2a3d58}.muted{color:#9baec6}footer{margin-top:50px;border-top:1px solid #243248;padding-top:20px;font-size:13px;color:#8fa3bd}@media print{body{background:white;color:#152038}h1,h2,h3{color:#152038}pre{background:#f3f6fa}code{color:#152038}}</style></head><body><main>${render(ast)}<footer>Local internal documentation · Arcane Forge · Static HTML companion</footer></main></body></html>`;
 writeFileSync(file.slice(0,-3)+'.html',html); console.log(file.slice(0,-3)+'.html');
}
