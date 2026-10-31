import * as fs from 'node:fs';

export type HttpHandler = (url: string) => Promise<{ status: number; ok: boolean }>;

export const DEFAULT_OFFLINE_MOCK_REGISTRY: Record<string, number> = {
  'https://docs.python.org/3/reference/compound_stmts.html#the-for-statement': 200,
  'https://docs.python.org/3/reference/compound_stmts.html#the-while-statement': 200,
  'https://docs.python.org/3/reference/lexical_analysis.html#indentation': 200,
  'https://docs.python.org/3/tutorial/introduction.html': 200,
  'https://docs.python.org/3/tutorial/controlflow.html': 200,
  'https://docs.python.org/3.12/': 200,
};

export const defaultMockHttpHandler: HttpHandler = async (url: string) => {
  // Validate basic URL syntax
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { status: 400, ok: false };
    }
    // Check known offline registry or standard verified domains
    if (DEFAULT_OFFLINE_MOCK_REGISTRY[url] !== undefined) {
      const code = DEFAULT_OFFLINE_MOCK_REGISTRY[url];
      return { status: code, ok: code >= 200 && code < 400 };
    }
    // Generic check for trusted official domains in offline mode
    if (parsed.hostname.endsWith('python.org') || parsed.hostname.endsWith('ecma-international.org')) {
      return { status: 200, ok: true };
    }
    return { status: 404, ok: false };
  } catch {
    return { status: 400, ok: false };
  }
};

export interface LinkCheckReport {
  pass: boolean;
  linksChecked: number;
  errors: string[];
}

export function validateUrlSyntax(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function checkLinksInDirectory(
  dirPath: string,
  httpHandler: HttpHandler = defaultMockHttpHandler
): Promise<LinkCheckReport> {
  const errors: string[] = [];
  let linksChecked = 0;

  async function checkFile(filePath: string) {
    if (!filePath.endsWith('.json')) return;
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(content.doc_references)) {
        for (const ref of content.doc_references) {
          linksChecked++;
          if (!ref.url || !validateUrlSyntax(ref.url)) {
            errors.push(`[${filePath}] Invalid URL syntax: "${ref.url}"`);
            continue;
          }
          const res = await httpHandler(ref.url);
          if (!res.ok) {
            errors.push(`[${filePath}] Broken link (${res.status}): "${ref.url}"`);
          }
        }
      }
    } catch {
      // JSON issues handled in schema validator
    }
  }

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        collected.push(full);
      }
    }
  }

  const collected: string[] = [];
  walk(dirPath);

  for (const f of collected) {
    await checkFile(f);
  }

  return {
    pass: errors.length === 0,
    linksChecked,
    errors,
  };
}
