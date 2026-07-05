import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function testPoolLoad() {
  const category = 'Mechanical Engineering';
  let pool = [];
  if (category === 'Mechanical Engineering') {
    const mod = await import('./src/data/mechEngQuestions.js');
    pool = mod.default;
  }
  console.log("Pool loaded. Size:", pool.length);
  
  let filtered = pool.filter(q => true);
  console.log("Filtered size:", filtered.length);
}

testPoolLoad();
