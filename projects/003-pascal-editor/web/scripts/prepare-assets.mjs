// Pascal 1.0.3 contains domain-root icon/audio literals. Add the host's base
// path without altering geometry, interaction, or rendering implementations.
// The deterministic install hook also runs after npm ci on a clean checkout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const marker = '/* pascal-study-003: subpath assets */\n';
const packagePaths = ['editor/src', 'nodes/dist', 'viewer/dist', 'core/dist'];
let filesChanged = 0;
let pathsChanged = 0;

function patchDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) { patchDirectory(filename); continue; }
    if (!/\.(tsx?|jsx?)$/.test(filename) || /(?:\.d\.ts|\.test\.|\.spec\.)/.test(filename)) continue;
    const source = fs.readFileSync(filename, 'utf8');
    if (source.startsWith(marker)) continue;
    const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    const edits = [];
    function visit(node) {
      const string = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
      const template = ts.isTemplateExpression(node);
      const value = string ? node.text : template ? node.head.text : '';
      if (/^\/(icons|audios)\//.test(value)) {
        const original = source.slice(node.getStart(parsed), node.end);
        const expression = `((process.env.NEXT_PUBLIC_BASE_PATH ?? '') + ${original})`;
        edits.push({ start: node.getStart(parsed), end: node.end, text: ts.isJsxAttribute(node.parent) ? `{${expression}}` : expression });
        return;
      }
      ts.forEachChild(node, visit);
    }
    visit(parsed);
    if (!edits.length) continue;
    let patched = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) patched = patched.slice(0, edit.start) + edit.text + patched.slice(edit.end);
    fs.writeFileSync(filename, marker + patched);
    filesChanged++;
    pathsChanged += edits.length;
  }
}

for (const packagePath of packagePaths) {
  const packageRoot = path.join(projectRoot, 'node_modules', '@pascal-app', packagePath.split('/')[0]);
  const info = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  if (info.version !== '1.0.3') throw new Error(`需要重新核实 ${info.name}@${info.version} 的资源路径。`);
  patchDirectory(path.join(projectRoot, 'node_modules', '@pascal-app', packagePath));
}
console.log(`Pascal 子路径适配：${filesChanged} 文件，${pathsChanged} 个图标/音效路径。`);

// Use the matching, locally bundled Three.js decoder instead of a mutable CDN.
const decoderFile = path.join(projectRoot, 'node_modules/@pascal-app/viewer/dist/lib/ktx2-loader.js');
const decoderSource = fs.readFileSync(decoderFile, 'utf8');
const upstreamDecoder = "'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/'";
const localDecoder = "((process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/basis/')";
if (decoderSource.includes(upstreamDecoder)) {
  fs.writeFileSync(decoderFile, decoderSource.replace(upstreamDecoder, localDecoder));
  console.log('KTX2 解码器已适配为本地 /basis/。');
} else if (!decoderSource.includes(localDecoder)) {
  throw new Error('KTX2 解码路径与固定 1.0.3 版本不符，请重新核实。');
}

// The picker uses a plain img rather than the viewer's CDN URL resolver.
const pickerFile = path.join(projectRoot, 'node_modules/@pascal-app/editor/src/components/ui/controls/material-picker.tsx');
const pickerSource = fs.readFileSync(pickerFile, 'utf8');
const upstreamThumbnail = 'src={item.previewThumbnailUrl}';
const localThumbnail = "src={(process.env.NEXT_PUBLIC_BASE_PATH ?? '') + item.previewThumbnailUrl}";
if (pickerSource.includes(upstreamThumbnail)) {
  fs.writeFileSync(pickerFile, pickerSource.replace(upstreamThumbnail, localThumbnail));
  console.log('材质选择器缩略图已适配宿主子路径。');
} else if (!pickerSource.includes(localThumbnail)) {
  throw new Error('材质缩略图路径与固定 1.0.3 版本不符，请重新核实。');
}

const editorFile = path.join(projectRoot, 'node_modules/@pascal-app/editor/src/components/editor/index.tsx');
const editorSource = fs.readFileSync(editorFile, 'utf8');
const upstreamSwatch = 'return catalogMaterial?.previewThumbnailUrl ?? catalogMaterial?.preset.maps.albedoMap';
const localSwatch = "const catalogSwatch = catalogMaterial?.previewThumbnailUrl ?? catalogMaterial?.preset.maps.albedoMap\n  return catalogSwatch ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + catalogSwatch : undefined";
if (editorSource.includes(upstreamSwatch)) {
  fs.writeFileSync(editorFile, editorSource.replace(upstreamSwatch, localSwatch));
  console.log('材质绘制工具预览已适配宿主子路径。');
} else if (!editorSource.includes(localSwatch)) {
  throw new Error('材质绘制预览与固定 1.0.3 版本不符，请重新核实。');
}
