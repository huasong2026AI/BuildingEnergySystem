import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL || 'gemini-3.5-flash-lite'),
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY || ''),
      'process.env.DEEPSEEK_BASE_URL': JSON.stringify(env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'),
      'process.env.DEEPSEEK_MODEL': JSON.stringify(env.DEEPSEEK_MODEL || 'deepseek-v4-flash'),
    }
  };
});
