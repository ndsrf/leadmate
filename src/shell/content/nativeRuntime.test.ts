import {
  initNativeContent,
  switchContentChannel,
  MemoryFileStorage,
  getNativeFileStorage,
  getNativeContentStore,
  getNativeContentUpdater,
  resetNativeRuntimeForTesting,
  asyncStorageKeyValue,
} from './nativeRuntime';
import { getActiveContent, setActiveContent } from './runtime';
import { BASELINE_PACK } from './baseline.generated';

describe('nativeRuntime', () => {
  beforeEach(() => {
    setActiveContent(null);
    resetNativeRuntimeForTesting();
  });

  describe('when no remote content base is configured', () => {
    it('returns bundled baseline immediately without network activity', async () => {
      const content = await initNativeContent({ contentBase: '' });
      expect(content.channel).toBe('stable');
      expect(content.isBaseline).toBe(true);
      expect(content.pack).toBe(BASELINE_PACK);
      expect(getActiveContent().channel).toBe('stable');
    });

    it('returns remote_unavailable when switching to non-cached beta without remote base', async () => {
      const res = await switchContentChannel('beta', { contentBase: '' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('remote_unavailable');
    });
  });

  describe('MemoryFileStorage', () => {
    let storage: MemoryFileStorage;

    beforeEach(() => {
      storage = new MemoryFileStorage();
    });

    it('writes and reads strings', async () => {
      await storage.writeAsString('/test/file.txt', 'hello world');
      expect(await storage.exists('/test/file.txt')).toBe(true);
      expect(await storage.readAsString('/test/file.txt')).toBe('hello world');
    });

    it('writes and reads binary bytes', async () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      await storage.writeAsBinary('/test/bin.dat', bytes);
      expect(await storage.exists('/test/bin.dat')).toBe(true);
      const read = await storage.readAsBinary('/test/bin.dat');
      expect(Array.from(read)).toEqual([1, 2, 3, 4, 5]);
    });

    it('lists directory contents', async () => {
      await storage.writeAsString('/dir/a.txt', 'a');
      await storage.writeAsString('/dir/b.txt', 'b');
      await storage.makeDirectory('/dir/sub');
      const list = await storage.listDirectory('/dir');
      expect(list).toContain('a.txt');
      expect(list).toContain('b.txt');
      expect(list).toContain('sub');
    });

    it('copies and moves files', async () => {
      await storage.writeAsString('/src/file.txt', 'copy me');
      await storage.copy('/src/file.txt', '/dst/file.txt');
      expect(await storage.readAsString('/dst/file.txt')).toBe('copy me');
      expect(await storage.exists('/src/file.txt')).toBe(true);

      await storage.move('/dst/file.txt', '/moved/file.txt');
      expect(await storage.exists('/dst/file.txt')).toBe(false);
      expect(await storage.readAsString('/moved/file.txt')).toBe('copy me');
    });

    it('deletes files and directories', async () => {
      await storage.writeAsString('/del/file1.txt', '1');
      await storage.writeAsString('/del/file2.txt', '2');
      await storage.deleteFile('/del/file1.txt');
      expect(await storage.exists('/del/file1.txt')).toBe(false);
      expect(await storage.exists('/del/file2.txt')).toBe(true);

      await storage.deleteDirectory('/del');
      expect(await storage.exists('/del/file2.txt')).toBe(false);
    });
  });

  describe('singleton getters', () => {
    it('creates and caches file storage, store and updater instances', () => {
      const storage1 = getNativeFileStorage();
      const storage2 = getNativeFileStorage();
      expect(storage1).toBe(storage2);

      const store1 = getNativeContentStore();
      const store2 = getNativeContentStore();
      expect(store1).toBe(store2);

      const updater1 = getNativeContentUpdater();
      const updater2 = getNativeContentUpdater();
      expect(updater1).toBe(updater2);
    });
  });
});
