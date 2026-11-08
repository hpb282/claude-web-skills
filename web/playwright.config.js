import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

export default defineConfig({
  testDir:'./tests',
  fullyParallel:false,
  workers:1,
  timeout:90000,
  use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1440,height:960},launchOptions:{executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--enable-unsafe-swiftshader']},screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:true},
});
