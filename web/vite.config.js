import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{rolldownOptions:{input:{main:resolve(import.meta.dirname,'index.html'),original:resolve(import.meta.dirname,'original.html')}}}});
