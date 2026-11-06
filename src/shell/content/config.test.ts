import {
  channelFileUrl,
  channelLatestUrl,
  channelManifestUrl,
  cleanDevContentUrl,
  cleanHttpsContentBase,
  hasRemoteContent,
  resolveContentBase,
} from './config';

describe('Content base configuration & URL resolver', () => {
  describe('cleanHttpsContentBase', () => {
    it('accepts valid https URL and removes trailing slashes', () => {
      expect(cleanHttpsContentBase('https://content.example.com/storage/v1/content///')).toBe(
        'https://content.example.com/storage/v1/content'
      );
    });

    it('rejects http URLs', () => {
      expect(cleanHttpsContentBase('http://content.example.com/content')).toBe('');
    });

    it('rejects empty, null, or malformed URLs', () => {
      expect(cleanHttpsContentBase('')).toBe('');
      expect(cleanHttpsContentBase(null)).toBe('');
      expect(cleanHttpsContentBase(undefined)).toBe('');
      expect(cleanHttpsContentBase('not-a-url')).toBe('');
    });
  });

  describe('resolveContentBase', () => {
    it('returns empty string when unset (meaning baseline only, no requests)', () => {
      expect(resolveContentBase({ contentBase: '', isDev: false })).toBe('');
      expect(resolveContentBase({ contentBase: undefined, isDev: false })).toBe('');
      expect(hasRemoteContent('')).toBe(false);
    });

    it('strictly ignores dev URL in production', () => {
      const resolved = resolveContentBase({
        contentBase: 'https://cdn.example.com/content',
        contentDevUrl: 'http://localhost:8081/dist/content',
        isDev: false,
      });
      expect(resolved).toBe('https://cdn.example.com/content');

      // Even if contentBase is unset, dev URL must be ignored in production
      const resolvedUnset = resolveContentBase({
        contentBase: undefined,
        contentDevUrl: 'http://localhost:8081/dist/content',
        isDev: false,
      });
      expect(resolvedUnset).toBe('');
    });

    it('allows dev URL in development mode', () => {
      const resolved = resolveContentBase({
        contentBase: 'https://cdn.example.com/content',
        contentDevUrl: 'http://localhost:8081/dist/content',
        isDev: true,
      });
      expect(resolved).toBe('http://localhost:8081/dist/content');
    });

    it('falls back to contentBase in development mode if dev URL is empty', () => {
      const resolved = resolveContentBase({
        contentBase: 'https://cdn.example.com/content',
        contentDevUrl: '',
        isDev: true,
      });
      expect(resolved).toBe('https://cdn.example.com/content');
    });
  });

  describe('channel URL helpers', () => {
    const BASE = 'https://content.example.com/packs';

    it('constructs latest pointer URL', () => {
      expect(channelLatestUrl('beta', BASE)).toBe('https://content.example.com/packs/beta/latest.json');
      expect(channelLatestUrl('stable', BASE)).toBe('https://content.example.com/packs/stable/latest.json');
      expect(channelLatestUrl('beta', '')).toBeNull();
    });

    it('constructs manifest URL and rejects path traversal', () => {
      expect(channelManifestUrl('beta', 'packs/1/manifest.json', BASE)).toBe(
        'https://content.example.com/packs/beta/packs/1/manifest.json'
      );
      expect(channelManifestUrl('beta', '/manifest.json', BASE)).toBe(
        'https://content.example.com/packs/beta/manifest.json'
      );
      // Path traversal or protocol injection
      expect(channelManifestUrl('beta', '../secret/manifest.json', BASE)).toBeNull();
      expect(channelManifestUrl('beta', 'https://evil.com/manifest.json', BASE)).toBeNull();
    });

    it('constructs file URL and rejects path traversal', () => {
      expect(channelFileUrl('beta', 'files/abcdef.png', BASE)).toBe(
        'https://content.example.com/packs/beta/files/abcdef.png'
      );
      expect(channelFileUrl('beta', 'abcdef.png', BASE)).toBe(
        'https://content.example.com/packs/beta/files/abcdef.png'
      );
      // Rejects escaping
      expect(channelFileUrl('beta', '../../etc/passwd', BASE)).toBeNull();
      expect(channelFileUrl('beta', 'http://attacker.com/file.png', BASE)).toBeNull();
    });
  });
});
