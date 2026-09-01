import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FacebookPost {
  id: string;
  message: string;
  full_picture?: string;
  created_time: string;
  permalink_url: string;
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private cachedPosts: FacebookPost[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de caché

  constructor(private readonly configService: ConfigService) {
    // Forzar recarga fresca en cada arranque del servidor
    this.cachedPosts = null;
    this.lastFetchTime = 0;
  }

  async getLatestPosts(limit: number = 6): Promise<FacebookPost[]> {
    const now = Date.now();
    if (this.cachedPosts && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedPosts.slice(0, limit);
    }

    const rssUrl = this.configService.get<string>('FACEBOOK_RSS_URL');
    const isValidRss = rssUrl && !rssUrl.includes('tu_feed_id') && rssUrl.trim().length > 0;

    let posts: FacebookPost[] = [];

    if (isValidRss) {
      try {
        this.logger.log(`Cargando publicaciones desde el feed RSS: ${rssUrl}`);
        const response = await fetch(rssUrl);
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const bodyText = await response.text();

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
            this.cachedPosts = posts;
            this.lastFetchTime = now;
            return posts.slice(0, limit);
          }
        } else {
          this.logger.warn(`Error al consultar RSS de Facebook (${response.status}): ${response.statusText}`);
        }
      } catch (error) {
        this.logger.error('Excepción consultando el feed RSS de Facebook:', error);
      }
    }

    posts = this.getFallbackPosts();
    this.cachedPosts = posts;
    this.lastFetchTime = now;
    return posts.slice(0, limit);
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
