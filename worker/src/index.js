const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WORD_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STATE_ROW_ID = 1;
const BATCH_SIZE = 5; // Process 5 words per request to avoid rate limits

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/word-of-day" && request.method === "GET") {
      try {
        const payload = await getWordOfDay(env);
        return jsonResponse(payload);
      } catch (error) {
        console.error("Failed to retrieve word of the day", error);
        return jsonResponse(
          { error: "Unable to retrieve word of the day" },
          500,
        );
      }
    }

    if (url.pathname === "/api/baby-names" && request.method === "GET") {
      try {
        const searchParams = url.searchParams;
        const gender = searchParams.get("gender") || "all";
        const letter = searchParams.get("letter") || "";
        const search = searchParams.get("search") || "";

        const names = await getBabyNames(env, gender, letter, search);

        // Process a batch of lexemes in the background (don't await)
        // This gradually builds up the baby names database
        // Prioritize the selected letter if provided
        if (env.GEMINI_API_KEY && ctx.waitUntil) {
          ctx.waitUntil(
            processLexemesBatch(env, letter).catch((err) => {
              console.error("Background lexeme processing failed:", err);
            }),
          );
        }

        return jsonResponse({ names });
      } catch (error) {
        console.error("Failed to retrieve baby names", error);
        return jsonResponse({ error: "Unable to retrieve baby names" }, 500);
      }
    }

    // Get individual baby name by slug
    if (url.pathname.match(/^\/api\/baby-names\/[^/]+$/) && request.method === "GET") {
      try {
        const slug = url.pathname.split("/").pop();
        const name = await getBabyNameBySlug(env, slug);

        if (!name) {
          return jsonResponse({ error: "Baby name not found" }, 404);
        }

        return jsonResponse(name);
      } catch (error) {
        console.error("Failed to retrieve baby name", error);
        return jsonResponse({ error: "Unable to retrieve baby name" }, 500);
      }
    }

    // Generate OG image for baby name
    if (url.pathname.match(/^\/api\/baby-names\/[^/]+\/og-image$/) && request.method === "GET") {
      try {
        const slug = url.pathname.split("/")[3];
        const name = await getBabyNameBySlug(env, slug);

        if (!name) {
          return new Response("Baby name not found", { status: 404 });
        }

        // Proxy to Rust worker for OG image generation
        const ogImageUrl = `https://vaan-og-images.keyvez.workers.dev/baby-name/${slug}?` +
          `name=${encodeURIComponent(name.name || '')}&` +
          `pronunciation=${encodeURIComponent(name.pronunciation || '')}&` +
          `meaning=${encodeURIComponent(name.meaning || '')}&` +
          `story=${encodeURIComponent(name.story || '')}&` +
          `gender=${encodeURIComponent(name.gender || '')}`;

        const ogResponse = await fetch(ogImageUrl);
        return new Response(ogResponse.body, {
          status: ogResponse.status,
          headers: ogResponse.headers,
        });
      } catch (error) {
        console.error("Failed to generate OG image", error);
        return new Response("Failed to generate image", { status: 500 });
      }
    }

    // Generate OG image for word of day
    if (url.pathname === "/api/word-of-day/og-image" && request.method === "GET") {
      try {
        const word = await getWordOfDay(env);

        // Proxy to Rust worker for OG image generation
        const ogImageUrl = `https://vaan-og-images.keyvez.workers.dev/word/${word.id}?` +
          `sanskrit=${encodeURIComponent(word.sanskrit || '')}&` +
          `transliteration=${encodeURIComponent(word.transliteration || '')}&` +
          `meaning=${encodeURIComponent(word.primaryMeaning || '')}`;

        const ogResponse = await fetch(ogImageUrl);
        return new Response(ogResponse.body, {
          status: ogResponse.status,
          headers: ogResponse.headers,
        });
      } catch (error) {
        console.error("Failed to generate OG image", error);
        return new Response("Failed to generate image", { status: 500 });
      }
    }

    // Get translations for a specific language
    if (url.pathname.match(/^\/api\/translations\/[^/]+$/) && request.method === "GET") {
      try {
        const languageCode = url.pathname.split("/").pop();
        const translations = await getTranslations(env, languageCode);

        // Process translations in the background (don't await)
        // This gradually builds up translations for the requested language
        if (ctx.waitUntil) {
          ctx.waitUntil(
            processTranslationsBatch(env, languageCode).catch((err) => {
              console.error("Background translation processing failed:", err);
            }),
          );
        }

        return jsonResponse({ translations });
      } catch (error) {
        console.error("Failed to retrieve translations", error);
        return jsonResponse({ error: "Unable to retrieve translations" }, 500);
      }
    }

    // Create Stripe Checkout Session
    if (url.pathname === "/api/create-checkout-session" && request.method === "POST") {
      try {
        const { amount, type, testMode, successUrl, cancelUrl } = await request.json();

        // Select appropriate Stripe key based on test mode
        const stripeKey = testMode ? env.STRIPE_TEST_SECRET_KEY : env.STRIPE_SECRET_KEY;

        if (!stripeKey) {
          return jsonResponse({
            error: testMode ? "Stripe test mode not configured" : "Stripe not configured"
          }, 500);
        }

        // Create Stripe Checkout Session
        const session = await createStripeCheckoutSession(
          stripeKey,
          amount,
          type,
          successUrl,
          cancelUrl
        );

        return jsonResponse({ url: session.url });
      } catch (error) {
        console.error("Failed to create checkout session", error);
        return jsonResponse(
          { error: "Unable to create checkout session" },
          500,
        );
      }
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};

async function getWordOfDay(env) {
  const cached = await getCachedWord(env);
  if (cached) {
    return cached;
  }

  const lexeme = await pickNextLexeme(env, true);
  if (!lexeme) {
    throw new Error("No lexemes available");
  }

  await env.VAAN_LEXICON_DB.prepare(
    "INSERT OR IGNORE INTO word_of_day_log (lexeme_id) VALUES (?)",
  )
    .bind(lexeme.id)
    .run();

  await env.VAAN_LEXICON_DB.prepare(
    "INSERT OR REPLACE INTO word_of_day_state (id, lexeme_id, selected_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
  )
    .bind(STATE_ROW_ID, lexeme.id)
    .run();

  return formatLexeme(lexeme);
}

async function getCachedWord(env) {
  const query = `
    SELECT lexemes.*, word_of_day_state.selected_at AS wod_selected_at
    FROM word_of_day_state
    JOIN lexemes ON lexemes.id = word_of_day_state.lexeme_id
    WHERE word_of_day_state.id = ?
    LIMIT 1;
  `;

  const result = await env.VAAN_LEXICON_DB.prepare(query)
    .bind(STATE_ROW_ID)
    .first();

  if (!result) {
    return null;
  }

  const selectedAt = result.wod_selected_at;
  if (!selectedAt) {
    await clearCachedWord(env);
    return null;
  }

  const ageMs = Date.now() - new Date(selectedAt).getTime();
  if (Number.isFinite(ageMs) && ageMs < WORD_TTL_MS) {
    return formatLexeme(result, selectedAt);
  }

  await clearCachedWord(env);
  return null;
}

async function clearCachedWord(env) {
  await env.VAAN_LEXICON_DB.prepare(
    "DELETE FROM word_of_day_state WHERE id = ?",
  )
    .bind(STATE_ROW_ID)
    .run();
}

async function pickNextLexeme(env, allowReset) {
  const query = `
    WITH available AS (
      SELECT lexemes.id
      FROM lexemes
      LEFT JOIN word_of_day_log ON word_of_day_log.lexeme_id = lexemes.id
      WHERE word_of_day_log.lexeme_id IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    )
    SELECT lexemes.*
    FROM lexemes
    JOIN available ON available.id = lexemes.id
    LIMIT 1;
  `;

  const { results } = await env.VAAN_LEXICON_DB.prepare(query).all();
  if (results && results.length > 0) {
    return results[0];
  }

  if (!allowReset) {
    return null;
  }

  await env.VAAN_LEXICON_DB.prepare("DELETE FROM word_of_day_log").run();
  return pickNextLexeme(env, false);
}

function formatLexeme(lexeme, selectedAtOverride) {
  const meanings = parseMeaningField(lexeme.english_meanings);
  const selectedAt =
    selectedAtOverride ?? lexeme.wod_selected_at ?? new Date().toISOString();
  return {
    id: lexeme.id,
    sanskrit: lexeme.sanskrit,
    transliteration: lexeme.transliteration,
    primaryMeaning: lexeme.primary_meaning,
    meanings,
    partOfSpeech: lexeme.part_of_speech,
    hindiMeaning: lexeme.hindi_meaning,
    tags: parseTags(lexeme.tags),
    rawEntry: lexeme.raw_entry,
    selectedAt,
  };
}

function parseMeaningField(value) {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      // Ignore JSON parse errors and fall back to splitting
    }
    return value
      .split(/[,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseTags(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function getBabyNames(env, gender, letter, search) {
  let query = "SELECT * FROM baby_names WHERE 1=1";
  const bindings = [];

  // Filter by gender (include unisex names for boy/girl filters)
  if (gender && gender !== "all") {
    query += " AND (gender = ? OR gender = 'unisex')";
    bindings.push(gender);
  }

  // Filter by first letter
  if (letter && letter.length > 0) {
    query += " AND first_letter = ?";
    bindings.push(letter.toUpperCase());
  }

  // Search by name or meaning (using FTS if search is provided)
  if (search && search.length > 0) {
    // Use full-text search for better performance
    query = `
      SELECT baby_names.* FROM baby_names
      JOIN baby_names_fts ON baby_names.id = baby_names_fts.rowid
      WHERE baby_names_fts MATCH ?
    `;
    bindings.length = 0; // Reset bindings for FTS query
    bindings.push(search);

    // Re-apply gender filter if needed (include unisex names)
    if (gender && gender !== "all") {
      query += " AND (baby_names.gender = ? OR baby_names.gender = 'unisex')";
      bindings.push(gender);
    }

    // Re-apply letter filter if needed
    if (letter && letter.length > 0) {
      query += " AND baby_names.first_letter = ?";
      bindings.push(letter.toUpperCase());
    }
  }

  query += " ORDER BY name ASC";

  const stmt = env.VAAN_LEXICON_DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  return results || [];
}

async function processLexemesBatch(env, priorityLetter = '') {
  // Get a batch of unprocessed lexemes, prioritizing the selected letter
  let query = `
    SELECT id, sanskrit, transliteration, primary_meaning, english_meanings
    FROM lexemes
    WHERE baby_name_checked = 0
  `;

  // If a priority letter is provided, prioritize lexemes starting with that letter
  if (priorityLetter && priorityLetter.length > 0) {
    const upperLetter = priorityLetter.toUpperCase();
    query += `
      ORDER BY
        CASE
          WHEN UPPER(SUBSTR(transliteration, 1, 1)) = ? THEN 0
          ELSE 1
        END,
        RANDOM()
      LIMIT ?
    `;

    const { results: lexemes } = await env.VAAN_LEXICON_DB.prepare(query)
      .bind(upperLetter, BATCH_SIZE)
      .all();

    if (lexemes && lexemes.length > 0) {
      const priorityCount = lexemes.filter(l =>
        l.transliteration && l.transliteration.toUpperCase().startsWith(upperLetter)
      ).length;
      console.log(`Processing ${lexemes.length} lexemes (${priorityCount} starting with '${upperLetter}')`);
    }

    if (!lexemes || lexemes.length === 0) {
      console.log("No unprocessed lexemes found");
      return;
    }

    return await processBatchResults(env, lexemes);
  }

  // No priority letter, process random lexemes
  query += ` ORDER BY RANDOM() LIMIT ?`;

  const { results: lexemes } = await env.VAAN_LEXICON_DB.prepare(query)
    .bind(BATCH_SIZE)
    .all();

  if (!lexemes || lexemes.length === 0) {
    console.log("No unprocessed lexemes found");
    return;
  }

  console.log(`Processing ${lexemes.length} lexemes for baby name suitability`);

  return await processBatchResults(env, lexemes);
}

async function processBatchResults(env, lexemes) {
  try {
    // Process all lexemes in a single batch API call
    const results = await checkBabyNameSuitabilityBatch(env, lexemes);

    // Process each result
    for (let i = 0; i < lexemes.length; i++) {
      const lexeme = lexemes[i];
      const result = results[i];

      if (!result) {
        console.error(`No result for lexeme ${lexeme.id}`);
        continue;
      }

      try {
        // Mark as checked
        await env.VAAN_LEXICON_DB.prepare(
          "UPDATE lexemes SET baby_name_checked = 1, baby_name_suitable = ?, baby_name_gender = ? WHERE id = ?",
        )
          .bind(result.suitable ? 1 : 0, result.gender, lexeme.id)
          .run();

        // If suitable, add to baby_names table
        if (result.suitable && result.gender) {
          await saveBabyName(
            env,
            lexeme,
            result.gender,
            result.story,
            result.reasoning,
          );
        }
      } catch (error) {
        console.error(`Failed to save result for lexeme ${lexeme.id}:`, error);
        // Mark as checked even if failed to avoid retrying forever
        await env.VAAN_LEXICON_DB.prepare(
          "UPDATE lexemes SET baby_name_checked = 1 WHERE id = ?",
        )
          .bind(lexeme.id)
          .run();
      }
    }
  } catch (error) {
    console.error("Batch processing failed:", error);
    // Mark all as checked to avoid retrying
    for (const lexeme of lexemes) {
      await env.VAAN_LEXICON_DB.prepare(
        "UPDATE lexemes SET baby_name_checked = 1 WHERE id = ?",
      )
        .bind(lexeme.id)
        .run();
    }
  }
}

async function checkBabyNameSuitabilityBatch(env, lexemes) {
  // Static part of prompt (for caching) - instructions come first
  const systemPrompt = `You are a Sanskrit language and naming expert. Analyze the following Sanskrit words and determine if each would be suitable as a baby name.

For each word, respond with:
- suitable: boolean (true if this would make a good baby name)
- gender: string ("boy", "girl", or "unisex") - only if suitable is true, otherwise null
- reasoning: string (brief explanation of why this is or isn't suitable as a baby name)
- story: string (if suitable, provide 1-2 sentences of cultural or mythological context) - otherwise null

Criteria for suitability:
1. The word should have a positive or neutral meaning
2. It should be pronounceable as a name
3. It should not be primarily a verb, or grammatical particle
4. Consider traditional usage in Sanskrit/Hindu naming conventions
5. Determine the grammatical gender in Sanskrit to suggest appropriate gender for the name
6. Names of deities, virtues, natural phenomena with positive connotations are usually suitable

Analyze these words:
`;

  // Dynamic part - words list (comes after static instructions for caching)
  const wordsList = lexemes.map((lexeme, index) =>
    `${index + 1}. Sanskrit Word: ${lexeme.sanskrit}, English Meaning: ${lexeme.primary_meaning}`
  ).join('\n');

  const fullPrompt = systemPrompt + wordsList;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    suitable: { type: "boolean" },
                    gender: { type: "string", nullable: true },
                    reasoning: { type: "string" },
                    story: { type: "string", nullable: true },
                  },
                  required: ["suitable", "reasoning"],
                },
              },
            },
            required: ["results"],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("No response from Gemini:", JSON.stringify(data));
    throw new Error("No response from Gemini");
  }

  const parsed = JSON.parse(text);
  const results = parsed.results || [];

  return results.map((result) => ({
    suitable: result.suitable === true,
    gender: result.gender || null,
    story: result.story || null,
    reasoning: result.reasoning || "No reasoning provided",
  }));
}

function generateSlug(text, id) {
  // Convert to lowercase and replace special chars
  let slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .trim();

  // If slug is empty or too short, use id
  if (!slug || slug.length < 2) {
    slug = `name-${id}`;
  }

  return slug;
}

async function saveBabyName(env, lexeme, gender, story, reasoning) {
  const firstLetter = (lexeme.transliteration ||
    lexeme.sanskrit)[0].toUpperCase();

  // Generate slug from transliteration (preferred) or fallback to id-based
  const baseSlug = generateSlug(lexeme.transliteration || lexeme.sanskrit, lexeme.id);

  // Check if slug exists, if so append lexeme id
  const existingSlug = await env.VAAN_LEXICON_DB.prepare(
    'SELECT id FROM baby_names WHERE slug = ?'
  ).bind(baseSlug).first();

  const slug = existingSlug ? `${baseSlug}-${lexeme.id}` : baseSlug;

  await env.VAAN_LEXICON_DB.prepare(
    `
    INSERT INTO baby_names (name, slug, gender, meaning, pronunciation, story, reasoning, first_letter, lexeme_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  )
    .bind(
      lexeme.sanskrit,
      slug,
      gender,
      lexeme.primary_meaning,
      lexeme.transliteration || lexeme.sanskrit,
      story,
      reasoning,
      firstLetter,
      lexeme.id,
    )
    .run();

  console.log(`Added baby name: ${lexeme.sanskrit} (${gender}) - slug: ${slug}`);
}

async function getBabyNameBySlug(env, slug) {
  const result = await env.VAAN_LEXICON_DB.prepare(
    "SELECT * FROM baby_names WHERE slug = ? LIMIT 1"
  ).bind(slug).first();

  return result || null;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

// Translation functions
async function getTranslations(env, languageCode) {
  const results = await env.VAAN_LEXICON_DB.prepare(
    "SELECT translation_key, translated_text FROM translations WHERE language_code = ?"
  ).bind(languageCode).all();

  // Convert to key-value object
  const translations = {};
  for (const row of results.results || []) {
    translations[row.translation_key] = row.translated_text;
  }

  return translations;
}

async function processTranslationsBatch(env, languageCode) {
  // Skip English as that's our source language
  if (languageCode === 'en') {
    return;
  }

  console.log(`Processing translations for language: ${languageCode}`);

  // Get untranslated keys for this language
  const query = `
    SELECT tk.translation_key, tk.source_text
    FROM translation_keys tk
    LEFT JOIN translations t ON tk.translation_key = t.translation_key AND t.language_code = ?
    WHERE t.id IS NULL
    ORDER BY RANDOM()
    LIMIT ?
  `;

  const untranslated = await env.VAAN_LEXICON_DB.prepare(query)
    .bind(languageCode, BATCH_SIZE)
    .all();

  if (!untranslated.results || untranslated.results.length === 0) {
    console.log(`No untranslated strings found for ${languageCode}`);
    return;
  }

  console.log(`Found ${untranslated.results.length} untranslated strings for ${languageCode}`);

  // Translate each string using the free-translate API
  for (const item of untranslated.results) {
    try {
      console.log(`Translating "${item.source_text}" to ${languageCode}`);

      const response = await fetch('https://free-translate-go-api.onrender.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: item.source_text,
          to: languageCode,
        }),
      });

      if (!response.ok) {
        console.error(`Translation API error for "${item.source_text}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      const translatedText = data.translatedText || data.text || item.source_text;

      // Save the translation
      await env.VAAN_LEXICON_DB.prepare(
        `INSERT INTO translations (translation_key, language_code, source_text, translated_text)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(translation_key, language_code)
         DO UPDATE SET translated_text = ?, updated_at = CURRENT_TIMESTAMP`
      ).bind(
        item.translation_key,
        languageCode,
        item.source_text,
        translatedText,
        translatedText
      ).run();

      console.log(`Saved translation: ${item.translation_key} -> ${translatedText}`);
    } catch (error) {
      console.error(`Failed to translate "${item.source_text}":`, error);
    }
  }

  console.log(`Completed translation batch for ${languageCode}`);
}

/**
 * Create a Stripe Checkout Session
 * @param {string} secretKey - Stripe secret key
 * @param {number} amount - Amount in cents
 * @param {string} type - 'one-time' or 'monthly'
 * @param {string} successUrl - URL to redirect on success
 * @param {string} cancelUrl - URL to redirect on cancel
 * @returns {Promise<Object>} Stripe session object
 */
async function createStripeCheckoutSession(secretKey, amount, type, successUrl, cancelUrl) {
  const isRecurring = type === 'monthly';

  // Build URL-encoded body manually for Stripe API
  const params = new URLSearchParams();
  params.append('mode', isRecurring ? 'subscription' : 'payment');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);

  // Add line items with nested structure
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product_data][name]',
    isRecurring ? 'Monthly Donation to संस्कृत रोज़' : 'Donation to संस्कृत रोज़');
  params.append('line_items[0][price_data][product_data][description]',
    isRecurring
      ? 'Support Sanskrit language preservation with a monthly contribution'
      : 'One-time contribution to support Sanskrit language preservation');
  params.append('line_items[0][price_data][unit_amount]', amount.toString());

  if (isRecurring) {
    params.append('line_items[0][price_data][recurring][interval]', 'month');
  }

  params.append('line_items[0][quantity]', '1');

  // Create Stripe Checkout Session
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error: ${error}`);
  }

  return await response.json();
}
