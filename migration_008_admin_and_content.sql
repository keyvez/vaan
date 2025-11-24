-- Migration: Add admin functionality and new content types (videos, blog, news)

-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Create index on is_admin for faster queries
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Create sanskrit_videos table
CREATE TABLE IF NOT EXISTS sanskrit_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- duration in seconds
  category TEXT, -- Pronunciation, Grammar, Culture, Stories, Mantras, Songs
  thumbnail_url TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX idx_videos_slug ON sanskrit_videos(slug);
CREATE INDEX idx_videos_category ON sanskrit_videos(category);
CREATE INDEX idx_videos_published_at ON sanskrit_videos(published_at);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_markdown TEXT NOT NULL,
  excerpt TEXT,
  author_id TEXT NOT NULL, -- user.id from Google OAuth
  status TEXT DEFAULT 'draft', -- draft, published
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Create indexes for blog_posts
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_status ON blog_posts(status);
CREATE INDEX idx_blog_author ON blog_posts(author_id);
CREATE INDEX idx_blog_published_at ON blog_posts(published_at);

-- Create FTS index for blog search
CREATE VIRTUAL TABLE blog_posts_fts USING fts5(title, excerpt, content=blog_posts, content_rowid=id);

-- Populate FTS index (empty initially)
INSERT INTO blog_posts_fts(rowid, title, excerpt)
SELECT id, title, excerpt FROM blog_posts;

-- Create triggers to keep blog FTS in sync
CREATE TRIGGER blog_posts_ai AFTER INSERT ON blog_posts BEGIN
  INSERT INTO blog_posts_fts(rowid, title, excerpt) VALUES (new.id, new.title, new.excerpt);
END;

CREATE TRIGGER blog_posts_ad AFTER DELETE ON blog_posts BEGIN
  INSERT INTO blog_posts_fts(blog_posts_fts, rowid, title, excerpt) VALUES('delete', old.id, old.title, old.excerpt);
END;

CREATE TRIGGER blog_posts_au AFTER UPDATE ON blog_posts BEGIN
  INSERT INTO blog_posts_fts(blog_posts_fts, rowid, title, excerpt) VALUES('delete', old.id, old.title, old.excerpt);
  INSERT INTO blog_posts_fts(rowid, title, excerpt) VALUES (new.id, new.title, new.excerpt);
END;

-- Create sanskrit_news table
CREATE TABLE IF NOT EXISTS sanskrit_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_markdown TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sanskrit_news
CREATE INDEX idx_news_slug ON sanskrit_news(slug);
CREATE INDEX idx_news_published_at ON sanskrit_news(published_at);

-- Create FTS index for news search
CREATE VIRTUAL TABLE sanskrit_news_fts USING fts5(title, content_markdown, content=sanskrit_news, content_rowid=id);

-- Populate FTS index (empty initially)
INSERT INTO sanskrit_news_fts(rowid, title, content_markdown)
SELECT id, title, content_markdown FROM sanskrit_news;

-- Create triggers to keep news FTS in sync
CREATE TRIGGER sanskrit_news_ai AFTER INSERT ON sanskrit_news BEGIN
  INSERT INTO sanskrit_news_fts(rowid, title, content_markdown) VALUES (new.id, new.title, new.content_markdown);
END;

CREATE TRIGGER sanskrit_news_ad AFTER DELETE ON sanskrit_news BEGIN
  INSERT INTO sanskrit_news_fts(sanskrit_news_fts, rowid, title, content_markdown) VALUES('delete', old.id, old.title, old.content_markdown);
END;

CREATE TRIGGER sanskrit_news_au AFTER UPDATE ON sanskrit_news BEGIN
  INSERT INTO sanskrit_news_fts(sanskrit_news_fts, rowid, title, content_markdown) VALUES('delete', old.id, old.title, old.content_markdown);
  INSERT INTO sanskrit_news_fts(rowid, title, content_markdown) VALUES (new.id, new.title, new.content_markdown);
END;

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- create, update, delete, approve, reject
  resource_type TEXT NOT NULL, -- lexeme, baby_name, video, blog, news, user
  resource_id TEXT,
  metadata_json TEXT, -- JSON string with additional details
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for audit log
CREATE INDEX idx_audit_user_id ON admin_audit_log(user_id);
CREATE INDEX idx_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON admin_audit_log(created_at);

-- Grant admin access to keyvez@gmail.com (initial admin)
-- This will be executed after the users table has the is_admin column
UPDATE users SET is_admin = 1 WHERE email = 'keyvez@gmail.com';
