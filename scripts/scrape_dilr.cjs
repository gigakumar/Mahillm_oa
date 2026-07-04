const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const https = require('https');

// Helper to fetch HTML
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : 'https://www.indiabix.com' + res.headers.location;
        return resolve(fetchHTML(nextUrl));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Scrape IndiaBix pages for a specific topic, following pagination
async function scrapeTopic(startUrl, topic, category, startId, maxPages = 20) {
  let questions = [];
  let currentId = startId;
  let currentUrl = startUrl;

  for (let page = 1; page <= maxPages; page++) {
    console.log(`    Fetching page ${page} for ${topic}...`);
    try {
      const html = await fetchHTML(currentUrl);
      if (!html) break;
      const $ = cheerio.load(html);
      let pageQuestions = 0;

      $('.bix-div-container').each((i, el) => {
        const qHtml = $(el).find('.bix-td-qtxt').html();
        if (!qHtml) return;

        const optionsHtml = [];
        $(el).find('.bix-td-option-val').each((j, optEl) => {
          optionsHtml.push($(optEl).html().trim());
        });
        if (optionsHtml.length < 4) return;

        const ansVal = $(el).find('.jq-hdnakq').val();
        const correctIdx = ansVal ? ansVal.charCodeAt(0) - 65 : 0;

        let explanationHtml = $(el).find('.bix-ans-description').html();
        if (explanationHtml && explanationHtml.includes('No answer description is available')) {
            explanationHtml = '';
        } else if (explanationHtml) {
            explanationHtml = explanationHtml.trim();
        }

        questions.push({
          id: currentId++,
          question: qHtml.trim(),
          options: optionsHtml.slice(0, 4),
          correct: correctIdx,
          explanation: explanationHtml || '',
          contextHtml: '',
          difficulty: 'Medium',
          topic: topic,
          category: category
        });
        pageQuestions++;
      });

      if (pageQuestions === 0) {
        console.log(`    No questions found on page ${page}. Stopping.`);
        break; 
      }

      // Find next page link
      const nextPageUrlTemplate = $('#inp_pg_no_url').val();
      if (nextPageUrlTemplate) {
         let nextPageStr = (page + 1).toString().padStart(3, '0');
         currentUrl = nextPageUrlTemplate.replace('[[[p-no]]]', nextPageStr);
      } else {
         break;
      }

      await new Promise(r => setTimeout(r, 600)); // Polite delay
    } catch (err) {
      console.error(`    Error on page ${page}: ${err.message}`);
      break;
    }
  }

  return questions;
}

const TOPICS = [
  { name: 'Number Series', url: 'https://www.indiabix.com/logical-reasoning/number-series/' },
  { name: 'Letter and Symbol Series', url: 'https://www.indiabix.com/logical-reasoning/letter-and-symbol-series/' },
  { name: 'Verbal Classification', url: 'https://www.indiabix.com/logical-reasoning/verbal-classification/' },
  { name: 'Essential Part', url: 'https://www.indiabix.com/logical-reasoning/essential-part/' },
  { name: 'Analogies', url: 'https://www.indiabix.com/logical-reasoning/analogies/' },
  { name: 'Logical Problems', url: 'https://www.indiabix.com/logical-reasoning/logical-problems/' },
  { name: 'Logical Games', url: 'https://www.indiabix.com/logical-reasoning/logical-games/' },
  { name: 'Statement and Assumption', url: 'https://www.indiabix.com/logical-reasoning/statement-and-assumption/' },
  { name: 'Cause and Effect', url: 'https://www.indiabix.com/logical-reasoning/cause-and-effect/' },
  { name: 'Statement and Argument', url: 'https://www.indiabix.com/logical-reasoning/statement-and-argument/' }
];

async function run() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const filePath = path.join(dataDir, 'dilrQuestions.js');

  console.log("Starting DILR scrape with correct IndiaBix URLs...");
  let allQuestions = [];
  let currentId = 2001;

  for (const topic of TOPICS) {
    console.log(`\n  -> Topic: ${topic.name}`);
    const qs = await scrapeTopic(topic.url, topic.name, 'DILR', currentId, 15); // scrape up to 15 pages per topic to get ~150-300 questions
    if (qs.length > 0) {
        allQuestions = allQuestions.concat(qs);
        currentId += qs.length;
        console.log(`    ✓ Found ${qs.length} questions.`);
    } else {
        console.log(`    ❌ No questions found. Check URL.`);
    }
  }

  const content = `// Auto-scraped questions for DILR\nexport default ${JSON.stringify(allQuestions, null, 2)};\n`;
  fs.writeFileSync(filePath, content);
  console.log(`\n✅ Saved total ${allQuestions.length} questions to dilrQuestions.js`);
}

run();
