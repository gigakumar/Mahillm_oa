const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const https = require('https');

// Helper to fetch HTML
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Handle redirects if any
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHTML(res.headers.location.startsWith('http') ? res.headers.location : 'https://www.indiabix.com' + res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Scrape IndiaBix pages for a specific topic, following pagination up to maxPages
async function scrapeTopic(startUrl, topic, category, startId, maxPages = 50) {
  let questions = [];
  let currentId = startId;
  let currentUrl = startUrl;

  for (let page = 1; page <= maxPages; page++) {
    console.log(`    Fetching page ${page} for ${topic}...`);
    try {
      const html = await fetchHTML(currentUrl);
      const $ = cheerio.load(html);
      let pageQuestions = 0;

      // Extract context (Data Interpretation graphs/tables)
      let contextHtml = '';
      const directionDiv = $('.direction-div');
      if (directionDiv.length > 0) {
        // Fix relative image URLs
        directionDiv.find('img').each((idx, img) => {
          const src = $(img).attr('src');
          if (src && src.startsWith('/')) {
            $(img).attr('src', 'https://www.indiabix.com' + src);
          }
        });
        contextHtml = directionDiv.html().trim();
      }

      $('.bix-div-container').each((i, el) => {
        // Fix relative image URLs in this container first
        $(el).find('img').each((idx, img) => {
          const src = $(img).attr('src');
          if (src && src.startsWith('/')) {
            $(img).attr('src', 'https://www.indiabix.com' + src);
          }
        });

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
          contextHtml: contextHtml,
          difficulty: 'Medium',
          topic: topic,
          category: category
        });
        pageQuestions++;
      });

      if (pageQuestions === 0) break; // No questions found, stop paginating

      // Find next page link (if any). The "Next" button or looking at pagination
      // For IndiaBix, the pagination usually has an input with name="inp_pg_no_url"
      const nextPageUrlTemplate = $('#inp_pg_no_url').val(); // e.g. https://www.indiabix.com/mechanical-engineering/thermodynamics/029[[[p-no]]]
      
      if (nextPageUrlTemplate) {
         let nextPageStr = (page + 1).toString().padStart(3, '0');
         currentUrl = nextPageUrlTemplate.replace('[[[p-no]]]', nextPageStr);
      } else {
         // No pagination found
         break;
      }

      await new Promise(r => setTimeout(r, 800)); // Be polite to the server
    } catch (err) {
      console.error(`    Error on page ${page}: ${err.message}`);
      break;
    }
  }

  return questions;
}

const SOURCES = [
  {
    category: 'Mechanical Engineering',
    file: 'mechEngQuestions.js',
    startId: 1,
    topics: [
      { name: 'Thermodynamics', url: 'https://www.indiabix.com/mechanical-engineering/thermodynamics/' },
      { name: 'Fluid Mechanics', url: 'https://www.indiabix.com/mechanical-engineering/fluid-mechanics/' },
      { name: 'Strength of Materials', url: 'https://www.indiabix.com/mechanical-engineering/strength-of-materials/' },
      { name: 'Machine Design', url: 'https://www.indiabix.com/mechanical-engineering/machine-design/' },
      { name: 'Manufacturing Processes', url: 'https://www.indiabix.com/mechanical-engineering/production-technology/' },
      { name: 'Heat Transfer', url: 'https://www.indiabix.com/mechanical-engineering/heat-transfer/' },
      { name: 'IC Engines', url: 'https://www.indiabix.com/mechanical-engineering/ic-engines/' },
    ]
  },
  {
    category: 'Quantitative Aptitude',
    file: 'quantsQuestions.js',
    startId: 1001,
    topics: [
      { name: 'Percentages', url: 'https://www.indiabix.com/aptitude/percentage/' },
      { name: 'Profit and Loss', url: 'https://www.indiabix.com/aptitude/profit-and-loss/' },
      { name: 'Time and Work', url: 'https://www.indiabix.com/aptitude/time-and-work/' },
      { name: 'Speed and Distance', url: 'https://www.indiabix.com/aptitude/time-and-distance/' },
      { name: 'Averages', url: 'https://www.indiabix.com/aptitude/average/' },
      { name: 'Simple Interest', url: 'https://www.indiabix.com/aptitude/simple-interest/' },
      { name: 'Probability', url: 'https://www.indiabix.com/aptitude/probability/' }
    ]
  },
  {
    category: 'DILR',
    file: 'dilrQuestions.js',
    startId: 2001,
    topics: [
      { name: 'Logical Reasoning', url: 'https://www.indiabix.com/logical-reasoning/seating-arrangement/' },
      { name: 'Blood Relations', url: 'https://www.indiabix.com/logical-reasoning/blood-relation-test/' }, // Fixed URL
      { name: 'Syllogism', url: 'https://www.indiabix.com/logical-reasoning/syllogism/' },
      { name: 'Coding Decoding', url: 'https://www.indiabix.com/logical-reasoning/coding-and-decoding/' },
      { name: 'Analogy', url: 'https://www.indiabix.com/logical-reasoning/analogy/' },
    ]
  },
  {
    category: 'Graph Interpretation',
    file: 'graphQuestions.js',
    startId: 3001,
    topics: [
      { name: 'Bar Charts', url: 'https://www.indiabix.com/data-interpretation/bar-charts/' },
      { name: 'Pie Charts', url: 'https://www.indiabix.com/data-interpretation/pie-charts/' },
      { name: 'Line Charts', url: 'https://www.indiabix.com/data-interpretation/line-charts/' },
      { name: 'Table Charts', url: 'https://www.indiabix.com/data-interpretation/table-charts/' },
    ]
  }
];

async function runScraper() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  console.log("Starting bulk scrape... This might take a few minutes.");

  for (const source of SOURCES) {
    console.log(`\nScraping category: ${source.category}`);
    let allQuestions = [];
    let currentId = source.startId;

    for (const topic of source.topics) {
      console.log(`  -> Topic: ${topic.name}`);
      // Scrape up to 50 pages per topic to get ~1200 questions per category
      const qs = await scrapeTopic(topic.url, topic.name, source.category, currentId, 50);
      if (qs.length > 0) {
          allQuestions = allQuestions.concat(qs);
          currentId += qs.length;
          console.log(`    ✓ Found ${qs.length} questions.`);
      } else {
          console.log(`    ❌ No questions found. Check URL.`);
      }
    }

    const filePath = path.join(dataDir, source.file);
    const content = `// Auto-scraped questions for ${source.category}\nexport default ${JSON.stringify(allQuestions, null, 2)};\n`;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Saved total ${allQuestions.length} questions to ${source.file}`);
  }
  
  console.log("\nDone scraping!");
}

runScraper();
