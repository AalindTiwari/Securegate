/**
 * run-custom-code/sandbox.ts — Security validation for user-provided code
 *
 * Scans for dangerous patterns, validates imports, and ensures custom code
 * cannot escape the sandbox to access the host system.
 */

// ── Blocked Patterns ─────────────────────────────────────────────────────────

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string; severity: 'block' | 'warn' }> = [
    // Process / system access
    { pattern: /Deno\s*\.\s*run\b/g, reason: 'Process spawning via Deno.run', severity: 'block' },
    { pattern: /Deno\s*\.\s*Command\b/g, reason: 'Process spawning via Deno.Command', severity: 'block' },
    { pattern: /Deno\s*\.\s*exec\b/gi, reason: 'Process execution', severity: 'block' },
    { pattern: /child_process/g, reason: 'Node child_process module', severity: 'block' },
    { pattern: /\bexec\s*\(/g, reason: 'Shell execution via exec()', severity: 'block' },
    { pattern: /\bexecSync\b/g, reason: 'Synchronous shell execution', severity: 'block' },
    { pattern: /\bspawn\s*\(/g, reason: 'Process spawning via spawn()', severity: 'block' },

    // File system access
    { pattern: /Deno\s*\.\s*readFile\b/g, reason: 'File reading via Deno.readFile', severity: 'block' },
    { pattern: /Deno\s*\.\s*writeFile\b/g, reason: 'File writing via Deno.writeFile', severity: 'block' },
    { pattern: /Deno\s*\.\s*readTextFile\b/g, reason: 'File reading via Deno.readTextFile', severity: 'block' },
    { pattern: /Deno\s*\.\s*writeTextFile\b/g, reason: 'File writing via Deno.writeTextFile', severity: 'block' },
    { pattern: /Deno\s*\.\s*mkdir\b/g, reason: 'Directory creation', severity: 'block' },
    { pattern: /Deno\s*\.\s*remove\b/g, reason: 'File/directory removal', severity: 'block' },
    { pattern: /Deno\s*\.\s*rename\b/g, reason: 'File renaming', severity: 'block' },
    { pattern: /Deno\s*\.\s*stat\b/g, reason: 'File stat access', severity: 'block' },
    { pattern: /Deno\s*\.\s*open\b/g, reason: 'File opening via Deno.open', severity: 'block' },
    { pattern: /Deno\s*\.\s*readDir\b/g, reason: 'Directory listing', severity: 'block' },
    { pattern: /\bfs\s*\.\s*(read|write|unlink|mkdir|rmdir|access|stat|open)/g, reason: 'Node fs module access', severity: 'block' },
    { pattern: /require\s*\(\s*['"]fs['"]\s*\)/g, reason: 'Node fs module import', severity: 'block' },
    { pattern: /require\s*\(\s*['"]path['"]\s*\)/g, reason: 'Node path module import', severity: 'block' },

    // Network server creation (outbound fetch is OK)
    { pattern: /Deno\s*\.\s*listen\b/g, reason: 'Starting a network listener', severity: 'block' },
    { pattern: /Deno\s*\.\s*listenTls\b/g, reason: 'Starting a TLS listener', severity: 'block' },
    { pattern: /Deno\s*\.\s*serveHttp\b/g, reason: 'Starting an HTTP server', severity: 'block' },
    { pattern: /net\s*\.\s*createServer/g, reason: 'Creating a TCP server', severity: 'block' },
    { pattern: /Deno\s*\.\s*serve\b/g, reason: 'Starting a Deno server (reserved)', severity: 'block' },

    // Environment access
    { pattern: /Deno\s*\.\s*env\b/g, reason: 'Environment variable access', severity: 'block' },
    { pattern: /process\s*\.\s*env\b/g, reason: 'Node process.env access', severity: 'block' },
    { pattern: /process\s*\.\s*exit\b/g, reason: 'Process termination', severity: 'block' },

    // Dynamic code execution (the handler itself uses eval, but user code must not)
    { pattern: /\beval\s*\(/g, reason: 'Dynamic code execution via eval()', severity: 'block' },
    { pattern: /new\s+Function\s*\(/g, reason: 'Dynamic code via Function constructor', severity: 'block' },
    { pattern: /import\s*\(/g, reason: 'Dynamic import()', severity: 'block' },

    // Prototype pollution
    { pattern: /__proto__/g, reason: 'Prototype pollution via __proto__', severity: 'block' },
    { pattern: /constructor\s*\[\s*['"]prototype['"]\s*\]/g, reason: 'Prototype pollution via constructor', severity: 'block' },
    { pattern: /Object\s*\.\s*setPrototypeOf/g, reason: 'Prototype manipulation', severity: 'block' },

    // WebAssembly (potential sandbox escape)
    { pattern: /WebAssembly\s*\./g, reason: 'WebAssembly usage', severity: 'block' },

    // Global manipulation
    { pattern: /globalThis\b/g, reason: 'Global scope access', severity: 'warn' },
    { pattern: /\bwindow\b/g, reason: 'Window global access', severity: 'warn' },
];

// ── Import Allowlist ─────────────────────────────────────────────────────────

// These are the ONLY import sources allowed in user code
const ALLOWED_IMPORT_PREFIXES = [
    'https://esm.sh/',          // ESM CDN
    'https://cdn.skypack.dev/', // Skypack CDN
    'https://unpkg.com/',       // unpkg CDN
    'https://deno.land/std/',   // Deno standard library (limited)
    'npm:',                     // npm specifier
];

// Blocked npm packages
const BLOCKED_PACKAGES = [
    'fs', 'path', 'os', 'child_process', 'cluster', 'dgram',
    'net', 'tls', 'http2', 'worker_threads', 'vm', 'v8',
    'perf_hooks', 'async_hooks', 'trace_events', 'inspector',
    'readline', 'repl',
];

// ── Validation Functions ─────────────────────────────────────────────────────

export interface ValidationResult {
    safe: boolean;
    violations: Array<{ pattern: string; reason: string; severity: string; line?: number }>;
    warnings: Array<{ pattern: string; reason: string; line?: number }>;
    blockedImports: string[];
}

/**
 * Scan code for dangerous patterns
 */
export function scanDangerousPatterns(code: string): ValidationResult {
    const violations: ValidationResult['violations'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const lines = code.split('\n');

    for (const entry of DANGEROUS_PATTERNS) {
        // Reset regex lastIndex
        entry.pattern.lastIndex = 0;

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];

            // Skip comments
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
                continue;
            }

            entry.pattern.lastIndex = 0;
            if (entry.pattern.test(line)) {
                const item = {
                    pattern: entry.pattern.source,
                    reason: entry.reason,
                    severity: entry.severity,
                    line: lineNum + 1,
                };

                if (entry.severity === 'block') {
                    violations.push(item);
                } else {
                    warnings.push(item);
                }
            }
        }
    }

    return {
        safe: violations.length === 0,
        violations,
        warnings,
        blockedImports: [],
    };
}

/**
 * Validate imports in user code
 */
export function validateImports(code: string): ValidationResult {
    const blockedImports: string[] = [];
    const violations: ValidationResult['violations'] = [];
    const lines = code.split('\n');

    // Match static import patterns
    const importRegex = /(?:import\s+.*from\s+['"](.+?)['"]|import\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const trimmedLine = line.trim();

        // Skip comments
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) continue;

        importRegex.lastIndex = 0;
        let match;
        while ((match = importRegex.exec(line)) !== null) {
            const importPath = match[1] || match[2] || match[3];
            if (!importPath) continue;

            // Check if it's a blocked Node built-in
            const basePkg = importPath.replace(/^node:/, '').split('/')[0];
            if (BLOCKED_PACKAGES.includes(basePkg)) {
                blockedImports.push(importPath);
                violations.push({
                    pattern: `import "${importPath}"`,
                    reason: `Blocked package: ${basePkg}`,
                    severity: 'block',
                    line: lineNum + 1,
                });
                continue;
            }

            // If it's a URL import, check against allowlist
            if (importPath.startsWith('http://') || importPath.startsWith('https://')) {
                const isAllowed = ALLOWED_IMPORT_PREFIXES.some(prefix => importPath.startsWith(prefix));
                if (!isAllowed) {
                    blockedImports.push(importPath);
                    violations.push({
                        pattern: `import "${importPath}"`,
                        reason: `Import from untrusted source. Allowed: ${ALLOWED_IMPORT_PREFIXES.join(', ')}`,
                        severity: 'block',
                        line: lineNum + 1,
                    });
                }
            }

            // Relative imports are allowed (within the handler scope)
            // npm: imports are allowed (handled by Deno)
        }
    }

    return {
        safe: violations.length === 0,
        violations,
        warnings: [],
        blockedImports,
    };
}

/**
 * Full validation — combines pattern scanning and import validation
 */
export function validateCode(code: string): ValidationResult {
    const patterns = scanDangerousPatterns(code);
    const imports = validateImports(code);

    return {
        safe: patterns.safe && imports.safe,
        violations: [...patterns.violations, ...imports.violations],
        warnings: patterns.warnings,
        blockedImports: imports.blockedImports,
    };
}

/**
 * Sanitize output to strip leaked secrets/paths
 */
export function sanitizeOutput(text: string): string {
    if (!text || typeof text !== 'string') return text;

    // Strip environment variable values that look like secrets
    let sanitized = text
        // JWT tokens
        .replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
        // Supabase service role keys
        .replace(/service_role['":\s]*eyJ[A-Za-z0-9_-]+/g, 'service_role: [REDACTED]')
        // Generic API keys (long hex/base64 strings)
        .replace(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?/gi, '$1=[REDACTED]')
        // File system paths
        .replace(/\/home\/deno\/[^\s"']*/g, '[REDACTED_PATH]')
        .replace(/\/tmp\/[^\s"']*/g, '[REDACTED_PATH]')
        // IP addresses (optional)
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED_IP]');

    return sanitized;
}
