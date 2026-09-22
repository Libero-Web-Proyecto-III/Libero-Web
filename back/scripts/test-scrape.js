const puppeteer = require('puppeteer-core');

async function testImmediateCapture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--lang=es-ES,es'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  // Escuchar respuestas de red para capturar imágenes t15 (video thumbnail) y t39/t51 (fotos)
  const networkImages = [];
  page.on('response', (res) => {
    const u = res.url();
    if (
      (u.includes('scontent') || u.includes('fbcdn')) &&
      !u.includes('emoji.php') &&
      !u.includes('rsrc.php') &&
      !u.includes('40x40') &&
      !u.includes('32x32')
    ) {
      networkImages.push(u);
    }
  });

  await page.goto('https://www.facebook.com/LiberoCobreCol', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Escape');

  // Capturar imagen de Art 0 INMEDIATAMENTE
  const immediateImg = await page.evaluate(() => {
    const art = document.querySelector('div[role="article"]');
    if (!art) return null;
    const img = art.querySelector('img[src*="scontent"], img[src*="t15."]');
    return img ? img.src : null;
  });

  console.log('Immediate Img from Art 0 DOM:', immediateImg);
  console.log('Network Images captured count:', networkImages.length);
  if (networkImages.length > 0) {
    console.log('First 3 network images:', networkImages.slice(0, 3));
  }

  await browser.close();
}

testImmediateCapture();
