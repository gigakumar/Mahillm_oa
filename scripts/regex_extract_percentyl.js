import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERCENTYL_URL = 'https://percentyl.in/resources/questions';
const OUTPUT_FILE = path.join(__dirname, '../public/data/percentyl_questions.json');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function extractQuestions() {
  try {
    console.log('1. Fetching main page HTML...');
    const html = await fetch(PERCENTYL_URL);
    
    console.log('2. Using Regex to find main JS bundle...');
    const jsMatch = html.match(/src="(\/assets\/index-[a-zA-Z0-9_-]+\.js)"/);
    if (!jsMatch) {
      throw new Error('Could not find JS bundle in HTML using regex.');
    }
    
    const jsUrl = `https://percentyl.in${jsMatch[1]}`;
    console.log(`-> Found JS bundle: ${jsUrl}`);
    
    console.log('3. Fetching JS bundle...');
    const jsCode = await fetch(jsUrl);
    
    console.log('4. Using Regex to extract backend API URL and Keys...');
    const supabaseUrlMatch = jsCode.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
    const supabaseKeyMatch = jsCode.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
    
    if (!supabaseUrlMatch || !supabaseKeyMatch) {
      throw new Error('Could not find Supabase URL or Key in JS bundle using regex.');
    }
    
    const supabaseUrl = supabaseUrlMatch[0];
    const supabaseKey = supabaseKeyMatch[0];
    console.log(`-> API URL: ${supabaseUrl}`);
    
    console.log('5. Fetching question groups from backend...');
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };
    
    const groupsRaw = await fetch(`${supabaseUrl}/rest/v1/rpc/practice_question_groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    
    const groups = JSON.parse(groupsRaw);
    console.log(`-> Found ${groups.length} question groups.`);
    
    const allQuestions = [];
    
    console.log('6. Iterating groups and fetching real questions...');
    for (let i = 0; i < groups.length; i++) { 
      const group = groups[i];
      console.log(`   Fetching: ${group.section} - ${group.topic} - ${group.chapter}...`);
      
      const payload = JSON.stringify({
        p_chapter: group.chapter,
        p_section: group.section,
        p_topic: group.topic
      });
      
      const questionsRaw = await fetch(`${supabaseUrl}/rest/v1/rpc/practice_questions_for_solving`, {
        method: 'POST',
        headers,
        body: payload
      });
      
      const questions = JSON.parse(questionsRaw);
      allQuestions.push(...questions);
      
      // small delay to prevent rate limit
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`7. Saving ${allQuestions.length} extracted questions to JSON...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
    
    console.log(`✅ Success! Data saved to ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error during extraction:', error.message);
  }
}

extractQuestions();
