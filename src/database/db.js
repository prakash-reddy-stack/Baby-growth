import * as SQLite from 'expo-sqlite';

let db;

export const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('babygrowth.db');
    await initSchema();
  }
  return db;
};

const initSchema = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS baby (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT,
      photo_uri TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent','caregiver','doctor')),
      invite_code TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feeding_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('breastfeed','formula')),
      amount_ml REAL,
      duration_min REAL,
      logged_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(baby_id) REFERENCES baby(id)
    );

    CREATE TABLE IF NOT EXISTS growth_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      weight_kg REAL,
      height_cm REAL,
      head_cm REAL,
      recorded_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(baby_id) REFERENCES baby(id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      achieved_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(baby_id) REFERENCES baby(id)
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      vaccine_name TEXT NOT NULL,
      scheduled_age_weeks INTEGER,
      administered_at TEXT,
      location TEXT,
      notes TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(baby_id) REFERENCES baby(id)
    );

    CREATE TABLE IF NOT EXISTS feeding_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      interval_hours REAL NOT NULL DEFAULT 3,
      is_active INTEGER DEFAULT 1,
      last_fed_at TEXT,
      FOREIGN KEY(baby_id) REFERENCES baby(id)
    );
  `);
};

// ─── Baby ────────────────────────────────────────────────────────────────────
export const insertBaby = async (name, dob, gender, photoUri) => {
  const d = await getDb();
  const result = await d.runAsync(
    'INSERT INTO baby (name, dob, gender, photo_uri) VALUES (?, ?, ?, ?)',
    [name, dob, gender, photoUri]
  );
  return result.lastInsertRowId;
};

export const getBaby = async () => {
  const d = await getDb();
  return d.getFirstAsync('SELECT * FROM baby ORDER BY id LIMIT 1');
};

export const updateBaby = async (id, name, dob, gender, photoUri) => {
  const d = await getDb();
  await d.runAsync(
    'UPDATE baby SET name=?, dob=?, gender=?, photo_uri=? WHERE id=?',
    [name, dob, gender, photoUri, id]
  );
};

// ─── Feeding ─────────────────────────────────────────────────────────────────
export const insertFeeding = async (babyId, type, amountMl, durationMin, loggedAt, notes) => {
  const d = await getDb();
  const result = await d.runAsync(
    'INSERT INTO feeding_logs (baby_id, type, amount_ml, duration_min, logged_at, notes) VALUES (?,?,?,?,?,?)',
    [babyId, type, amountMl, durationMin, loggedAt, notes]
  );
  return result.lastInsertRowId;
};

export const getFeedings = async (babyId, limit = 50) => {
  const d = await getDb();
  return d.getAllAsync(
    'SELECT * FROM feeding_logs WHERE baby_id=? ORDER BY logged_at DESC LIMIT ?',
    [babyId, limit]
  );
};

export const deleteFeeding = async (id) => {
  const d = await getDb();
  await d.runAsync('DELETE FROM feeding_logs WHERE id=?', [id]);
};

// ─── Growth ──────────────────────────────────────────────────────────────────
export const insertGrowth = async (babyId, weightKg, heightCm, headCm, recordedAt, notes) => {
  const d = await getDb();
  const result = await d.runAsync(
    'INSERT INTO growth_records (baby_id, weight_kg, height_cm, head_cm, recorded_at, notes) VALUES (?,?,?,?,?,?)',
    [babyId, weightKg, heightCm, headCm, recordedAt, notes]
  );
  return result.lastInsertRowId;
};

export const getGrowthRecords = async (babyId) => {
  const d = await getDb();
  return d.getAllAsync(
    'SELECT * FROM growth_records WHERE baby_id=? ORDER BY recorded_at ASC',
    [babyId]
  );
};

export const deleteGrowth = async (id) => {
  const d = await getDb();
  await d.runAsync('DELETE FROM growth_records WHERE id=?', [id]);
};

// ─── Milestones ───────────────────────────────────────────────────────────────
export const insertMilestone = async (babyId, title, achievedAt, notes) => {
  const d = await getDb();
  await d.runAsync(
    'INSERT INTO milestones (baby_id, title, achieved_at, notes) VALUES (?,?,?,?)',
    [babyId, title, achievedAt, notes]
  );
};

export const getMilestones = async (babyId) => {
  const d = await getDb();
  return d.getAllAsync(
    'SELECT * FROM milestones WHERE baby_id=? ORDER BY achieved_at DESC',
    [babyId]
  );
};

// ─── Vaccinations ─────────────────────────────────────────────────────────────
export const insertVaccination = async (babyId, name, scheduledAgeWeeks, administeredAt, location, notes, isCustom = 0) => {
  const d = await getDb();
  await d.runAsync(
    'INSERT INTO vaccinations (baby_id, vaccine_name, scheduled_age_weeks, administered_at, location, notes, is_custom) VALUES (?,?,?,?,?,?,?)',
    [babyId, name, scheduledAgeWeeks, administeredAt, location, notes, isCustom]
  );
};

export const getVaccinations = async (babyId) => {
  const d = await getDb();
  return d.getAllAsync(
    'SELECT * FROM vaccinations WHERE baby_id=? ORDER BY scheduled_age_weeks ASC, created_at ASC',
    [babyId]
  );
};

export const markVaccinationDone = async (id, administeredAt, location, notes) => {
  const d = await getDb();
  await d.runAsync(
    'UPDATE vaccinations SET administered_at=?, location=?, notes=? WHERE id=?',
    [administeredAt, location, notes, id]
  );
};

export const deleteVaccination = async (id) => {
  const d = await getDb();
  await d.runAsync('DELETE FROM vaccinations WHERE id=?', [id]);
};

// ─── Users / Doctor access ───────────────────────────────────────────────────
export const insertUser = async (name, role, inviteCode) => {
  const d = await getDb();
  const result = await d.runAsync(
    'INSERT INTO users (name, role, invite_code) VALUES (?,?,?)',
    [name, role, inviteCode]
  );
  return result.lastInsertRowId;
};

export const getUsers = async () => {
  const d = await getDb();
  return d.getAllAsync('SELECT * FROM users ORDER BY created_at ASC');
};

export const getUserByInviteCode = async (code) => {
  const d = await getDb();
  return d.getFirstAsync('SELECT * FROM users WHERE invite_code=?', [code]);
};

export const deleteUser = async (id) => {
  const d = await getDb();
  await d.runAsync('DELETE FROM users WHERE id=?', [id]);
};
