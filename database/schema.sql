-- LightHunt database. Run once:  mysql -u root -p < database/schema.sql
-- Everyone uses THESE table and column names. If you need a new column, tell the team first.

DROP DATABASE IF EXISTS lighthunt;
CREATE DATABASE lighthunt;
USE lighthunt;

-- LHT-1 User and Role Management
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('creator','contributor','moderator','admin') NOT NULL DEFAULT 'creator',
  status        ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LHT-2 Photo-Spot Management and Moderation
CREATE TABLE spots (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  latitude        DECIMAL(9,6) NOT NULL,
  longitude       DECIMAL(9,6) NOT NULL,
  facing_degrees  SMALLINT NOT NULL,              -- 0 = North, 90 = East, 180 = South, 270 = West
  content_types   SET('portraits','reels','architecture','landscapes') NOT NULL,
  contributor_id  INT,
  status          ENUM('pending','approved','rejected','sent_back') NOT NULL DEFAULT 'pending',
  moderator_note  TEXT,
  reviewed_by     INT,
  reviewed_at     DATETIME,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contributor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by)    REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE spot_photos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  spot_id    INT NOT NULL,
  file_path  VARCHAR(255) NOT NULL,             -- e.g. /uploads/1697000000-charminar.jpg
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
);

-- LHT-10 Ratings and Reviews
CREATE TABLE reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  spot_id    INT NOT NULL,
  user_id    INT NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- LHT-6 Creator Preferences (location is NOT stored, per the SRS privacy rule)
CREATE TABLE preferences (
  user_id         INT PRIMARY KEY,
  free_from       TIME,
  free_to         TIME,
  max_distance_km DECIMAL(5,1) DEFAULT 5,
  content_type    ENUM('portraits','reels','architecture','landscapes'),
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- LHT-7 Route Planning
CREATE TABLE trip_routes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  trip_date  DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE route_stops (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  route_id   INT NOT NULL,
  spot_id    INT NOT NULL,
  stop_order TINYINT NOT NULL,
  arrive_at  TIME,
  leave_by   TIME,
  FOREIGN KEY (route_id) REFERENCES trip_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (spot_id)  REFERENCES spots(id) ON DELETE CASCADE
);
