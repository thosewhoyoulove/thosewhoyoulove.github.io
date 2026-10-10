import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: '../docs/assets/interview-copilot',
    emptyOutDir: true,
    lib: { entry: 'src/widget/main.tsx', formats: ['iife'], name: 'InterviewCopilot', fileName: () => 'widget.js', cssFileName: 'style' },
    cssCodeSplit: false,
  },
  server: { proxy: { '/api/copilot': 'http://127.0.0.1:8787' } },
});
