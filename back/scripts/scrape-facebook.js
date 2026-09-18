const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const FALLBACK_POSTS = [
  {
    id: 'fb-fallback-1',
    message: 'Avanzamos con responsabilidad social y ambiental en el Proyecto Mocoa, impulsando el desarrollo sostenible y la conservación de la biodiversidad en el departamento de Putumayo.',
    full_picture: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop',
    created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    permalink_url: 'https://www.facebook.com/LiberoCobreCol',
  },
  {
    id: 'fb-fallback-2',
    message: 'A través de nuestra iniciativa "Huellitas Verdes", fortalecemos los programas de reforestación activa con especies nativas y monitoreo hídrico en las cuencas del municipio de Mocoa. 🌿💧',
    full_picture: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop',
    created_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    permalink_url: 'https://www.facebook.com/LiberoCobreCol',
  },
  {
    id: 'fb-fallback-3',
    message: 'El cobre es el metal esencial para la transición energética global. El depósito de Mocoa posiciona a Colombia como un actor clave en la infraestructura limpia del futuro. ⚡⛏️',
    full_picture: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=1000&auto=format&fit=crop',
    created_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    permalink_url: 'https://www.facebook.com/LiberoCobreCol',
  },
  {
    id: 'fb-fallback-4',
    message: 'Junto a las comunidades locales de Mocoa, promovemos talleres de educación ambiental y desarrollo comunitario para construir un futuro compartido en la Amazonia. 🤝🌳',
    full_picture: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?q=80&w=1000&auto=format&fit=crop',
    created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    permalink_url: 'https://www.facebook.com/LiberoCobreCol',
  },
  {
    id: 'fb-fallback-5',
    message: 'Implementamos estándares internacionales de exploración geológica limpia y transparente, protegiendo los suelos y recursos hídricos de la región. 💧🛡️',
    full_picture: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop',
    created_time: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    permalink_url: 'https://www.facebook.com/LiberoCobreCol',
  },
];

function normalizeKey(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, '')
    .substring(0, 35)
    .trim();
}

async function scrapeFacebook() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`[FacebookScraper] Iniciando navegador: ${executablePath}`);

  let browser;
  let newlyScraped = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-notifications',
        '--disable-extensions',
        '--autoplay-policy=user-gesture-required',
        '--lang=es-ES,es',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1200 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Interceptar imágenes de red para capturar portadas de videos/reels (t15) y fotos
    const networkVideoImages = [];
    page.on('response', (res) => {
      const u = res.url();
      if (
        (u.includes('scontent') || u.includes('fbcdn')) &&
        !u.includes('emoji.php') &&
        !u.includes('rsrc.php') &&
        !u.includes('40x40') &&
        !u.includes('32x32') &&
        u.includes('/t15.')
      ) {
        networkVideoImages.push(u);
      }
    });

    console.log('[FacebookScraper] Visitando https://www.facebook.com/LiberoCobreCol ...');
    await page.goto('https://www.facebook.com/LiberoCobreCol', {
      waitUntil: 'domcontentloaded',
      timeout: 35000,
    });

    await new Promise((r) => setTimeout(r, 2000));

    // Cerrar modal inicial de Facebook si aparece
    try {
      await page.keyboard.press('Escape');
      const closeButtons = await page.$$('[aria-label="Cerrar"], [aria-label="Close"], div[role="dialog"] [role="button"]');
      for (const btn of closeButtons) {
        await btn.click().catch(() => {});
      }
    } catch (e) {}

    // Función segura para expandir textos ("Ver más") exclusivamente DENTRO de los artículos
    const expandSeeMore = async () => {
      return await page.evaluate(() => {
        let count = 0;
        const articles = document.querySelectorAll('div[role="article"]');
        articles.forEach((art) => {
          const candidates = art.querySelectorAll('div[role="button"], span[role="button"], span, div');
          candidates.forEach((el) => {
            const t = (el.innerText || '').trim();
            if ((t === 'Ver más' || t === 'See more') && el.children.length === 0) {
              el.click();
              count++;
            }
          });
        });
        return count;
      });
    };

    // Desplazarse gradualmente hacia abajo y expandir los textos de las publicaciones
    for (let s = 1; s <= 4; s++) {
      await expandSeeMore();
      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise((r) => setTimeout(r, 1600));
    }
    await expandSeeMore();
    await new Promise((r) => setTimeout(r, 800));

    // Extraer publicaciones del DOM
    newlyScraped = await page.evaluate(() => {
      const articles = document.querySelectorAll('div[role="article"]');
      const items = [];
      const seen = new Set();

      articles.forEach((article, index) => {
        const fullText = article.innerText || '';
        const headerText = fullText.substring(0, 130);

        // Validar que corresponda a Libero Cobre
        const isLibero = /l[ií]bero\s*cobre/i.test(headerText);
        if (!isLibero) return;

        // Descartar comentarios
        const hasActions = fullText.includes('Me gusta') || fullText.includes('Compartir') || fullText.includes('Comentar');
        if (!hasActions && fullText.length < 100) return;

        // 1. Extraer texto del mensaje preservando emojis de los atributos alt
        const messageContainer = article.querySelector(
          'div[data-ad-preview="message"], div[data-ad-comet-preview="message"]'
        );
        let message = '';

        if (messageContainer) {
          const clone = messageContainer.cloneNode(true);
          clone.querySelectorAll('img').forEach((img) => {
            img.replaceWith(img.getAttribute('alt') || '');
          });
          message = clone.innerText;
        } else {
          const autoEls = Array.from(article.querySelectorAll('div[dir="auto"], span[dir="auto"]'))
            .map((el) => {
              const clone = el.cloneNode(true);
              clone.querySelectorAll('img').forEach((img) => {
                img.replaceWith(img.getAttribute('alt') || '');
              });
              return clone.innerText.trim();
            })
            .filter((t) => {
              if (t.length < 25) return false;
              if (t.includes('Todas las reacciones') || t.includes('Comentar')) return false;
              if (t.includes('Me gusta') || t.includes('Compartir') || t.includes('Responder')) return false;
              if (/^\d+\s*(h|d|min|sem|días|horas)\b/i.test(t)) return false;
              return true;
            });
          message = autoEls.join('\n');
        }

        const cleanMessage = message
          .replace(/Ver menos\s*$/i, '')
          .replace(/See less\s*$/i, '')
          .replace(/\s*\.\.\.\s*Ver más.*/i, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanMessage.length < 15) return;

        const key = cleanMessage
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .substring(0, 35)
          .trim();

        if (seen.has(key)) return;
        seen.add(key);

        // 2. Extraer imagen o portada del post
        let imageUrl = null;
        const images = article.querySelectorAll('img');
        for (const img of images) {
          const src = img.src || '';
          if (
            (src.includes('scontent') || src.includes('fbcdn')) &&
            !src.includes('emoji.php') &&
            !src.includes('rsrc.php')
          ) {
            const w = img.naturalWidth || img.width || 0;
            const h = img.naturalHeight || img.height || 0;
            if (w > 60 || h > 60 || (!w && !h)) {
              imageUrl = src;
              break;
            }
          }
        }

        // 3. Extraer enlace permanente exacto
        let permalink = 'https://www.facebook.com/LiberoCobreCol';
        const links = Array.from(article.querySelectorAll('a'));
        const directLink = links.find((a) => {
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
            const u = new URL(directLink.href);
            u.search = '';
            permalink = u.toString();
          } catch {
            permalink = directLink.href;
          }
        }

        const isVideo = permalink.includes('/reel/') || permalink.includes('/watch') || permalink.includes('/videos/') || fullText.includes('0:');

        items.push({
          id: `fb-scraped-${Date.now()}-${index}`,
          message: cleanMessage,
          full_picture: imageUrl || undefined,
          created_time: new Date().toISOString(),
          permalink_url: permalink,
          isVideo,
        });
      });

      return items;
    });

    // Mapear portadas de video t15 interceptadas por red a los videos/reels que no tengan foto en el DOM
    if (networkVideoImages.length > 0) {
      console.log(`[FacebookScraper] Portadas de video t15 capturadas: ${networkVideoImages.length}`);
      let vIdx = 0;
      newlyScraped.forEach((post) => {
        if (!post.full_picture && post.isVideo && vIdx < networkVideoImages.length) {
          post.full_picture = networkVideoImages[vIdx++];
        }
      });
    }

    console.log(`[FacebookScraper] Extracción web completada: ${newlyScraped.length} publicaciones encontradas.`);
  } catch (err) {
    console.error('[FacebookScraper] Error durante la extracción de Facebook:', err);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  // --- ESTRATEGIA DE PRESERVACIÓN Y FUSIÓN SEGURA ---
  const srcPath = path.join(__dirname, '..', 'src', 'modules', 'facebook', 'facebook-posts.json');
  const distPath = path.join(__dirname, '..', 'dist', 'modules', 'facebook', 'facebook-posts.json');

  let existingPosts = [];
  try {
    const candidatePath = fs.existsSync(srcPath) ? srcPath : (fs.existsSync(distPath) ? distPath : null);
    if (candidatePath) {
      const content = fs.readFileSync(candidatePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        existingPosts = parsed;
      }
    }
  } catch (e) {
    console.warn('[FacebookScraper] No se pudieron leer posts existentes para fusionar:', e.message);
  }

  const mergedMap = new Map();

  // 1. Agregar publicaciones recién extraídas
  for (const p of newlyScraped) {
    const k = normalizeKey(p.message);
    if (k) mergedMap.set(k, p);
  }

  // 2. Conservar publicaciones existentes que no estén duplicadas
  for (const p of existingPosts) {
    const k = normalizeKey(p.message);
    if (k && !mergedMap.has(k)) {
      mergedMap.set(k, p);
    } else if (k && mergedMap.has(k)) {
      const current = mergedMap.get(k);
      // Preservar texto si la existente era más larga
      if (p.message.length > current.message.length) {
        current.message = p.message;
      }
      // Preservar foto si la existente la tenía y la nueva no
      if (!current.full_picture && p.full_picture) {
        current.full_picture = p.full_picture;
      }
    }
  }

  // 3. Si aún se tienen menos de 6, complementar con respaldos
  if (mergedMap.size < 6) {
    for (const fb of FALLBACK_POSTS) {
      const k = normalizeKey(fb.message);
      if (k && !mergedMap.has(k)) {
        mergedMap.set(k, fb);
      }
      if (mergedMap.size >= 8) break;
    }
  }

  const finalPosts = Array.from(mergedMap.values()).map((p) => {
    // Eliminar bandera interna isVideo si existe
    const { isVideo, ...rest } = p;
    return rest;
  }).slice(0, 10);

  try {
    fs.writeFileSync(srcPath, JSON.stringify(finalPosts, null, 2), 'utf-8');
    console.log(`[FacebookScraper] Guardadas ${finalPosts.length} publicaciones en ${srcPath}`);
  } catch (e) {
    console.error('[FacebookScraper] Error guardando en src:', e);
  }

  try {
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, JSON.stringify(finalPosts, null, 2), 'utf-8');
      console.log(`[FacebookScraper] Guardadas ${finalPosts.length} publicaciones en ${distPath}`);
    }
  } catch (e) {}

  return finalPosts;
}

if (require.main === module) {
  scrapeFacebook().then(() => process.exit(0));
}

module.exports = { scrapeFacebook };
