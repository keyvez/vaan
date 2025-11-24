const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
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
          console.log(`[Background] Triggering lexeme processing for letter: ${letter || 'random'}`);
          ctx.waitUntil(
            processLexemesBatch(env, letter).catch((err) => {
              console.error("Background lexeme processing failed:", err);
            }),
          );
        } else {
          console.log('[Background] Skipping lexeme processing - GEMINI_API_KEY or ctx.waitUntil not available');
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

    // Get learning words with improved data
    if (url.pathname === "/api/learning-words" && request.method === "GET") {
      try {
        const searchParams = url.searchParams;
        const difficulty = searchParams.get("difficulty") || "beginner";
        const limit = parseInt(searchParams.get("limit") || "20");

        const words = await getLearningWords(env, difficulty, limit);
        return jsonResponse({ words });
      } catch (error) {
        console.error("Failed to retrieve learning words", error);
        return jsonResponse({ error: "Unable to retrieve learning words" }, 500);
      }
    }

    // Upsert user (create or update user on login)
    if (url.pathname === "/api/user/upsert" && request.method === "POST") {
      try {
        const { id, email, name, picture } = await request.json();

        if (!id || !email) {
          return jsonResponse({ error: "User ID and email are required" }, 400);
        }

        await upsertUser(env, id, email, name, picture);
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to upsert user", error);
        return jsonResponse({ error: "Unable to save user" }, 500);
      }
    }

    // Get user learning progress
    if (url.pathname === "/api/user/progress" && request.method === "GET") {
      try {
        const searchParams = url.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
          return jsonResponse({ error: "User ID is required" }, 400);
        }

        const progress = await getUserProgress(env, userId);
        return jsonResponse(progress);
      } catch (error) {
        console.error("Failed to retrieve user progress", error);
        return jsonResponse({ error: "Unable to retrieve user progress" }, 500);
      }
    }

    // Record flashcard review
    if (url.pathname === "/api/user/flashcard-review" && request.method === "POST") {
      try {
        const { userId, babyNameId, confidenceLevel } = await request.json();

        if (!userId || !babyNameId) {
          return jsonResponse({ error: "User ID and baby name ID are required" }, 400);
        }

        await recordFlashcardReview(env, userId, babyNameId, confidenceLevel);
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to record flashcard review", error);
        return jsonResponse({ error: "Unable to record review" }, 500);
      }
    }

    // Record quiz attempt
    if (url.pathname === "/api/user/quiz-attempt" && request.method === "POST") {
      try {
        const { userId, babyNameId, correct, difficultyLevel, timeTakenMs } = await request.json();

        if (!userId || !babyNameId || correct === undefined) {
          return jsonResponse({ error: "User ID, baby name ID, and correct status are required" }, 400);
        }

        await recordQuizAttempt(env, userId, babyNameId, correct, difficultyLevel, timeTakenMs);
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to record quiz attempt", error);
        return jsonResponse({ error: "Unable to record quiz attempt" }, 500);
      }
    }

    // Get user statistics
    if (url.pathname === "/api/user/stats" && request.method === "GET") {
      try {
        const searchParams = url.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
          return jsonResponse({ error: "User ID is required" }, 400);
        }

        const stats = await getUserStats(env, userId);
        return jsonResponse(stats);
      } catch (error) {
        console.error("Failed to retrieve user stats", error);
        return jsonResponse({ error: "Unable to retrieve user stats" }, 500);
      }
    }

    // Create Stripe Checkout Session
    if (url.pathname === "/api/create-checkout-session" && request.method === "POST") {
      try {
        const { amount, type, testMode, successUrl, cancelUrl, customerEmail } = await request.json();

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
          cancelUrl,
          customerEmail
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

    // ========== ADMIN API ENDPOINTS ==========

    // Check if user is admin
    if (url.pathname === "/api/admin/check" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!userId) {
          return jsonResponse({ isAdmin: false });
        }

        const isAdmin = await checkIsAdmin(env, userId);
        return jsonResponse({ isAdmin });
      } catch (error) {
        console.error("Failed to check admin status", error);
        return jsonResponse({ isAdmin: false });
      }
    }

    // Grant admin access
    if (url.pathname.match(/^\/api\/admin\/grant\/[^/]+$/) && request.method === "POST") {
      try {
        const targetUserId = url.pathname.split("/").pop();
        const requestBody = await request.json();
        const requestorId = requestBody.requestorId;

        // Check if requestor is admin
        const isAdmin = await checkIsAdmin(env, requestorId);
        if (!isAdmin) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await env.VAAN_LEXICON_DB.prepare(
          "UPDATE users SET is_admin = 1 WHERE id = ?"
        ).bind(targetUserId).run();

        await logAdminAction(env, requestorId, 'grant_admin', 'user', targetUserId, { targetUserId });
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to grant admin access", error);
        return jsonResponse({ error: "Unable to grant admin access" }, 500);
      }
    }

    // ===== ADMIN - VIDEOS =====

    // List videos
    if (url.pathname === "/api/admin/videos" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const category = url.searchParams.get("category");
        const videos = await getVideos(env, category);
        return jsonResponse({ videos });
      } catch (error) {
        console.error("Failed to get videos", error);
        return jsonResponse({ error: "Unable to get videos" }, 500);
      }
    }

    // Create video
    if (url.pathname === "/api/admin/videos" && request.method === "POST") {
      try {
        const body = await request.json();
        const { userId, youtubeUrl, category, description, publishedAt } = body;

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        // Fetch YouTube metadata
        const videoData = await fetchYouTubeMetadata(youtubeUrl, env);

        const video = await createVideo(env, videoData, category, description, publishedAt);
        await logAdminAction(env, userId, 'create', 'video', video.id, { title: video.title });
        return jsonResponse({ video });
      } catch (error) {
        console.error("Failed to create video", error);
        return jsonResponse({ error: error.message || "Unable to create video" }, 500);
      }
    }

    // Update video
    if (url.pathname.match(/^\/api\/admin\/videos\/\d+$/) && request.method === "PUT") {
      try {
        const videoId = url.pathname.split("/").pop();
        const body = await request.json();
        const { userId, title, description, category, publishedAt } = body;

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await updateVideo(env, videoId, { title, description, category, publishedAt });
        await logAdminAction(env, userId, 'update', 'video', videoId, { title });
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to update video", error);
        return jsonResponse({ error: "Unable to update video" }, 500);
      }
    }

    // Delete video
    if (url.pathname.match(/^\/api\/admin\/videos\/\d+$/) && request.method === "DELETE") {
      try {
        const videoId = url.pathname.split("/").pop();
        const userId = url.searchParams.get("userId");

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await deleteVideo(env, videoId);
        await logAdminAction(env, userId, 'delete', 'video', videoId, {});
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to delete video", error);
        return jsonResponse({ error: "Unable to delete video" }, 500);
      }
    }

    // ===== ADMIN - BLOG =====

    // List blog posts
    if (url.pathname === "/api/admin/blog" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");
        const posts = await getBlogPosts(env, status, search);
        return jsonResponse({ posts });
      } catch (error) {
        console.error("Failed to get blog posts", error);
        return jsonResponse({ error: "Unable to get blog posts" }, 500);
      }
    }

    // Create blog post
    if (url.pathname === "/api/admin/blog" && request.method === "POST") {
      try {
        const body = await request.json();
        const { userId, title, content, excerpt, status } = body;

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const post = await createBlogPost(env, { title, content, excerpt, status, authorId: userId });
        await logAdminAction(env, userId, 'create', 'blog', post.id, { title });
        return jsonResponse({ post });
      } catch (error) {
        console.error("Failed to create blog post", error);
        return jsonResponse({ error: "Unable to create blog post" }, 500);
      }
    }

    // Update blog post
    if (url.pathname.match(/^\/api\/admin\/blog\/\d+$/) && request.method === "PUT") {
      try {
        const postId = url.pathname.split("/").pop();
        const body = await request.json();
        const { userId, title, content, excerpt, status } = body;

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await updateBlogPost(env, postId, { title, content, excerpt, status });
        await logAdminAction(env, userId, 'update', 'blog', postId, { title });
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to update blog post", error);
        return jsonResponse({ error: "Unable to update blog post" }, 500);
      }
    }

    // Delete blog post
    if (url.pathname.match(/^\/api\/admin\/blog\/\d+$/) && request.method === "DELETE") {
      try {
        const postId = url.pathname.split("/").pop();
        const userId = url.searchParams.get("userId");

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await deleteBlogPost(env, postId);
        await logAdminAction(env, userId, 'delete', 'blog', postId, {});
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to delete blog post", error);
        return jsonResponse({ error: "Unable to delete blog post" }, 500);
      }
    }

    // ===== ADMIN - NEWS =====

    // List news
    if (url.pathname === "/api/admin/news" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const search = url.searchParams.get("search");
        const news = await getNews(env, search);
        return jsonResponse({ news });
      } catch (error) {
        console.error("Failed to get news", error);
        return jsonResponse({ error: "Unable to get news" }, 500);
      }
    }

    // Create news item
    if (url.pathname === "/api/admin/news" && request.method === "POST") {
      try {
        const body = await request.json();
        const { userId, title, content, sourceUrl, sourceName, publishedAt } = body;

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const newsItem = await createNews(env, { title, content, sourceUrl, sourceName, publishedAt });
        await logAdminAction(env, userId, 'create', 'news', newsItem.id, { title });
        return jsonResponse({ newsItem });
      } catch (error) {
        console.error("Failed to create news", error);
        return jsonResponse({ error: "Unable to create news" }, 500);
      }
    }

    // Update news item
    if (url.pathname.match(/^\/api\/admin\/news\/\d+$/) && request.method === "PUT") {
      try {
        const newsId = url.pathname.split("/").pop();
        const body = await request.json();
        const { userId, title, content, sourceUrl, sourceName, publishedAt } = body;

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await updateNews(env, newsId, { title, content, sourceUrl, sourceName, publishedAt });
        await logAdminAction(env, userId, 'update', 'news', newsId, { title });
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to update news", error);
        return jsonResponse({ error: "Unable to update news" }, 500);
      }
    }

    // Delete news item
    if (url.pathname.match(/^\/api\/admin\/news\/\d+$/) && request.method === "DELETE") {
      try {
        const newsId = url.pathname.split("/").pop();
        const userId = url.searchParams.get("userId");

        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        await deleteNews(env, newsId);
        await logAdminAction(env, userId, 'delete', 'news', newsId, {});
        return jsonResponse({ success: true });
      } catch (error) {
        console.error("Failed to delete news", error);
        return jsonResponse({ error: "Unable to delete news" }, 500);
      }
    }

    // ===== ADMIN - LEXEMES =====

    // List lexemes
    if (url.pathname === "/api/admin/lexemes" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const page = parseInt(url.searchParams.get("page") || "1");
        const search = url.searchParams.get("search");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        const result = await getLexemes(env, page, search, limit);
        return jsonResponse(result);
      } catch (error) {
        console.error("Failed to get lexemes", error);
        return jsonResponse({ error: "Unable to get lexemes" }, 500);
      }
    }

    // ===== ADMIN - DAILY WORDS =====

    // Get daily words schedule
    if (url.pathname === "/api/admin/daily-words" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const schedule = await getDailyWordsSchedule(env);
        return jsonResponse({ schedule });
      } catch (error) {
        console.error("Failed to get daily words schedule", error);
        return jsonResponse({ error: "Unable to get schedule" }, 500);
      }
    }

    // ===== ADMIN - USERS =====

    // List users
    if (url.pathname === "/api/admin/users" && request.method === "GET") {
      try {
        const requestorId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, requestorId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const page = parseInt(url.searchParams.get("page") || "1");
        const search = url.searchParams.get("search");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        const result = await getUsers(env, page, search, limit);
        return jsonResponse(result);
      } catch (error) {
        console.error("Failed to get users", error);
        return jsonResponse({ error: "Unable to get users" }, 500);
      }
    }

    // Get user activity
    if (url.pathname.match(/^\/api\/admin\/users\/[^/]+\/activity$/) && request.method === "GET") {
      try {
        const targetUserId = url.pathname.split("/")[4];
        const requestorId = url.searchParams.get("userId");

        if (!await checkIsAdmin(env, requestorId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const activity = await getUserActivity(env, targetUserId);
        return jsonResponse({ activity });
      } catch (error) {
        console.error("Failed to get user activity", error);
        return jsonResponse({ error: "Unable to get user activity" }, 500);
      }
    }

    // ===== ADMIN - STATS =====

    // Get admin dashboard stats
    if (url.pathname === "/api/admin/stats/overview" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const stats = await getAdminStats(env);
        return jsonResponse(stats);
      } catch (error) {
        console.error("Failed to get admin stats", error);
        return jsonResponse({ error: "Unable to get stats" }, 500);
      }
    }

    // Get admin audit log
    if (url.pathname === "/api/admin/audit-log" && request.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        if (!await checkIsAdmin(env, userId)) {
          return jsonResponse({ error: "Unauthorized" }, 403);
        }

        const limit = parseInt(url.searchParams.get("limit") || "100");
        const logs = await getAuditLog(env, limit);
        return jsonResponse({ logs });
      } catch (error) {
        console.error("Failed to get audit log", error);
        return jsonResponse({ error: "Unable to get audit log" }, 500);
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
        // Mark as checked and update learning fields
        await env.VAAN_LEXICON_DB.prepare(
          "UPDATE lexemes SET baby_name_checked = 1, baby_name_suitable = ?, baby_name_gender = ?, improved_translation = ?, example_phrase = ?, difficulty_level = ?, quiz_choices = ? WHERE id = ?",
        )
          .bind(
            result.suitable ? 1 : 0,
            result.gender,
            result.improvedTranslation,
            result.examplePhrase,
            result.difficultyLevel,
            JSON.stringify(result.quizChoices || []),
            lexeme.id
          )
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
  const startTime = Date.now();

  // Log request details
  console.log('=== Gemini API Request ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Lexemes count: ${lexemes.length}`);
  console.log(`Lexeme IDs: ${lexemes.map(l => l.id).join(', ')}`);
  console.log(`Words: ${lexemes.map(l => l.sanskrit).join(', ')}`);

  // Static part of prompt (for caching) - instructions come first
  const systemPrompt = `You are a Sanskrit language and naming expert. Analyze the following Sanskrit words and determine if each would be suitable as a baby name.

For each word, respond with:
- suitable: boolean (true if this would make a good baby name)
- gender: string ("boy", "girl", or "unisex") - only if suitable is true, otherwise null
- reasoning: string (brief explanation of why this is or isn't suitable as a baby name)
- story: string (if suitable, provide 1-2 sentences of cultural or mythological context) - otherwise null
- improved_translation: string (provide an improved, more accurate English translation that captures nuances)
- example_phrase: string (provide a simple Sanskrit phrase or sentence where this word is commonly used, with English translation)
- difficulty_level: string ("beginner", "intermediate", or "advanced") - for Sanskrit learners
- quiz_choices: array of 3 strings (3 plausible but incorrect meanings for multiple choice quiz)

Criteria for suitability:
1. The word should have a positive or neutral meaning
2. It should be pronounceable as a name
3. It should not be primarily a verb, or grammatical particle
4. Consider traditional usage in Sanskrit/Hindu naming conventions
5. Determine the grammatical gender in Sanskrit to suggest appropriate gender for the name
6. Names of deities, virtues, natural phenomena with positive connotations are usually suitable

For the improved_translation, provide a translation that is more precise and captures cultural/spiritual nuances.
For the example_phrase, use simple Sanskrit like "सः/सा [word] अस्ति" or provide a common usage from texts.
For quiz_choices, make them plausible wrong answers that test understanding.

Analyze these words:
`;

  // Dynamic part - words list (comes after static instructions for caching)
  const wordsList = lexemes.map((lexeme, index) =>
    `${index + 1}. Sanskrit Word: ${lexeme.sanskrit}, English Meaning: ${lexeme.primary_meaning}`
  ).join('\n');

  const fullPrompt = systemPrompt + wordsList;

  console.log(`Prompt length: ${fullPrompt.length} characters`);

  const requestBody = {
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
                improved_translation: { type: "string" },
                example_phrase: { type: "string" },
                difficulty_level: { type: "string" },
                quiz_choices: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["suitable", "reasoning", "improved_translation", "example_phrase", "difficulty_level", "quiz_choices"],
            },
          },
        },
        required: ["results"],
      },
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );

  const responseTime = Date.now() - startTime;

  // Log response details
  console.log('=== Gemini API Response ===');
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Response time: ${responseTime}ms`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error response:", errorText);
    console.error(`Failed after ${responseTime}ms`);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  // Log response metadata
  console.log('Response metadata:', {
    candidatesCount: data.candidates?.length || 0,
    usageMetadata: data.usageMetadata || {},
    modelVersion: data.modelVersion || 'unknown',
  });

  if (data.usageMetadata) {
    console.log(`Token usage - Prompt: ${data.usageMetadata.promptTokenCount || 0}, Candidates: ${data.usageMetadata.candidatesTokenCount || 0}, Total: ${data.usageMetadata.totalTokenCount || 0}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("No response text from Gemini");
    console.error("Full response data:", JSON.stringify(data, null, 2));
    throw new Error("No response from Gemini");
  }

  console.log(`Response text length: ${text.length} characters`);

  const parsed = JSON.parse(text);
  const results = parsed.results || [];

  console.log(`Parsed results count: ${results.length}`);
  console.log('Results summary:', results.map((r, i) => ({
    index: i,
    lexemeId: lexemes[i]?.id,
    word: lexemes[i]?.sanskrit,
    suitable: r.suitable,
    gender: r.gender,
    difficultyLevel: r.difficulty_level,
  })));
  console.log(`Total processing time: ${Date.now() - startTime}ms`);
  console.log('=== End Gemini API Call ===\n');

  return results.map((result) => ({
    suitable: result.suitable === true,
    gender: result.gender || null,
    story: result.story || null,
    improvedTranslation: result.improved_translation || null,
    examplePhrase: result.example_phrase || null,
    difficultyLevel: result.difficulty_level || null,
    quizChoices: result.quiz_choices || [],
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

async function getLearningWords(env, difficulty, limit) {
  // Fetch lexemes that have been enhanced with learning data
  const { results } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT
      id,
      sanskrit,
      transliteration,
      improved_translation,
      primary_meaning as meaning,
      example_phrase,
      difficulty_level,
      quiz_choices
    FROM lexemes
    WHERE difficulty_level = ?
      AND improved_translation IS NOT NULL
      AND example_phrase IS NOT NULL
      AND quiz_choices IS NOT NULL
    ORDER BY RANDOM()
    LIMIT ?`
  ).bind(difficulty, limit).all();

  // Parse quiz_choices JSON for each word
  return (results || []).map(word => ({
    ...word,
    quiz_choices: word.quiz_choices ? JSON.parse(word.quiz_choices) : []
  }));
}

// User management functions

async function upsertUser(env, userId, email, name, pictureUrl) {
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO users (id, email, name, picture_url, last_login_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       name = excluded.name,
       picture_url = excluded.picture_url,
       last_login_at = CURRENT_TIMESTAMP`
  ).bind(userId, email, name, pictureUrl).run();

  // Initialize user learning progress if doesn't exist
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO user_learning_progress (user_id)
     VALUES (?)
     ON CONFLICT(user_id) DO NOTHING`
  ).bind(userId).run();
}

async function getUserProgress(env, userId) {
  // Get overall progress
  const progress = await env.VAAN_LEXICON_DB.prepare(
    `SELECT
      current_difficulty_level,
      total_words_studied,
      total_flashcards_reviewed,
      total_quizzes_taken,
      total_quiz_correct
    FROM user_learning_progress
    WHERE user_id = ?`
  ).bind(userId).first();

  if (!progress) {
    // Return default progress if user hasn't started learning yet
    return {
      current_difficulty_level: 'beginner',
      total_words_studied: 0,
      total_flashcards_reviewed: 0,
      total_quizzes_taken: 0,
      total_quiz_correct: 0,
      quiz_accuracy: 0
    };
  }

  return {
    ...progress,
    quiz_accuracy: progress.total_quizzes_taken > 0
      ? Math.round((progress.total_quiz_correct / progress.total_quizzes_taken) * 100)
      : 0
  };
}

async function recordFlashcardReview(env, userId, babyNameId, confidenceLevel = 3) {
  // Ensure user exists
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO user_learning_progress (user_id)
     VALUES (?)
     ON CONFLICT(user_id) DO NOTHING`
  ).bind(userId).run();

  // Update or create word progress
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO user_word_progress (user_id, baby_name_id, times_reviewed, confidence_level, last_reviewed_at)
     VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, baby_name_id) DO UPDATE SET
       times_reviewed = times_reviewed + 1,
       confidence_level = excluded.confidence_level,
       last_reviewed_at = CURRENT_TIMESTAMP`
  ).bind(userId, babyNameId, confidenceLevel).run();

  // Update overall stats
  await env.VAAN_LEXICON_DB.prepare(
    `UPDATE user_learning_progress
     SET total_flashcards_reviewed = total_flashcards_reviewed + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(userId).run();

  // Update total_words_studied (count of unique words reviewed)
  const { count } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT COUNT(DISTINCT baby_name_id) as count
     FROM user_word_progress
     WHERE user_id = ?`
  ).bind(userId).first();

  await env.VAAN_LEXICON_DB.prepare(
    `UPDATE user_learning_progress
     SET total_words_studied = ?
     WHERE user_id = ?`
  ).bind(count, userId).run();
}

async function recordQuizAttempt(env, userId, babyNameId, correct, difficultyLevel, timeTakenMs = null) {
  // Ensure user exists
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO user_learning_progress (user_id)
     VALUES (?)
     ON CONFLICT(user_id) DO NOTHING`
  ).bind(userId).run();

  // Record quiz attempt
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO user_quiz_attempts (user_id, baby_name_id, correct, difficulty_level, time_taken_ms)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(userId, babyNameId, correct ? 1 : 0, difficultyLevel, timeTakenMs).run();

  // Update overall stats
  const correctIncrement = correct ? 1 : 0;
  await env.VAAN_LEXICON_DB.prepare(
    `UPDATE user_learning_progress
     SET total_quizzes_taken = total_quizzes_taken + 1,
         total_quiz_correct = total_quiz_correct + ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(correctIncrement, userId).run();
}

async function getUserStats(env, userId) {
  // Get overall progress
  const progress = await getUserProgress(env, userId);

  // Get recent quiz performance (last 10 attempts)
  const { results: recentQuizzes } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT
      qa.correct,
      qa.difficulty_level,
      qa.attempted_at,
      bn.name as word
    FROM user_quiz_attempts qa
    JOIN baby_names bn ON qa.baby_name_id = bn.id
    WHERE qa.user_id = ?
    ORDER BY qa.attempted_at DESC
    LIMIT 10`
  ).bind(userId).all();

  // Get words by confidence level
  const { results: wordsByConfidence } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT
      confidence_level,
      COUNT(*) as count
    FROM user_word_progress
    WHERE user_id = ?
    GROUP BY confidence_level
    ORDER BY confidence_level`
  ).bind(userId).all();

  // Get quiz accuracy by difficulty level
  const { results: accuracyByDifficulty } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT
      difficulty_level,
      COUNT(*) as total,
      SUM(correct) as correct
    FROM user_quiz_attempts
    WHERE user_id = ?
    GROUP BY difficulty_level`
  ).bind(userId).all();

  return {
    progress,
    recent_quizzes: recentQuizzes || [],
    words_by_confidence: wordsByConfidence || [],
    accuracy_by_difficulty: (accuracyByDifficulty || []).map(stat => ({
      difficulty_level: stat.difficulty_level,
      total: stat.total,
      correct: stat.correct,
      accuracy: Math.round((stat.correct / stat.total) * 100)
    }))
  };
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
async function createStripeCheckoutSession(secretKey, amount, type, successUrl, cancelUrl, customerEmail) {
  const isRecurring = type === 'monthly';

  // Build URL-encoded body manually for Stripe API
  const params = new URLSearchParams();
  params.append('mode', isRecurring ? 'subscription' : 'payment');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);

  // Add customer email if provided (for subscription management)
  if (customerEmail) {
    params.append('customer_email', customerEmail);
  }

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

// ========== ADMIN HELPER FUNCTIONS ==========

async function checkIsAdmin(env, userId) {
  if (!userId) return false;

  const result = await env.VAAN_LEXICON_DB.prepare(
    "SELECT is_admin FROM users WHERE id = ? AND is_admin = 1"
  ).bind(userId).first();

  return result !== null;
}

async function logAdminAction(env, userId, action, resourceType, resourceId, metadata) {
  await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, metadata_json)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(userId, action, resourceType, resourceId, JSON.stringify(metadata)).run();
}

// ===== VIDEO FUNCTIONS =====

async function getVideos(env, category = null) {
  let query = "SELECT * FROM sanskrit_videos WHERE 1=1";
  const bindings = [];

  if (category) {
    query += " AND category = ?";
    bindings.push(category);
  }

  query += " ORDER BY published_at DESC, created_at DESC";

  const stmt = env.VAAN_LEXICON_DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  return results || [];
}

async function fetchYouTubeMetadata(youtubeUrl, env) {
  // Extract video ID from URL
  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  // YouTube doesn't have a free public API for metadata, so we'll scrape the oEmbed endpoint
  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch YouTube metadata");
    }

    const data = await response.json();

    // Generate slug from title
    const slug = generateSlug(data.title, videoId);

    return {
      youtubeId: videoId,
      title: data.title,
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      slug
    };
  } catch (error) {
    console.error("Failed to fetch YouTube metadata:", error);
    // Fallback to basic data
    const slug = generateSlug(`video-${videoId}`, videoId);
    return {
      youtubeId: videoId,
      title: `Video ${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      slug
    };
  }
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function createVideo(env, videoData, category, description, publishedAt) {
  const { youtubeId, title, thumbnailUrl, slug } = videoData;
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const publishDate = publishedAt || new Date().toISOString();

  const result = await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO sanskrit_videos (title, slug, youtube_url, youtube_id, description, category, thumbnail_url, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, title, slug, youtube_url, youtube_id, description, category, thumbnail_url, published_at, created_at`
  ).bind(title, slug, youtubeUrl, youtubeId, description, category, thumbnailUrl, publishDate).first();

  return result;
}

async function updateVideo(env, videoId, updates) {
  const { title, description, category, publishedAt } = updates;

  await env.VAAN_LEXICON_DB.prepare(
    `UPDATE sanskrit_videos
     SET title = ?, description = ?, category = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(title, description, category, publishedAt, videoId).run();
}

async function deleteVideo(env, videoId) {
  await env.VAAN_LEXICON_DB.prepare(
    "DELETE FROM sanskrit_videos WHERE id = ?"
  ).bind(videoId).run();
}

// ===== BLOG FUNCTIONS =====

async function getBlogPosts(env, status = null, search = null) {
  let query = "SELECT * FROM blog_posts WHERE 1=1";
  const bindings = [];

  if (status && status !== 'all') {
    query += " AND status = ?";
    bindings.push(status);
  }

  if (search) {
    query = `
      SELECT blog_posts.* FROM blog_posts
      JOIN blog_posts_fts ON blog_posts.id = blog_posts_fts.rowid
      WHERE blog_posts_fts MATCH ?
    `;
    bindings.length = 0;
    bindings.push(search);

    if (status && status !== 'all') {
      query += " AND blog_posts.status = ?";
      bindings.push(status);
    }
  }

  query += " ORDER BY created_at DESC";

  const stmt = env.VAAN_LEXICON_DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  return results || [];
}

async function createBlogPost(env, postData) {
  const { title, content, excerpt, status, authorId } = postData;
  const slug = generateSlug(title, Date.now());
  const publishedAt = status === 'published' ? new Date().toISOString() : null;

  const result = await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO blog_posts (title, slug, content_markdown, excerpt, author_id, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING id, title, slug, content_markdown, excerpt, author_id, status, published_at, created_at`
  ).bind(title, slug, content, excerpt, authorId, status, publishedAt).first();

  return result;
}

async function updateBlogPost(env, postId, updates) {
  const { title, content, excerpt, status } = updates;

  // If status changed to published and wasn't published before, set published_at
  const post = await env.VAAN_LEXICON_DB.prepare(
    "SELECT status, published_at FROM blog_posts WHERE id = ?"
  ).bind(postId).first();

  let publishedAt = post.published_at;
  if (status === 'published' && !post.published_at) {
    publishedAt = new Date().toISOString();
  } else if (status === 'draft') {
    publishedAt = null;
  }

  await env.VAAN_LEXICON_DB.prepare(
    `UPDATE blog_posts
     SET title = ?, content_markdown = ?, excerpt = ?, status = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(title, content, excerpt, status, publishedAt, postId).run();
}

async function deleteBlogPost(env, postId) {
  await env.VAAN_LEXICON_DB.prepare(
    "DELETE FROM blog_posts WHERE id = ?"
  ).bind(postId).run();
}

// ===== NEWS FUNCTIONS =====

async function getNews(env, search = null) {
  let query = "SELECT * FROM sanskrit_news WHERE 1=1";
  const bindings = [];

  if (search) {
    query = `
      SELECT sanskrit_news.* FROM sanskrit_news
      JOIN sanskrit_news_fts ON sanskrit_news.id = sanskrit_news_fts.rowid
      WHERE sanskrit_news_fts MATCH ?
    `;
    bindings.push(search);
  }

  query += " ORDER BY published_at DESC, created_at DESC";

  const stmt = env.VAAN_LEXICON_DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  return results || [];
}

async function createNews(env, newsData) {
  const { title, content, sourceUrl, sourceName, publishedAt } = newsData;
  const slug = generateSlug(title, Date.now());
  const publishDate = publishedAt || new Date().toISOString();

  const result = await env.VAAN_LEXICON_DB.prepare(
    `INSERT INTO sanskrit_news (title, slug, content_markdown, source_url, source_name, published_at)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, title, slug, content_markdown, source_url, source_name, published_at, created_at`
  ).bind(title, slug, content, sourceUrl, sourceName, publishDate).first();

  return result;
}

async function updateNews(env, newsId, updates) {
  const { title, content, sourceUrl, sourceName, publishedAt } = updates;

  await env.VAAN_LEXICON_DB.prepare(
    `UPDATE sanskrit_news
     SET title = ?, content_markdown = ?, source_url = ?, source_name = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(title, content, sourceUrl, sourceName, publishedAt, newsId).run();
}

async function deleteNews(env, newsId) {
  await env.VAAN_LEXICON_DB.prepare(
    "DELETE FROM sanskrit_news WHERE id = ?"
  ).bind(newsId).run();
}

// ===== LEXEME FUNCTIONS =====

async function getLexemes(env, page, search = null, limit = 50) {
  const offset = (page - 1) * limit;
  let query = "SELECT * FROM lexemes WHERE 1=1";
  const bindings = [];

  if (search) {
    query += " AND (sanskrit LIKE ? OR transliteration LIKE ? OR primary_meaning LIKE ?)";
    const searchPattern = `%${search}%`;
    bindings.push(searchPattern, searchPattern, searchPattern);
  }

  query += " ORDER BY id ASC LIMIT ? OFFSET ?";
  bindings.push(limit, offset);

  const stmt = env.VAAN_LEXICON_DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  // Get total count
  let countQuery = "SELECT COUNT(*) as count FROM lexemes WHERE 1=1";
  const countBindings = [];

  if (search) {
    countQuery += " AND (sanskrit LIKE ? OR transliteration LIKE ? OR primary_meaning LIKE ?)";
    const searchPattern = `%${search}%`;
    countBindings.push(searchPattern, searchPattern, searchPattern);
  }

  const countStmt = env.VAAN_LEXICON_DB.prepare(countQuery);
  const { count } = await countStmt.bind(...countBindings).first();

  return {
    lexemes: results || [],
    total: count,
    page,
    pageSize: limit,
    totalPages: Math.ceil(count / limit)
  };
}

// ===== DAILY WORDS FUNCTIONS =====

async function getDailyWordsSchedule(env) {
  // Get the word of day log to show what has been used
  const { results } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT wod.lexeme_id, wod.created_at, l.sanskrit, l.transliteration, l.primary_meaning
     FROM word_of_day_log wod
     JOIN lexemes l ON l.id = wod.lexeme_id
     ORDER BY wod.created_at DESC
     LIMIT 100`
  ).all();

  return results || [];
}

// ===== USER MANAGEMENT FUNCTIONS =====

async function getUsers(env, page, search = null, limit = 50) {
  const offset = (page - 1) * limit;
  let query = "SELECT id, email, name, picture_url, is_admin, last_login_at FROM users WHERE 1=1";
  const bindings = [];

  if (search) {
    query += " AND (email LIKE ? OR name LIKE ?)";
    const searchPattern = `%${search}%`;
    bindings.push(searchPattern, searchPattern);
  }

  query += " ORDER BY last_login_at DESC LIMIT ? OFFSET ?";
  bindings.push(limit, offset);

  const stmt = env.VAAN_LEXICON_DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  // Get total count
  let countQuery = "SELECT COUNT(*) as count FROM users WHERE 1=1";
  const countBindings = [];

  if (search) {
    countQuery += " AND (email LIKE ? OR name LIKE ?)";
    const searchPattern = `%${search}%`;
    countBindings.push(searchPattern, searchPattern);
  }

  const countStmt = env.VAAN_LEXICON_DB.prepare(countQuery);
  const { count } = await countStmt.bind(...countBindings).first();

  return {
    users: results || [],
    total: count,
    page,
    pageSize: limit,
    totalPages: Math.ceil(count / limit)
  };
}

async function getUserActivity(env, userId) {
  // Get user's learning progress
  const progress = await getUserProgress(env, userId);

  // Get recent flashcard reviews
  const { results: recentReviews } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT wp.*, bn.name, bn.meaning
     FROM user_word_progress wp
     JOIN baby_names bn ON wp.baby_name_id = bn.id
     WHERE wp.user_id = ?
     ORDER BY wp.last_reviewed_at DESC
     LIMIT 20`
  ).bind(userId).all();

  // Get recent quiz attempts
  const { results: recentQuizzes } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT qa.*, bn.name, bn.meaning
     FROM user_quiz_attempts qa
     JOIN baby_names bn ON qa.baby_name_id = bn.id
     WHERE qa.user_id = ?
     ORDER BY qa.attempted_at DESC
     LIMIT 20`
  ).bind(userId).all();

  return {
    progress,
    recent_reviews: recentReviews || [],
    recent_quizzes: recentQuizzes || []
  };
}

// ===== ADMIN STATS FUNCTIONS =====

async function getAdminStats(env) {
  // Get counts for all main resources
  const totalUsers = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM users"
  ).first();

  const totalLexemes = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM lexemes"
  ).first();

  const totalBabyNames = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM baby_names"
  ).first();

  const totalVideos = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM sanskrit_videos"
  ).first();

  const totalBlogPosts = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM blog_posts"
  ).first();

  const totalNews = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM sanskrit_news"
  ).first();

  const publishedBlogs = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'"
  ).first();

  const draftBlogs = await env.VAAN_LEXICON_DB.prepare(
    "SELECT COUNT(*) as count FROM blog_posts WHERE status = 'draft'"
  ).first();

  // Get recent user signups (last 30 days)
  const recentSignups = await env.VAAN_LEXICON_DB.prepare(
    `SELECT COUNT(*) as count FROM users
     WHERE last_login_at >= datetime('now', '-30 days')`
  ).first();

  // Get active users (logged in last 7 days)
  const activeUsers = await env.VAAN_LEXICON_DB.prepare(
    `SELECT COUNT(*) as count FROM users
     WHERE last_login_at >= datetime('now', '-7 days')`
  ).first();

  return {
    users: {
      total: totalUsers.count,
      recent_signups: recentSignups.count,
      active_users: activeUsers.count
    },
    content: {
      lexemes: totalLexemes.count,
      baby_names: totalBabyNames.count,
      videos: totalVideos.count,
      blog_posts: totalBlogPosts.count,
      published_blogs: publishedBlogs.count,
      draft_blogs: draftBlogs.count,
      news: totalNews.count
    }
  };
}

async function getAuditLog(env, limit = 100) {
  const { results } = await env.VAAN_LEXICON_DB.prepare(
    `SELECT al.*, u.email, u.name
     FROM admin_audit_log al
     JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC
     LIMIT ?`
  ).bind(limit).all();

  return (results || []).map(log => ({
    ...log,
    metadata: log.metadata_json ? JSON.parse(log.metadata_json) : {}
  }));
}
