import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { renderSeoDocument } from './server/seo.mjs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss(), { name: 'buildfeast-seo', transformIndexHtml: { order: 'pre', handler(html, context) { return renderSeoDocument(html, JSON.parse(readFileSync(new URL('./src/config/event.json', import.meta.url), 'utf8')), (context.originalUrl || context.path).split('?')[0]); } } }], resolve: { dedupe: ['react', 'react-dom'] }, server: { proxy: { '/api': 'http://127.0.0.1:3001' } } });
