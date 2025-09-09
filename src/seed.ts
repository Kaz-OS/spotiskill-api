import { SQL } from "bun";

const sqlite = new SQL("sqlite://src/data.db");

await sqlite`DROP TABLE IF EXISTS Playing`;
await sqlite`DROP TABLE IF EXISTS PlaylistSong`;
await sqlite`DROP TABLE IF EXISTS Song`;
await sqlite`DROP TABLE IF EXISTS Album`;
await sqlite`DROP TABLE IF EXISTS Playlist`;
await sqlite`DROP TABLE IF EXISTS SignupRequest`;
await sqlite`DROP TABLE IF EXISTS User`;

await sqlite`
  CREATE TABLE Album (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    release_date DATE
  )
`;

await sqlite`
  CREATE TABLE User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT
  )
`;

await sqlite`
  CREATE TABLE SignupRequest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'pending'
  )
`;

await sqlite`
  CREATE TABLE Playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL
  )
`;

await sqlite`
  CREATE TABLE Song (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album_id INTEGER NOT NULL,
    FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE
  )
`;

await sqlite`
  CREATE TABLE PlaylistSong (
    playlist_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    position INTEGER,
    PRIMARY KEY (playlist_id, song_id),
    FOREIGN KEY (playlist_id) REFERENCES Playlist(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES Song(id) ON DELETE CASCADE
  )
`;

await sqlite`
  CREATE TABLE Playing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    time INTEGER NOT NULL,
    playing_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (song_id) REFERENCES Song(id) ON DELETE RESTRICT ON UPDATE RESTRICT
  )
`;

await sqlite`
  INSERT INTO Album (id, title, artist, release_date) VALUES
    (1, 'A Night at the Opera', 'Queen', '1975-07-16'),
    (2, 'Led Zeppelin IV', 'Led Zeppelin', '1982-07-14'),
    (3, 'Thriller', 'Michael Jackson', '1984-07-11')
`;

await sqlite`
  INSERT INTO User (id, email, password, first_name, last_name) VALUES
    (1, 'admin@email.com', 'password', 'Admin', 'Admin'),
    (2, 'user1@email.com', 'password', 'User1', 'User1'),
    (3, 'user2@email.com', 'password', 'User2', 'User2')
`;

await sqlite`
  INSERT INTO SignupRequest (id, email, password, first_name, last_name, status) VALUES
    (1, 'john.doe@email.com', 'password', 'John', 'Doe', 'pending'),
    (2, 'john.doe2@email.com', 'password', 'John', 'Doe', 'pending')
`;

await sqlite`
  INSERT INTO Playlist (id, title, author) VALUES
    (1, 'Rock Classics', 'John Doe'),
    (2, '80s Pop', 'John Doe')
`;

await sqlite`
  INSERT INTO Song (id, title, artist, album_id) VALUES
    (1, 'Bohemian Rhapsody', 'Queen', 1),
    (2, 'You''re My Best Friend', 'Queen', 1),
    (3, 'Love of My Life', 'Queen', 1),
    (4, 'Black Dog', 'Led Zeppelin', 2),
    (5, 'Rock and Roll', 'Led Zeppelin', 2),
    (6, 'Stairway to Heaven', 'Led Zeppelin', 2),
    (7, 'Thriller', 'Michael Jackson', 3),
    (8, 'Beat It', 'Michael Jackson', 3),
    (9, 'Billie Jean', 'Michael Jackson', 3)
`;

await sqlite`
  INSERT INTO PlaylistSong (playlist_id, song_id, position) VALUES
    (1, 3, 1),
    (1, 6, 2),
    (1, 4, 3),
    (2, 2, 1),
    (2, 9, 2),
    (2, 3, 3)
`;

const now = Date.now();
const playingRows = [
  [1, 1, 4, 455, now - 2 * 60 * 60 * 1000],
  [2, 1, 4, 455, now - 1 * 60 * 60 * 1000],
  [3, 1, 4, 455, now - 30 * 60 * 1000],
  [4, 1, 4, 455, now - 15 * 60 * 1000],
  [5, 1, 6, 455, now - 10 * 60 * 1000],
  [6, 1, 5, 455, now - 5 * 60 * 1000],
  [7, 2, 4, 455, now - 2 * 60 * 60 * 1000],
  [8, 2, 7, 234, now - 1 * 60 * 60 * 1000],
  [9, 3, 2, 567, now - 30 * 60 * 1000],
  [10, 3, 1, 567, now - 2 * 30 * 24 * 60 * 60 * 1000],
  [11, 1, 1, 455, now - 4 * 30 * 24 * 60 * 60 * 1000],
];

for (const [id, user_id, song_id, time, ms] of playingRows) {
  const playing_at = new Date(ms).toISOString().slice(0, 19).replace("T", " ");

  await sqlite`
    INSERT INTO Playing (id, user_id, song_id, time, playing_at)
    VALUES (${id}, ${user_id}, ${song_id}, ${time}, ${playing_at})
  `;
}

console.log("Database seeded!");
