import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

export interface FacebookPost {
  id: string;
  message: string;
  full_picture?: string;
  created_time: string;
  permalink_url: string;
}

@Injectable()
export class FacebookService implements OnModuleInit {
  private readonly logger = new Logger(FacebookService.name);
  private cachedPosts: FacebookPost[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de caché en memoria
  private isScraping: boolean = false;
  private readonly AUTO_SCRAPE_INTERVAL_MS = 6 * 60 * 60 * 1000; // Cada 6 horas
  private readonly MAX_CACHE_AGE_MS = 4 * 60 * 60 * 1000; // Si supera 4 horas, se refresca

  constructor(private readonly configService: ConfigService) {
    this.cachedPosts = null;
    this.lastFetchTime = 0;
  }

  onModuleInit() {
    // Al arrancar el servidor, comprobar si hace falta scrapear
    this.checkAndAutoScrape();

    // Programar actualización automática cada 6 horas en segundo plano
    setInterval(() => {
      this.logger.log('Disparando actualización automática programada de Facebook...');
      this.triggerBackgroundScrape();
    }, this.AUTO_SCRAPE_INTERVAL_MS);
  }

  triggerBackgroundScrape(): boolean {
    if (this.isScraping) {
      this.logger.log('El scraper de Facebook ya está ejecutándose en segundo plano.');
      return false;
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'scrape-facebook.js');
    if (!fs.existsSync(scriptPath)) {
      this.logger.warn(`No se encontró el script de scraping en: ${scriptPath}`);
      return false;
    }

    this.isScraping = true;
    this.logger.log('Iniciando scraper automático de Facebook en segundo plano...');

    try {
      const child = spawn(process.execPath, [scriptPath], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd(),
      });

      child.unref();

      child.on('close', (code) => {
        this.isScraping = false;
        this.logger.log(`Scraper automático finalizado con código: ${code}`);
        // Limpiar caché en memoria para que la próxima petición tome los datos nuevos
        this.cachedPosts = null;
        this.lastFetchTime = 0;
      });

      child.on('error', (err) => {
        this.isScraping = false;
        this.logger.error('Error al ejecutar el scraper automático:', err);
      });

      return true;
    } catch (err) {
      this.isScraping = false;
      this.logger.error('Excepción al lanzar el scraper automático:', err);
      return false;
    }
  }

  private checkAndAutoScrape() {
    const candidates = [
      path.join(process.cwd(), 'src', 'modules', 'facebook', 'facebook-posts.json'),
      path.join(__dirname, 'facebook-posts.json'),
    ];

    let foundPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      this.logger.log('No se encontró archivo de publicaciones. Iniciando primera extracción automática...');
      this.triggerBackgroundScrape();
      return;
    }

    try {
      const stats = fs.statSync(foundPath);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs > this.MAX_CACHE_AGE_MS) {
        const hours = (ageMs / (1000 * 60 * 60)).toFixed(1);
        this.logger.log(
          `El archivo de posts tiene ${hours} horas de antigüedad. Actualizando en segundo plano...`,
        );
        this.triggerBackgroundScrape();
      }
    } catch (e) {
      this.logger.error('Error comprobando mtime del archivo de posts:', e);
    }
  }

  async getLatestPosts(limit: number = 6): Promise<FacebookPost[]> {
    const now = Date.now();
    const diskFileMtime = this.getScrapedFileMtime();
    const isCacheValid =
      this.cachedPosts &&
      now - this.lastFetchTime < this.CACHE_TTL_MS &&
      this.lastFetchTime >= diskFileMtime;

    if (isCacheValid && this.cachedPosts) {
      return this.cachedPosts.slice(0, limit);
    }

    const pageId = this.configService.get<string>('FACEBOOK_PAGE_ID');
    const accessToken = this.configService.get<string>('FACEBOOK_ACCESS_TOKEN');
    const isValidToken =
      accessToken &&
      accessToken.trim().length > 15 &&
      !accessToken.includes('tu_facebook_page_access_token');
    const isValidPageId =
      pageId && pageId.trim().length > 0 && !pageId.includes('tu_facebook_page_id');

    // 1. Intentar Meta Graph API oficial si las credenciales están configuradas
    if (isValidToken && isValidPageId) {
      const graphPosts = await this.fetchFromGraphApi(pageId.trim(), accessToken.trim(), limit);
      if (graphPosts && graphPosts.length > 0) {
        this.cachedPosts = graphPosts;
        this.lastFetchTime = now;
        return graphPosts.slice(0, limit);
      }
    }

    // 2. Intentar publicaciones extraídas por el Scraper de JavaScript (facebook-posts.json)
    const scrapedPosts = this.getLocalScrapedPosts();
    if (scrapedPosts && scrapedPosts.length > 0) {
      this.cachedPosts = scrapedPosts;
      this.lastFetchTime = now;
      return scrapedPosts.slice(0, limit);
    }

    // 3. Intentar RSS como alternativa terciaria
    const rssUrl = this.configService.get<string>('FACEBOOK_RSS_URL');
    const isValidRss = rssUrl && !rssUrl.includes('tu_feed_id') && rssUrl.trim().length > 0;

    if (isValidRss) {
      const rssPosts = await this.fetchFromRss(rssUrl);
      if (rssPosts && rssPosts.length > 0) {
        this.cachedPosts = rssPosts;
        this.lastFetchTime = now;
        return rssPosts.slice(0, limit);
      }
    }

    // 4. Fallback estático en caso de que todos fallen
    this.logger.warn('Utilizando publicaciones de respaldo predeterminadas para Facebook.');
    const fallbackPosts = this.getFallbackPosts();
    this.cachedPosts = fallbackPosts;
    this.lastFetchTime = now;
    return fallbackPosts.slice(0, limit);
  }

  private getScrapedFileMtime(): number {
    try {
      const candidates = [
        path.join(process.cwd(), 'src', 'modules', 'facebook', 'facebook-posts.json'),
        path.join(process.cwd(), 'dist', 'modules', 'facebook', 'facebook-posts.json'),
        path.join(__dirname, 'facebook-posts.json'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          return fs.statSync(p).mtimeMs;
        }
      }
    } catch {}
    return 0;
  }

  private getLocalScrapedPosts(): FacebookPost[] | null {
    try {
      const candidates = [
        path.join(__dirname, 'facebook-posts.json'),
        path.join(process.cwd(), 'src', 'modules', 'facebook', 'facebook-posts.json'),
        path.join(process.cwd(), 'dist', 'modules', 'facebook', 'facebook-posts.json'),
      ];

      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          if (Array.isArray(data) && data.length > 0) {
            this.logger.log(
              `Obtenidas ${data.length} publicaciones oficiales desde archivo scrapeado: ${filePath}`,
            );
            return data;
          }
        }
      }
    } catch (error) {
      this.logger.error('Error leyendo facebook-posts.json local:', error);
    }
    return null;
  }

  private async fetchFromGraphApi(
    pageId: string,
    accessToken: string,
    limit: number,
  ): Promise<FacebookPost[] | null> {
    try {
      this.logger.log(`Consultando publicaciones desde Meta Graph API para la página: ${pageId}`);
      const endpoint = `https://graph.facebook.com/v22.0/${encodeURIComponent(
        pageId,
      )}/posts?fields=id,message,story,full_picture,created_time,permalink_url&limit=${limit}&access_token=${encodeURIComponent(
        accessToken,
      )}`;

      const response = await fetch(endpoint);
      const data = (await response.json()) as any;

      if (!response.ok || data.error) {
        const errorMsg = data.error?.message || response.statusText;
        const errorCode = data.error?.code;
        this.logger.error(
          `Error en Meta Graph API (Código ${errorCode || response.status}): ${errorMsg}`,
        );
        if (errorCode === 190) {
          this.logger.error(
            'El FACEBOOK_ACCESS_TOKEN ha caducado o es inválido. Genera un nuevo token en Meta for Developers.',
          );
        }
        return null;
      }

      const items = data.data || [];
      if (!Array.isArray(items) || items.length === 0) {
        this.logger.warn('Meta Graph API respondió correctamente pero no contiene publicaciones en "data".');
        return null;
      }

      const posts: FacebookPost[] = items.map((item: any, index: number) => {
        const text = item.message || item.story || 'Noticia oficial del Proyecto Mocoa en Facebook.';
        return {
          id: item.id || `fb-graph-${index}`,
          message: this.cleanTextMessage(text),
          full_picture: this.cleanUrl(item.full_picture),
          created_time: item.created_time || new Date().toISOString(),
          permalink_url: item.permalink_url || `https://www.facebook.com/${item.id || pageId}`,
        };
      });

      this.logger.log(`Obtenidas ${posts.length} publicaciones exitosamente desde Meta Graph API.`);
      return posts;
    } catch (error) {
      this.logger.error('Excepción consultando Meta Graph API:', error);
      return null;
    }
  }

  private async fetchFromRss(rssUrl: string): Promise<FacebookPost[] | null> {
    try {
      this.logger.log(`Cargando publicaciones desde el feed RSS: ${rssUrl}`);
      const response = await fetch(rssUrl);
      if (!response.ok) {
        this.logger.warn(`Error al consultar RSS de Facebook (${response.status}): ${response.statusText}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      const bodyText = await response.text();

      let posts: FacebookPost[] = [];
      if (contentType.includes('application/json') || bodyText.trim().startsWith('{')) {
        try {
          const json = JSON.parse(bodyText);
          posts = this.parseJsonRss(json);
        } catch {
          posts = this.parseXmlRss(bodyText);
        }
      } else {
        posts = this.parseXmlRss(bodyText);
      }

      if (posts.length > 0) {
        this.logger.log(`Obtenidas ${posts.length} publicaciones desde el feed RSS con imágenes procesadas.`);
        return posts;
      }
      return null;
    } catch (error) {
      this.logger.error('Excepción consultando el feed RSS de Facebook:', error);
      return null;
    }
  }

  private parseJsonRss(json: any): FacebookPost[] {
    const items = json.items || json.data || [];
    return items.map((item: any, index: number) => {
      const rawText = item.content_html || item.description || item.title || item.message || '';
      const cleanMsg = this.cleanTextMessage(rawText);
      const imageUrl = this.cleanUrl(item.image || item.thumbnail || item.enclosure?.link || item.enclosure?.url || this.extractImageUrlFromHtml(rawText));

      return {
        id: item.id || `rss-json-${index}`,
        message: cleanMsg || 'Noticia oficial del Proyecto Mocoa en Facebook.',
        full_picture: imageUrl || undefined,
        created_time: item.date_published || item.pubDate || item.created_time || new Date().toISOString(),
        permalink_url: item.url || item.link || 'https://www.facebook.com/LiberoCobreCol',
      };
    });
  }

  private parseXmlRss(xmlText: string): FacebookPost[] {
    const posts: FacebookPost[] = [];
    const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

    itemMatches.forEach((itemXml, index) => {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const mediaMatch =
        itemXml.match(/<media:content[\s\S]*?url=["']([\s\S]*?)["']/i) ||
        itemXml.match(/<enclosure[\s\S]*?url=["']([\s\S]*?)["']/i) ||
        itemXml.match(/<media:thumbnail[\s\S]*?url=["']([\s\S]*?)["']/i);

      const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1') : '';
      const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1') : '';

      const combinedText = rawDesc && rawDesc.trim().length > 10 ? rawDesc : rawTitle;
      const cleanMsg = this.cleanTextMessage(combinedText);

      const rawUrl = mediaMatch ? mediaMatch[1] : this.extractImageUrlFromHtml(rawDesc || rawTitle);
      const imageUrl = this.cleanUrl(rawUrl);

      const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim() : 'https://www.facebook.com/LiberoCobreCol';
      const pubDate = dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString();

      posts.push({
        id: `rss-xml-${index}`,
        message: cleanMsg || 'Noticia oficial del Proyecto Mocoa en Facebook.',
        full_picture: imageUrl || undefined,
        created_time: pubDate,
        permalink_url: link,
      });
    });

    return posts;
  }

  private cleanUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    // Decodificar múltiples niveles de escape de entidades HTML
    let clean = url
      .replace(/<!\/CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/&amp;amp;/g, '&')   // doble escape
      .replace(/&amp;/g, '&')       // escape simple
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    if (clean.startsWith('//')) {
      clean = 'https:' + clean;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    return undefined;
  }

  private extractImageUrlFromHtml(html: string): string | undefined {
    if (!html) return undefined;
    const imgMatch = html.match(/<img[\s\S]*?src=["']([\s\S]*?)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
  }

  private cleanTextMessage(text: string): string {
    if (!text) return '';
    return text
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getFallbackPosts(): FacebookPost[] {
    return [
      {
        id: 'fb-post-1',
        message: 'Avanzamos con responsabilidad social y ambiental en el Proyecto Mocoa, impulsando el desarrollo sostenible y la conservación de la biodiversidad en el departamento de Putumayo.',
        full_picture: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-post-2',
        message: 'A través de nuestra iniciativa "Huellitas Verdes", fortalecemos los programas de reforestación activa con especies nativas y monitoreo hídrico en las cuencas del municipio de Mocoa. 🌿💧',
        full_picture: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-post-3',
        message: 'El cobre es el metal esencial para la transición energética global. El depósito de Mocoa posiciona a Colombia como un actor clave en la infraestructura limpia del futuro. ⚡⛏️',
        full_picture: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-post-4',
        message: 'Junto a las comunidades locales de Mocoa, promovemos talleres de educación ambiental y desarrollo comunitario para construir un futuro compartido en la Amazonia. 🤝🌳',
        full_picture: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
      {
        id: 'fb-post-5',
        message: 'Implementamos estándares internacionales de exploración geológica limpia y transparente, protegiendo los suelos y recursos hídricos de la región. 💧🛡️',
        full_picture: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop',
        created_time: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        permalink_url: 'https://www.facebook.com/LiberoCobreCol',
      },
    ];
  }
}
