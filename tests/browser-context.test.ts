import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BrowserContextManager } from '../src/rpa/browser-context';
import { AppConfig } from '../src/types';

/**
 * These tests validate the BrowserContextManager initialization, configuration,
 * cookie import/export, and lifecycle management. Integration tests that require
 * a running browser are marked with .skip and can be run manually.
 */

function createTestConfig(overrides?: Partial<AppConfig>): AppConfig {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-test-'));
  return {
    role: 'worker',
    browser: {
      dataDir: path.join(tmpDir, 'browser-data'),
      cookieDir: path.join(tmpDir, 'cookies'),
      headless: true,
      viewport: { width: 1920, height: 1080 },
    },
    fingerprint: {
      rotationIntervalMs: 16200000,
      rotationIntervalMinMs: 14400000,
      rotationIntervalMaxMs: 21600000,
      timezones: ['America/New_York', 'Europe/Berlin'],
      viewports: [
        { width: 1920, height: 1080 },
        { width: 1440, height: 900 },
      ],
    },
    autoRestart: {
      enabled: true,
      maxAttempts: 3,
      delayMs: 100,
      resetAfterMs: 300000,
    },
    ...overrides,
  };
}

describe('BrowserContextManager', () => {
  let manager: BrowserContextManager;
  let config: AppConfig;

  beforeEach(() => {
    config = createTestConfig();
    manager = new BrowserContextManager(config);
  });

  afterEach(async () => {
    try {
      await manager.close();
    } catch {
      // Ignore cleanup errors
    }
    // Clean up tmp directories
    if (fs.existsSync(config.browser.dataDir)) {
      fs.rmSync(path.dirname(config.browser.dataDir), { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    it('should start in idle state', () => {
      expect(manager.getState()).toBe('idle');
    });

    it('should have no context initially', () => {
      expect(manager.getContext()).toBeNull();
    });

    it('should have no fingerprint initially', () => {
      expect(manager.getFingerprint()).toBeNull();
    });

    it('should create required directories on construction', () => {
      expect(fs.existsSync(config.browser.dataDir)).toBe(true);
      expect(fs.existsSync(config.browser.cookieDir)).toBe(true);
    });
  });

  describe('cookie import', () => {
    it('should handle missing cookie file gracefully', async () => {
      // importCookies without a running context should warn but not throw
      // for missing file path
      await expect(manager.importCookies('/nonexistent/cookies.json')).resolves.not.toThrow();
    });

    it('should throw if context not running when importing valid cookies', async () => {
      const cookiePath = path.join(config.browser.cookieDir, 'test-cookies.json');
      fs.writeFileSync(
        cookiePath,
        JSON.stringify([
          {
            name: 'session',
            value: 'abc123',
            domain: '.example.com',
            path: '/',
          },
        ]),
      );

      await expect(manager.importCookies(cookiePath)).rejects.toThrow(
        'Browser context not running',
      );
    });
  });

  describe('cookie export', () => {
    it('should handle export when no context is running', async () => {
      // Should not throw, just warn
      await expect(manager.exportCookies()).resolves.not.toThrow();
    });
  });

  describe('close', () => {
    it('should set state to stopped on close', async () => {
      await manager.close();
      expect(manager.getState()).toBe('stopped');
    });
  });

  // Integration test — requires Playwright browsers installed
  describe('launch (integration)', () => {
    // Increase timeout for browser launch
    jest.setTimeout(30000);

    it('should launch browser and return context', async () => {
      const context = await manager.launch();

      expect(context).toBeDefined();
      expect(manager.getState()).toBe('running');
      expect(manager.getContext()).toBe(context);
      expect(manager.getFingerprint()).toBeDefined();
      expect(manager.getFingerprint()?.userAgent).toContain('Chrome/');
    });

    it('should return existing context if already running', async () => {
      const context1 = await manager.launch();
      const context2 = await manager.launch();
      expect(context2).toBe(context1);
    });

    it('should apply fingerprint to the browser context', async () => {
      await manager.launch();
      const fp = manager.getFingerprint();

      expect(fp).toBeDefined();
      expect(fp!.viewport.width).toBeGreaterThan(0);
      expect(fp!.timezone).toBeDefined();
      expect(fp!.userAgent).toContain('Chrome/');
    });

    it('should export and import cookies round-trip', async () => {
      const context = await manager.launch();

      // Add a test cookie
      await context.addCookies([
        {
          name: 'test_cookie',
          value: 'test_value',
          domain: 'example.com',
          path: '/',
        },
      ]);

      // Export
      const exportPath = path.join(config.browser.cookieDir, 'export-test.json');
      await manager.exportCookies(exportPath);

      // Verify export file exists
      expect(fs.existsSync(exportPath)).toBe(true);
      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
      expect(exported).toBeInstanceOf(Array);
      expect(exported.length).toBeGreaterThanOrEqual(1);
      const testCookie = exported.find(
        (c: { name: string }) => c.name === 'test_cookie',
      );
      expect(testCookie).toBeDefined();
      expect(testCookie.value).toBe('test_value');
    });
  });
});
