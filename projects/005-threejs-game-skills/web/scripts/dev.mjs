// 启动前生成完整产物，使模板、数据、图片和文档在开发入口都可访问。
await import('./build.mjs');
process.argv.push('--dir', 'dist');
await import('./serve.mjs');
