-- =============================================================================
-- DATABASE SCHEMA & QUERIES (MySQL Example)
-- =============================================================================
-- Iyi fayili irerekana uko database yari kuba iteye n'uko queries zari kwandikwa 
-- iyo tuba dukoresha MySQL. Porogaramu y'ukuri ikoresha Firebase Firestore.
-- Ibi ni ukugira ngo ubashe gusobanukirwa imiterere y'amakuru gusa.

-- =============================================================================
-- 1. Imbonerahamwe y'Abakoresha (Users Table)
-- =============================================================================
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,       -- Firebase Auth UID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query: Gushyiramo umukoresha mushya
INSERT INTO users (id, name, email, avatar_url, is_admin) 
VALUES ('firebase_uid_goes_here', 'John Doe', 'john.doe@example.com', 'http://...', false);


-- =============================================================================
-- 2. Imbonerahamwe ya Posts
-- =============================================================================
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_uid VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT,                      -- URL from Firebase Storage
    media_type VARCHAR(50),              -- e.g., 'image/jpeg' or 'video/mp4'
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_uid) REFERENCES users(id)
);

-- Query: Gushyiramo post nshya
INSERT INTO posts (author_uid, content, image_url, media_type) 
VALUES ('firebase_uid_goes_here', 'Iyi ni post yanjye ya mbere!', 'http://storage.url/image.png', 'image/png');

-- Query: Kureba posts zose, uhereye ku nshya
SELECT 
    p.id, 
    p.content, 
    p.image_url, 
    p.created_at, 
    u.name as author_name, 
    u.avatar_url as author_avatar
FROM posts p
JOIN users u ON p.author_uid = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Query: Kureba posts z'umuntu umwe
SELECT * FROM posts WHERE author_uid = 'firebase_uid_goes_here' ORDER BY created_at DESC;


-- =============================================================================
-- 3. Imbonerahamwe ya Likes
-- =============================================================================
-- Ibi bituma tumenya umuntu wakunze post, kandi ntiyikunde kabiri.
CREATE TABLE likes (
    user_uid VARCHAR(255) NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uid, post_id),
    FOREIGN KEY (user_uid) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Query: Gukunda (Like) post
-- Ibi byakorwa muri transaction:
-- 1. Ongeramo like muri `likes` table
INSERT INTO likes (user_uid, post_id) VALUES ('liker_uid', 123);
-- 2. Ongeraho 1 kuri likes_count muri `posts` table
UPDATE posts SET likes_count = likes_count + 1 WHERE id = 123;

-- Query: Gukuramo like
-- Ibi nabyo byakorwa muri transaction:
-- 1. Kuramo like muri `likes` table
DELETE FROM likes WHERE user_uid = 'liker_uid' AND post_id = 123;
-- 2. Gabanya 1 kuri likes_count muri `posts` table
UPDATE posts SET likes_count = likes_count - 1 WHERE id = 123;


-- =============================================================================
-- 4. Imbonerahamwe y'Ibitekerezo (Comments)
-- =============================================================================
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_uid VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_uid) REFERENCES users(id) ON DELETE CASCADE
);

-- Query: Gushyiraho igitekerezo
INSERT INTO comments (post_id, user_uid, text) 
VALUES (123, 'commenter_uid', 'Post nziza cyane!');


-- =============================================================================
-- 5. Imbonerahamwe y'Ubutumwa (Messages)
-- =============================================================================
-- Iyi ni imbonerahamwe y'ubutumwa bwo muri group chat
CREATE TABLE group_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    text TEXT,
    image_url TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uid) REFERENCES users(id)
);

-- Iyi ni imbonerahamwe y'ubutumwa bw'abantu babiri (private chat)
CREATE TABLE private_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(512) NOT NULL, -- ID ihuriweho n'abantu 2 (e.g., uid1_uid2)
    sender_uid VARCHAR(255) NOT NULL,
    receiver_uid VARCHAR(255) NOT NULL,
    text TEXT,
    image_url TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_uid) REFERENCES users(id),
    FOREIGN KEY (receiver_uid) REFERENCES users(id)
);

-- Query: Kohereza ubutumwa muri group
INSERT INTO group_messages (user_uid, text) VALUES ('user_uid_1', 'Muraho mwese!');

-- Query: Kohereza ubutumwa kuri umuntu umwe
INSERT INTO private_messages (chat_id, sender_uid, receiver_uid, text)
VALUES ('uid1_uid2', 'uid1', 'uid2', 'Bite se ?');
