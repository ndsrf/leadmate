import { LESSON_ART } from '../lessons/lessonArtRegistry';
import { isLessonArt } from '../ui/lessonArt';
import { channelFileUrl, hasRemoteContent } from './config';
import { getActiveContent } from './runtime';
import { sha256Hex } from './hash';
import { ContentStore, type FileStorage } from './store';
import { type HttpFetcher, DefaultHttpFetcher } from './updater';

export interface MediaResolveResult {
  kind: 'bundled' | 'inline' | 'local' | 'placeholder';
  source?: any;
  uri?: string;
  name?: string;
  isPending?: boolean;
  failed?: boolean;
}

export interface ResolveImageOptions {
  itemPath?: string;
  channel?: 'beta' | 'stable';
  onDownloaded?: (uri: string) => void;
}

export class MediaResolver {
  private static instance: MediaResolver | null = null;

  static getInstance(): MediaResolver {
    if (!MediaResolver.instance) {
      MediaResolver.instance = new MediaResolver();
    }
    return MediaResolver.instance;
  }

  static setInstance(resolver: MediaResolver | null): void {
    MediaResolver.instance = resolver;
  }

  constructor(
    private store: ContentStore | null = null,
    private fileStorage: FileStorage | null = null,
    private http: HttpFetcher = new DefaultHttpFetcher(),
    private contentBase?: string
  ) {}

  /**
   * Resolves an image by art key or path.
   * If the file is not yet downloaded, returns a themed placeholder and initiates a background download.
   */
  async resolveImage(art: string, options: ResolveImageOptions = {}): Promise<MediaResolveResult> {
    const channel = options.channel ?? getActiveContent().channel;

    // 1. Check local file in active pack storage
    if (this.store && this.fileStorage) {
      const activeDir = this.store.getActiveDir(channel);
      const candidates = this.getCandidates(art, options.itemPath);

      for (const candidate of candidates) {
        const fullPath = `${activeDir}/${candidate}`;
        if (await this.fileStorage.exists(fullPath)) {
          return {
            kind: 'local',
            uri: fullPath,
            source: { uri: fullPath },
          };
        }
      }
    }

    // 2. Check bundled illustrations in LESSON_ART
    if (art in LESSON_ART) {
      return {
        kind: 'bundled',
        source: LESSON_ART[art],
      };
    }

    // 3. Check inline SVG scenes
    if (isLessonArt(art)) {
      return {
        kind: 'inline',
        name: art,
      };
    }

    // 4. Missing image: trigger background fetch if manifest and remote host are available
    if (this.store && this.fileStorage && hasRemoteContent(this.contentBase)) {
      this.triggerBackgroundDownload(art, channel, options);
      return {
        kind: 'placeholder',
        isPending: true,
      };
    }

    return {
      kind: 'placeholder',
      failed: true,
    };
  }

  private getCandidates(art: string, itemPath?: string): string[] {
    const list: string[] = [];
    if (itemPath) {
      list.push(`${itemPath}/media/${art}`);
      list.push(`${itemPath}/${art}`);
      if (!art.endsWith('.png') && !art.endsWith('.jpg')) {
        list.push(`${itemPath}/media/${art}.png`);
        list.push(`${itemPath}/${art}.png`);
      }
    }
    list.push(`media/${art}`);
    list.push(art);
    if (!art.endsWith('.png') && !art.endsWith('.jpg')) {
      list.push(`media/${art}.png`);
      list.push(`${art}.png`);
    }
    return list;
  }

  private async triggerBackgroundDownload(
    art: string,
    channel: 'beta' | 'stable',
    options: ResolveImageOptions
  ): Promise<void> {
    if (!this.store || !this.fileStorage) return;

    try {
      const pointer = await this.store.getActivePointer(channel);
      if (!pointer?.manifest?.files) return;

      const candidates = this.getCandidates(art, options.itemPath);
      let matchedPath: string | null = null;
      let fileInfo: { sha256: string; size: number } | null = null;

      for (const cand of candidates) {
        if (pointer.manifest.files[cand]) {
          matchedPath = cand;
          fileInfo = pointer.manifest.files[cand];
          break;
        }
      }

      if (!matchedPath || !fileInfo) return;

      const ext = matchedPath.includes('.') ? `.${matchedPath.split('.').pop()}` : '.png';
      const storageKey = `files/${fileInfo.sha256}${ext}`;
      const url = channelFileUrl(channel, storageKey, this.contentBase);
      if (!url) return;

      const res = await this.http.fetch(url, { timeoutMs: 8000 });
      if (res.status !== 200) return;

      const data = await res.binary();
      const hash = await sha256Hex(data);
      if (hash.toLowerCase() !== fileInfo.sha256.toLowerCase()) return;

      const activeDir = this.store.getActiveDir(channel);
      const targetPath = `${activeDir}/${matchedPath}`;

      // Ensure directory
      const parts = targetPath.split('/');
      parts.pop();
      const dir = parts.join('/');
      if (!(await this.fileStorage.exists(dir))) {
        await this.fileStorage.makeDirectory(dir);
      }

      await this.fileStorage.writeAsBinary(targetPath, data);

      // Notify listener
      options.onDownloaded?.(targetPath);
    } catch {
      // Non-fatal
    }
  }
}
