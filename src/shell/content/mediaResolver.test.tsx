jest.mock('react-native', () => {
  return {
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    processColor: (c: any) => c,
  };
});
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props),
    Circle: (props: any) => React.createElement('circle', props),
    Ellipse: (props: any) => React.createElement('ellipse', props),
    G: (props: any) => React.createElement('g', props, props.children),
    Rect: (props: any) => React.createElement('rect', props),
  };
});
jest.mock('../ui/theme', () => ({
  theme: { radius: { lg: 0 }, depth: { sm: { x: 0 } }, mascot: { coat: '', coatDark: '', coatLight: '' } },
  usePalette: () => ({ surfaceSunken: 'rgba(240, 240, 240, 1)' }),
}));
jest.mock('../ui/CanineMinigameAvatar', () => ({
  CanineMinigameAvatar: () => null,
}));

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ContentPicture } from '../ui/ContentPicture';
import { MediaResolver } from './mediaResolver';
import { ContentStore, type FileStorage, type KeyValueStorage } from './store';
import { type HttpFetcher, type HttpResponse } from './updater';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

class FakeHttpServer implements HttpFetcher {
  routes: Map<string, { status: number; body: Uint8Array; delayMs?: number }> = new Map();
  onRequest?: (url: string) => void;
  deferredResolve?: () => void;

  setRoute(url: string, body: Uint8Array) {
    this.routes.set(url, { status: 200, body });
  }

  async fetch(url: string): Promise<HttpResponse> {
    this.onRequest?.(url);
    if (this.deferredResolve !== undefined) {
      await new Promise<void>((r) => {
        this.deferredResolve = r;
      });
    }
    const route = this.routes.get(url);
    if (!route) {
      return {
        status: 404,
        text: async () => 'Not found',
        binary: async () => new Uint8Array(),
      };
    }
    return {
      status: route.status,
      text: async () => new TextDecoder().decode(route.body),
      binary: async () => route.body,
    };
  }
}

class MemoryKeyValueStorage implements KeyValueStorage {
  store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class MemoryFileStorage implements FileStorage {
  files = new Map<string, Uint8Array>();
  dirs = new Set<string>();

  private norm(p: string): string {
    return p.replace(/\/+/g, '/').replace(/\/$/, '');
  }

  async readAsString(p: string): Promise<string> {
    const data = this.files.get(this.norm(p));
    if (!data) throw new Error(`File not found: ${p}`);
    return new TextDecoder().decode(data);
  }

  async writeAsString(p: string, contents: string): Promise<void> {
    this.files.set(this.norm(p), new TextEncoder().encode(contents));
  }

  async readAsBinary(p: string): Promise<Uint8Array> {
    const data = this.files.get(this.norm(p));
    if (!data) throw new Error(`File not found: ${p}`);
    return data;
  }

  async writeAsBinary(p: string, data: Uint8Array): Promise<void> {
    this.files.set(this.norm(p), data);
  }

  async exists(p: string): Promise<boolean> {
    const n = this.norm(p);
    if (this.files.has(n)) return true;
    for (const d of this.dirs) {
      if (d === n || d.startsWith(`${n}/`)) return true;
    }
    for (const f of this.files.keys()) {
      if (f === n || f.startsWith(`${n}/`)) return true;
    }
    return false;
  }

  async deleteFile(p: string): Promise<void> {
    this.files.delete(this.norm(p));
  }

  async deleteDirectory(p: string): Promise<void> {
    const prefix = `${this.norm(p)}/`;
    for (const k of [...this.files.keys()]) {
      if (k === this.norm(p) || k.startsWith(prefix)) {
        this.files.delete(k);
      }
    }
    for (const d of [...this.dirs]) {
      if (d === this.norm(p) || d.startsWith(prefix)) {
        this.dirs.delete(d);
      }
    }
  }

  async makeDirectory(p: string): Promise<void> {
    this.dirs.add(this.norm(p));
  }

  async listDirectory(p: string): Promise<string[]> {
    const normDir = this.norm(p);
    const prefix = `${normDir}/`;
    const names = new Set<string>();
    for (const k of this.files.keys()) {
      if (k.startsWith(prefix)) {
        const rest = k.slice(prefix.length);
        names.add(rest.split('/')[0]);
      }
    }
    for (const d of this.dirs) {
      if (d.startsWith(prefix) && d !== normDir) {
        const rest = d.slice(prefix.length);
        names.add(rest.split('/')[0]);
      }
    }
    return Array.from(names);
  }

  async copy(from: string, to: string): Promise<void> {
    const data = await this.readAsBinary(from);
    await this.writeAsBinary(to, data);
  }

  async move(from: string, to: string): Promise<void> {
    const nFrom = this.norm(from);
    const nTo = this.norm(to);
    const prefix = `${nFrom}/`;

    if (this.files.has(nFrom)) {
      const data = this.files.get(nFrom)!;
      this.files.delete(nFrom);
      this.files.set(nTo, data);
      return;
    }

    for (const [k, v] of [...this.files.entries()]) {
      if (k.startsWith(prefix)) {
        this.files.delete(k);
        this.files.set(`${nTo}/${k.slice(prefix.length)}`, v);
      }
    }
    for (const d of [...this.dirs]) {
      if (d === nFrom || d.startsWith(prefix)) {
        this.dirs.delete(d);
        this.dirs.add(`${nTo}/${d.slice(prefix.length)}`);
      }
    }
  }
}

describe('MediaResolver & ContentPicture Component', () => {
  const CONTENT_BASE = 'https://content.example.com';
  const mockTranslate = (key: string) => key;

  let server: FakeHttpServer;
  let fileStorage: MemoryFileStorage;
  let kvStorage: MemoryKeyValueStorage;
  let store: ContentStore;
  let resolver: MediaResolver;

  beforeEach(() => {
    server = new FakeHttpServer();
    fileStorage = new MemoryFileStorage();
    kvStorage = new MemoryKeyValueStorage();
    store = new ContentStore(fileStorage, kvStorage, '/app/content');
    resolver = new MediaResolver(store, fileStorage, server, CONTENT_BASE);
  });

  it('renders bundled image immediately without placeholder', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ContentPicture t={mockTranslate} art="body-language-1" resolver={resolver} />
      );
    });

    const root = renderer!.root;
    // Should render image, not placeholder
    const placeholders = root.findAllByProps({ testID: 'content-placeholder' });
    expect(placeholders.length).toBe(0);
  });

  it('missing image shows themed placeholder, requests file, and replaces on arrival', async () => {
    // 1. Setup mock remote file & manifest
    const imageBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const imageHash = await sha256Hex(imageBytes);

    server.setRoute(`${CONTENT_BASE}/beta/files/${imageHash}.png`, imageBytes);

    const manifest: ContentManifest = {
      channel: 'beta',
      contentVersion: 1,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: {
        'lessons/test-lesson/media/new-art.png': {
          sha256: imageHash,
          size: imageBytes.length,
        },
      },
    };

    // Store active pointer in KV
    await kvStorage.setItem(
      '@leadmate:content_active_beta',
      JSON.stringify({
        channel: 'beta',
        contentVersion: 1,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        activatedAt: '2026-11-06T18:00:00Z',
        manifest,
      })
    );

    // Setup deferred HTTP request so we can verify the placeholder state before the download arrives
    let releaseDownload: (() => void) | null = null;
    server.deferredResolve = () => {};
    let downloadRequested = false;
    server.onRequest = () => {
      downloadRequested = true;
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ContentPicture
          t={mockTranslate}
          art="new-art.png"
          itemPath="lessons/test-lesson"
          channel="beta"
          resolver={resolver}
        />
      );
    });

    // Initially while download is pending, placeholder MUST be shown
    const initialPlaceholders = renderer!.root.findAllByProps({ testID: 'content-placeholder' });
    expect(initialPlaceholders.length).toBe(1);

    // File was requested from server
    expect(downloadRequested).toBe(true);

    // Now resolve the download and let the image arrive
    await act(async () => {
      if (server.deferredResolve) {
        server.deferredResolve();
      }
      await new Promise((r) => setTimeout(r, 20));
    });

    // Now placeholder should be GONE and image shown
    const finalPlaceholders = renderer!.root.findAllByProps({ testID: 'content-placeholder' });
    expect(finalPlaceholders.length).toBe(0);

    const images = renderer!.root.findAllByProps({ testID: 'content-image' });
    expect(images.length).toBe(1);
    expect(images[0].props.source.uri).toContain('new-art.png');
  });
});
