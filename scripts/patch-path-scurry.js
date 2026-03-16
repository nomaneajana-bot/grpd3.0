#!/usr/bin/env node
/**
 * Patches all path-scurry copies in node_modules to work with ESM lru-cache
 * (Class extends value undefined). Run after npm install.
 */
const fs = require('fs');
const path = require('path');

const fix = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('LRUCacheClass')) return false;
  content = content.replace(
    /const lru_cache_1 = require\("lru-cache"\);\nconst node_path_1/,
    'const lru_cache_1 = require("lru-cache");\nconst LRUCacheClass = lru_cache_1.default || lru_cache_1.LRUCache;\nconst node_path_1'
  );
  content = content.replace(/extends lru_cache_1\.LRUCache/g, 'extends LRUCacheClass');
  fs.writeFileSync(filePath, content);
  return true;
};

const dir = path.join(__dirname, '..', 'node_modules');
const search = (d) => {
  try {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'path-scurry') {
          const target = path.join(full, 'dist', 'commonjs', 'index.js');
          if (fs.existsSync(target)) {
            if (fix(target)) console.log('Patched:', target);
          }
        } else if (e.name !== '.bin') {
          search(full);
        }
      }
    }
  } catch (_) {}
};
search(dir);
