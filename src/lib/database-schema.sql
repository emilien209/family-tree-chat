-- This file is for reference purposes to illustrate the database structure
-- if it were implemented in MySQL. The actual application uses Firebase Firestore (NoSQL).

-- =============================================
-- Table Definitions (Data Definition Language)
-- =============================================

-- Table for storing user information
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,       -- Corresponds to Firebase Auth UID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,                   -- URL to the profile picture in Firebase Storage
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing posts made by users
CREATE TABLE posts (
    id VARCHAR(255) PRIMARY KEY,      -- Corresponds to Firestore Document ID
    user_id VARCHAR(255) NOT NULL,    -- Foreign key to the users table
    content TEXT,                     -- The caption or text of the post
    image_url TEXT,                   -- URL to the image in Firebase Storage
    video_url TEXT,                   -- URL to the video in Firebase Storage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table for storing comments on posts
CREATE TABLE comments (
    id VARCHAR(255) PRIMARY KEY,       -- Corresponds to Firestore Document ID
    post_id VARCHAR(255) NOT NULL,     -- Foreign key to the posts table
    user_id VARCHAR(255) NOT NULL,     -- Foreign key to the users table
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table for storing likes on posts
-- Using a composite primary key to ensure a user can only like a post once.
CREATE TABLE likes (
    post_id VARCHAR(255) NOT NULL,     -- Foreign key to the posts table
    user_id VARCHAR(255) NOT NULL,     -- Foreign key to the users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- ==================================================
-- Example Queries (Data Manipulation Language)
-- ==================================================

-- 1. Query to add a new user (e.g., during registration)
-- In the app, this is done via `setDoc(doc(db, "users", user.uid), ...)`
INSERT INTO users (id, name, email, avatar_url, is_admin)
VALUES ('firebase_user_uid_123', 'Emile N.', 'emile@example.com', 'https://example.com/avatar.png', FALSE);


-- 2. Query to create a new post with an image
-- In the app, the image/video is first uploaded to Firebase Storage to get a URL.
-- Then, the post data (including the URL) is saved to Firestore.
INSERT INTO posts (id, user_id, content, image_url)
VALUES ('firestore_post_id_abc', 'firebase_user_uid_123', 'Enjoying the beautiful weather!', 'https://firebasestorage.googleapis.com/v0/b/.../media.png');


-- 3. Query to add a "like" to a post
-- In the app, this is done by adding a document to a 'likes' sub-collection.
INSERT INTO likes (post_id, user_id)
VALUES ('firestore_post_id_abc', 'another_user_uid_456');


-- 4. Query to fetch all posts for the main feed, ordered by the newest first
-- In the app, this is done in `feed/page.tsx` using a Firestore query.
SELECT 
    p.id, 
    p.content, 
    p.image_url, 
    p.created_at, 
    u.name AS author_name, 
    u.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
FROM 
    posts p
JOIN 
    users u ON p.user_id = u.id
ORDER BY 
    p.created_at DESC
LIMIT 10;


-- 5. Query to fetch all posts for a specific user's profile page
-- In the app, this is done in `profile/page.tsx`.
SELECT id, image_url, video_url, content FROM posts
WHERE user_id = 'firebase_user_uid_123'
ORDER BY created_at DESC;

-- 6. Query to fetch all comments for a specific post
-- In the app, this is handled by fetching the 'comments' array field from a post document.
SELECT c.text, c.created_at, u.name, u.avatar_url
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.post_id = 'firestore_post_id_abc'
ORDER BY c.created_at ASC;
