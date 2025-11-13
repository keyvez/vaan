#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const defaultSchemaPath = path.join(repoRoot, 'db', 'd1', 'schema.sql');
const wranglerLogDir = path.join(repoRoot, '.wrangler-logs');
if (!fs.existsSync(wranglerLogDir)) {
  fs.mkdirSync(wranglerLogDir, { recursive: true });
}

const POS_MAP = new Map([
  ['adj', 'adjective'],
  ['adv', 'adverb'],
  ['m', 'masculine noun'],
  ['f', 'feminine noun'],
  ['n', 'neuter noun'],
  ['masc', 'masculine noun'],
  ['fem', 'feminine noun'],
  ['neu', 'neuter noun'],
  ['pron', 'pronoun'],
  ['prep', 'preposition'],
  ['pref', 'prefix'],
  ['suf', 'suffix'],
  ['suffix', 'suffix'],
  ['prefix', 'prefix'],
  ['num', 'numeral'],
  ['conj', 'conjunction'],
  ['int', 'interjection'],
  ['interj', 'interjection'],
  ['part', 'particle'],
  ['ppp', 'past passive participle'],
  ['pp', 'past participle'],
  ['ger', 'gerund'],
  ['vt', 'transitive verb'],
  ['vi', 'intransitive verb'],
  ['v', 'verb']
]);

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    exitWithMessage('Missing required --file <path> argument');
  }

  if (!args.database && !args.dryRun) {
    exitWithMessage('Missing required --database <d1-database-name> argument');
  }

  const wordlistPath = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(wordlistPath)) {
    exitWithMessage(`Wordlist file not found at ${wordlistPath}`);
  }

  const entries = await loadEntries(wordlistPath, args.limit);
  if (!entries.length) {
    exitWithMessage('No ingestible entries found in the provided wordlist.');
  }

  if (args.dryRun) {
    console.log(`Parsed ${entries.length} entries.`);
    console.log('Preview:', entries.slice(0, 5));
    return;
  }

  if (!args.skipSchema) {
    await applySchema(args.database, args.schema ?? defaultSchemaPath);
  }

  await ingestEntries(args.database, entries, args.batchSize);
}

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
    skipSchema: false,
    batchSize: 200
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--file':
      case '-f':
        parsed.file = argv[++i];
        break;
      case '--database':
      case '-d':
        parsed.database = argv[++i];
        break;
      case '--schema':
        parsed.schema = argv[++i];
        break;
      case '--dry-run':
        parsed.dryRun = true;
        break;
      case '--skip-schema':
        parsed.skipSchema = true;
        break;
      case '--batch-size':
        parsed.batchSize = parseInt(argv[++i], 10) || parsed.batchSize;
        break;
      case '--limit':
        parsed.limit = parseInt(argv[++i], 10);
        break;
      default:
        if (token.startsWith('-')) {
          exitWithMessage(`Unknown flag: ${token}`);
        }
        break;
    }
  }

  return parsed;
}

async function loadEntries(filePath, limit) {
  const stream = fs.createReadStream(filePath, 'utf8');
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const entries = [];
  for await (const line of rl) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    entries.push(parsed);
    if (limit && entries.length >= limit) break;
  }

  rl.close();

  return entries;
}

function parseLine(line) {
  if (!line) return null;
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return null;
  const left = trimmed.slice(0, eqIdx).trim();
  const right = trimmed.slice(eqIdx + 1).trim();
  if (!left || !right) return null;

  const { sanskrit, transliteration } = extractWordAndTransliteration(left);
  const { normalizedMeanings, primary, partOfSpeech } = extractMeanings(right);

  return {
    sanskrit,
    transliteration,
    primaryMeaning: primary,
    englishMeanings: normalizedMeanings,
    partOfSpeech,
    hindiMeaning: null,
    tags: null,
    raw: trimmed
  };
}

function extractWordAndTransliteration(left) {
  const match = left.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (match) {
    return {
      sanskrit: match[1].trim(),
      transliteration: match[2].trim()
    };
  }
  return { sanskrit: left.trim(), transliteration: null };
}

function extractMeanings(rawRight) {
  const cleaned = rawRight.replace(/\s+/g, ' ').trim();
  let primary = cleaned;
  let partOfSpeech = null;
  const posResult = detectPartOfSpeech(primary);
  if (posResult) {
    partOfSpeech = posResult.partOfSpeech;
    primary = posResult.cleanedMeaning;
  }

  const normalizedParts = splitMeanings(primary)
    .map((piece) => piece.trim())
    .filter(Boolean);

  const englishMeanings = normalizedParts.length ? normalizedParts : [primary];

  return {
    normalizedMeanings: englishMeanings,
    primary: englishMeanings[0] ?? primary,
    partOfSpeech
  };
}

function splitMeanings(text) {
  const normalized = text.replace(/\s+or\s+/gi, ',');
  return normalized.split(/[,;\/]+/);
}

function detectPartOfSpeech(rawMeaning) {
  const normalized = rawMeaning.trim();
  const prefixMatch = normalized.match(/^([a-zA-Z\.\/]+)\s+(.+)/);
  if (!prefixMatch) return null;
  const prefix = prefixMatch[1]
    .replace(/\.$/, '')
    .toLowerCase();
  const mapped = POS_MAP.get(prefix);
  if (!mapped) return null;
  return {
    partOfSpeech: mapped,
    cleanedMeaning: prefixMatch[2].trim()
  };
}

async function applySchema(databaseName, schemaPath) {
  const resolvedSchema = path.resolve(schemaPath);
  if (!fs.existsSync(resolvedSchema)) {
    exitWithMessage(`Schema file not found at ${resolvedSchema}`);
  }
  console.log(`Applying schema from ${resolvedSchema} to ${databaseName}...`);
  await runWrangler(['d1', 'execute', databaseName, '--remote', '--file', resolvedSchema]);
}

async function ingestEntries(databaseName, entries, batchSize = 200) {
  console.log(`Beginning ingestion of ${entries.length} entries in batches of ${batchSize}.`);
  const chunks = chunk(entries, batchSize);
  for (let i = 0; i < chunks.length; i += 1) {
    const sql = buildInsertSql(chunks[i]);
    console.log(`Uploading batch ${i + 1}/${chunks.length} (${chunks[i].length} rows)...`);
    await runWrangler(['d1', 'execute', databaseName, '--remote', '--command', sql]);
  }
  console.log('Ingestion complete.');
}

function buildInsertSql(batch) {
  const values = batch
    .map((entry) => {
      const columns = [
        `'${escapeSql(entry.sanskrit)}'`,
        entry.transliteration ? `'${escapeSql(entry.transliteration)}'` : 'NULL',
        `'${escapeSql(entry.primaryMeaning)}'`,
        `'${escapeSql(JSON.stringify(entry.englishMeanings))}'`,
        entry.partOfSpeech ? `'${escapeSql(entry.partOfSpeech)}'` : 'NULL',
        entry.hindiMeaning ? `'${escapeSql(entry.hindiMeaning)}'` : 'NULL',
        entry.tags ? `'${escapeSql(entry.tags)}'` : 'NULL',
        `'${escapeSql(entry.raw)}'`
      ];
      return `(${columns.join(', ')})`;
    })
    .join(', ');

  return [
    'INSERT OR REPLACE INTO lexemes (sanskrit, transliteration, primary_meaning, english_meanings, part_of_speech, hindi_meaning, tags, raw_entry) VALUES',
    values,
    ';'
  ].join('\n');
}

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('wrangler', args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || wranglerLogDir,
        WRANGLER_LOG: process.env.WRANGLER_LOG || 'info'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Wrangler exited with code ${code}: ${stderr || stdout}`));
      }
      if (stdout.trim()) {
        console.log(stdout.trim());
      }
      if (stderr.trim()) {
        console.error(stderr.trim());
      }
      return resolve();
    });
  });
}

function exitWithMessage(message) {
  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  console.error('Ingestion failed:', error.message);
  process.exit(1);
});
