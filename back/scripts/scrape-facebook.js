const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function scrapeFacebook() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`[FacebookScraper] Iniciando navegador: ${executablePath}`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-notifications',
      '--disable-extensions',
      '--lang=es-ES,es',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    console.log('[FacebookScraper] Visitando https://www.facebook.com/LiberoCobreCol ...');
    await page.goto('https://www.facebook.com/LiberoCobreCol', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Cerrar modal de inicio de sesión si aparece
    try {
      await page.keyboard.press('Escape');
      const closeButtons = await page.$$('[aria-label="Cerrar"], [aria-label="Close"], div[role="dialog"] [role="button"]');
      for (const btn of closeButtons) {
        await btn.click().catch(() => {});
      }
    } catch (e) {}

    // Función para extraer publicaciones del DOM preservando emojis de los tags <img>
    const extractArticlesFromDOM = async () => {
      return await page.evaluate(() => {
        const articles = document.querySelectorAll('div[role="article"]');
        const items = [];

        articles.forEach((article, index) => {
          const headerText = (article.innerText || '').substring(0, 120);
          if (!headerText.includes('Libero Cobre')) return;

          // 1. Extraer texto oficial del mensaje preservando emojis de los atributos alt
          const messageContainer = article.querySelector('div[data-ad-preview="message"], div[data-ad-comet-preview="message"]');
          let fullText = '';

          if (messageContainer) {
            const clone = messageContainer.cloneNode(true);
            clone.querySelectorAll('img').forEach((img) => {
              const alt = img.getAttribute('alt') || '';
              img.replaceWith(alt);
            });
            fullText = clone.innerText;
          } else {
            const autoDivs = Array.from(article.querySelectorAll('div[dir="auto"], span[dir="auto"]'))
              .map((d) => {
                const clone = d.cloneNode(true);
                clone.querySelectorAll('img').forEach((img) => {
                  const alt = img.getAttribute('alt') || '';
                  img.replaceWith(alt);
                });
                return clone.innerText.trim();
              })
              .filter((t) => {
                if (t.length < 35) return false;
                if (t.includes('Todas las reacciones') || t.includes('Comentar')) return false;
                if (t.includes('Me gusta') || t.includes('Compartir') || t.includes('Responder')) return false;
                return true;
              });
            fullText = autoDivs.join('\n');
          }

          if (!fullText) return;

          let cleanMessage = fullText
            .replace(/Ver menos\s*$/i, '')
            .replace(/See less\s*$/i, '')
            .replace(/\s*\.\.\.\s*Ver más.*/i, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (cleanMessage.length < 20) return;

          // 2. Extraer imagen del post o portada de video
          let foundImg = null;
          const images = article.querySelectorAll('img');
          for (const img of images) {
            const src = img.src || '';
            if (
              (src.includes('scontent') || src.includes('fbcdn')) &&
              !src.includes('emoji.php') &&
              !src.includes('rsrc.php')
            ) {
              const width = img.naturalWidth || img.width || 0;
              const height = img.naturalHeight || img.height || 0;
              if (width > 80 || height > 80 || (!width && !height)) {
                foundImg = src;
                break;
              }
            }
          }

          // 3. Extraer enlace permanente exacto
          let permalink = 'https://www.facebook.com/LiberoCobreCol';
          const allLinks = Array.from(article.querySelectorAll('a'));
          const directLink = allLinks.find((a) => {
            const h = a.href || '';
            if (
              h.includes('/hashtag/') ||
              h.includes('/people/') ||
              h.includes('/stories/') ||
              h.includes('comment_id')
            ) {
              return false;
            }
            if (h.endsWith('/LiberoCobreCol') || h.endsWith('/LiberoCobreCol/')) return false;

            return (
              h.includes('/posts/') ||
              h.includes('/reel/') ||
              h.includes('/watch') ||
              h.includes('/photos/') ||
              h.includes('/videos/') ||
              h.includes('permalink') ||
              h.includes('story.php')
            );
          });

          if (directLink && directLink.href) {
            try {
              const urlObj = new URL(directLink.href);
              urlObj.search = '';
              permalink = urlObj.toString();
            } catch {
              permalink = directLink.href;
            }
          }

          // Identificador clave para deduplicar
          const postKey = cleanMessage
            .replace(/[^\w\s]/gi, '')
            .substring(0, 30)
            .toLowerCase();

          items.push({
            id: `fb-scraped-${Date.now()}-${index}`,
            key: postKey,
            message: cleanMessage,
            full_picture: foundImg || undefined,
            created_time: new Date().toISOString(),
            permalink_url: permalink,
          });
        });

        return items;
      });
    };

    // Función para expandir botones de "Ver más"
    const clickSeeMoreButtons = async () => {
      return await page.evaluate(() => {
        let count = 0;
        const allButtons = document.querySelectorAll('div[role="button"], span, div');
        for (const el of allButtons) {
          const t = (el.innerText || '').trim();
          if (t.includes('Ver más') || t.includes('See more')) {
            el.click();
            count++;
          }
        }
        return count;
      });
    };

    // 1. CAPTURA INMEDIATA al cargar (garantiza capturar la imagen de la primera publicación/video antes de que autoplay la oculte)
    console.log('[FacebookScraper] Capturando portada inicial y publicaciones superiores...');
    const batch1 = await extractArticlesFromDOM();

    // 2. Expandir textos con "Ver más"
    console.log('[FacebookScraper] Expandiendo botones "Ver más"...');
    await clickSeeMoreButtons();
    await new Promise((r) => setTimeout(r, 1500));
    const batch1Expanded = await extractArticlesFromDOM();

    // 3. Scroll y capturas intermedias
    console.log('[FacebookScraper] Desplazando página y recopilando publicaciones...');
    await page.evaluate(() => window.scrollBy(0, 900));
    await new Promise((r) => setTimeout(r, 1500));
    await clickSeeMoreButtons();
    await new Promise((r) => setTimeout(r, 1500));
    const batch2 = await extractArticlesFromDOM();

    await page.evaluate(() => window.scrollBy(0, 1100));
    await new Promise((r) => setTimeout(r, 1500));
    await clickSeeMoreButtons();
    await new Promise((r) => setTimeout(r, 1500));
    const batch3 = await extractArticlesFromDOM();

    await page.evaluate(() => window.scrollBy(0, 1100));
    await new Promise((r) => setTimeout(r, 1500));
    await clickSeeMoreButtons();
    await new Promise((r) => setTimeout(r, 1500));
    const batch4 = await extractArticlesFromDOM();

    // 4. Consolidar lotes en un Mapa inteligente
    const postMap = new Map();
    [...batch1, ...batch1Expanded, ...batch2, ...batch3, ...batch4].forEach((post) => {
      const existing = postMap.get(post.key);
      if (!existing) {
        postMap.set(post.key, post);
      } else {
        // Preservar el texto más completo
        if (post.message.length > existing.message.length) {
          existing.message = post.message;
        }
        // Preservar la imagen si la tiene
        if (!existing.full_picture && post.full_picture) {
          existing.full_picture = post.full_picture;
        }
        // Preservar el enlace específico si el anterior era solo la raíz
        if (existing.permalink_url.endsWith('/LiberoCobreCol') && !post.permalink_url.endsWith('/LiberoCobreCol')) {
          existing.permalink_url = post.permalink_url;
        }
      }
    });

    const finalPosts = Array.from(postMap.values()).slice(0, 8);
    const outputPath = path.join(__dirname, '..', 'src', 'modules', 'facebook', 'facebook-posts.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalPosts, null, 2), 'utf-8');

    // Copiar también a dist
    const distPath = path.join(__dirname, '..', 'dist', 'modules', 'facebook', 'facebook-posts.json');
    try {
      if (fs.existsSync(path.dirname(distPath))) {
        fs.writeFileSync(distPath, JSON.stringify(finalPosts, null, 2), 'utf-8');
      }
    } catch {}

    console.log(`[FacebookScraper] ¡Éxito! Guardadas ${finalPosts.length} publicaciones con emojis reales, fotos completas y enlaces directos en: ${outputPath}`);
    return finalPosts;
  } catch (error) {
    console.error('[FacebookScraper] Error:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrapeFacebook().then(() => process.exit(0));
}

module.exports = { scrapeFacebook };
