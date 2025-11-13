use worker::*;

#[event(fetch)]
async fn main(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    let url = req.url()?;
    let path = url.path();

    // CORS headers
    let cors_headers = vec![
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, OPTIONS"),
        ("Access-Control-Allow-Headers", "Content-Type"),
    ];

    // Handle OPTIONS request
    if req.method() == Method::Options {
        let mut response = Response::empty()?;
        for (key, value) in cors_headers {
            response.headers_mut().set(key, value)?;
        }
        return Ok(response);
    }

    // Routes
    match path {
        p if p.starts_with("/baby-name/") => {
            // Extract slug from path
            let slug = p.trim_start_matches("/baby-name/");

            // Get query parameters for name details
            let query_pairs: Vec<(String, String)> = url.query_pairs().map(|(k, v)| (k.to_string(), v.to_string())).collect();

            let mut name = String::new();
            let mut pronunciation = String::new();
            let mut meaning = String::new();
            let mut story = String::new();
            let mut gender = String::new();

            for (key, value) in query_pairs {
                match key.as_str() {
                    "name" => name = value,
                    "pronunciation" => pronunciation = value,
                    "meaning" => meaning = value,
                    "story" => story = value,
                    "gender" => gender = value,
                    _ => {}
                }
            }

            if name.is_empty() {
                name = slug.replace("-", " ");
            }

            let svg = generate_baby_name_svg(&name, &pronunciation, &meaning, &story, &gender);

            let mut response = Response::from_body(ResponseBody::Body(svg.into_bytes()))?;
            response.headers_mut().set("Content-Type", "image/svg+xml")?;
            response.headers_mut().set("Cache-Control", "public, max-age=31536000, immutable")?;
            for (key, value) in cors_headers {
                response.headers_mut().set(key, value)?;
            }

            Ok(response)
        }
        p if p.starts_with("/word/") => {
            // Extract word ID from path
            let _word_id = p.trim_start_matches("/word/");

            // Get query parameters for word details
            let query_pairs: Vec<(String, String)> = url.query_pairs().map(|(k, v)| (k.to_string(), v.to_string())).collect();

            let mut sanskrit = String::new();
            let mut transliteration = String::new();
            let mut meaning = String::new();

            for (key, value) in query_pairs {
                match key.as_str() {
                    "sanskrit" => sanskrit = value,
                    "transliteration" => transliteration = value,
                    "meaning" => meaning = value,
                    _ => {}
                }
            }

            let svg = generate_word_svg(&sanskrit, &transliteration, &meaning);

            let mut response = Response::from_body(ResponseBody::Body(svg.into_bytes()))?;
            response.headers_mut().set("Content-Type", "image/svg+xml")?;
            response.headers_mut().set("Cache-Control", "public, max-age=3600")?;
            for (key, value) in cors_headers {
                response.headers_mut().set(key, value)?;
            }

            Ok(response)
        }
        _ => {
            Response::error("Not found", 404)
        }
    }
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn wrap_text(text: &str, max_width: usize) -> Vec<String> {
    let words: Vec<&str> = text.split_whitespace().collect();
    let mut lines = Vec::new();
    let mut current_line = String::new();

    for word in words {
        if current_line.is_empty() {
            current_line = word.to_string();
        } else if current_line.len() + word.len() + 1 <= max_width {
            current_line.push(' ');
            current_line.push_str(word);
        } else {
            lines.push(current_line);
            current_line = word.to_string();
        }
    }

    if !current_line.is_empty() {
        lines.push(current_line);
    }

    lines
}

fn generate_baby_name_svg(
    name: &str,
    pronunciation: &str,
    meaning: &str,
    story: &str,
    gender: &str,
) -> String {
    let name_safe = escape_xml(name);
    let pronunciation_safe = escape_xml(pronunciation);

    // Wrap meaning and story text
    let meaning_lines = wrap_text(meaning, 60);
    let story_lines = if !story.is_empty() {
        wrap_text(story, 80)
    } else {
        Vec::new()
    };

    let mut y_offset = 360;  // Start meaning after pronunciation with proper spacing
    let meaning_text = meaning_lines.iter().enumerate().map(|(i, line)| {
        let y = y_offset + (i * 35);
        format!(r##"  <text x="600" y="{}" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#000000" text-anchor="middle">{}</text>"##, y, escape_xml(line))
    }).collect::<Vec<_>>().join("\n");

    y_offset += meaning_lines.len() * 35 + 30;  // Reduced spacing before story

    let story_text = if !story_lines.is_empty() {
        let lines = story_lines.iter().enumerate().map(|(i, line)| {
            let y = y_offset + (i * 28);
            format!(r##"  <text x="600" y="{}" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#333333" text-anchor="middle">{}</text>"##, y, escape_xml(line))
        }).collect::<Vec<_>>().join("\n");
        lines
    } else {
        String::new()
    };

    format!(r##"<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with 4px border -->
  <rect width="1200" height="630" fill="#FFFFFF" rx="4"/>
  <rect x="4" y="4" width="1192" height="622" fill="#FFFFFF" stroke="#000000" stroke-width="4" rx="4"/>

  <!-- Rounded rect box for name -->
  <rect x="100" y="140" width="1000" height="140" rx="20" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>

  <!-- Name (centered in box) -->
  <text x="600" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="#000000" text-anchor="middle">{}</text>

  <!-- Pronunciation -->
  <text x="600" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#666666" text-anchor="middle" font-style="italic">{}</text>

  <!-- Meaning -->
{}

  <!-- Story -->
{}

  <!-- Branding -->
  <text x="60" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#666666">sanskrit.roj.app</text>
</svg>"##, name_safe, pronunciation_safe, meaning_text, story_text)
}

fn generate_word_svg(
    sanskrit: &str,
    transliteration: &str,
    meaning: &str,
) -> String {
    let sanskrit_safe = escape_xml(sanskrit);
    let transliteration_safe = escape_xml(transliteration);

    // Wrap meaning text
    let meaning_lines = wrap_text(meaning, 70);
    let meaning_text = meaning_lines.iter().enumerate().map(|(i, line)| {
        let y = 420 + (i * 32);
        format!(r##"  <text x="600" y="{}" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#000000" text-anchor="middle">{}</text>"##, y, escape_xml(line))
    }).collect::<Vec<_>>().join("\n");

    format!(r##"<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with 4px border -->
  <rect width="1200" height="630" fill="#FFFFFF" rx="4"/>
  <rect x="4" y="4" width="1192" height="622" fill="#FFFFFF" stroke="#000000" stroke-width="4" rx="4"/>

  <!-- Title -->
  <text x="600" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#666666" text-anchor="middle">Sanskrit Word of the Day</text>

  <!-- Rounded rect box for word -->
  <rect x="150" y="150" width="900" height="180" rx="20" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>

  <!-- Sanskrit word (centered in box) -->
  <text x="600" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="90" font-weight="bold" fill="#000000" text-anchor="middle">{}</text>

  <!-- Transliteration -->
  <text x="600" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="#666666" text-anchor="middle" font-style="italic">{}</text>

  <!-- Meaning -->
{}

  <!-- Branding -->
  <text x="60" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#666666">sanskrit.roj.app</text>
</svg>"##, sanskrit_safe, transliteration_safe, meaning_text)
}
