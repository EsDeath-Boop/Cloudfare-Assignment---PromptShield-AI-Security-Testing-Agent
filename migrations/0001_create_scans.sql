CREATE TABLE scans (
    id TEXT PRIMARY KEY,
    system_prompt TEXT NOT NULL,
    attacks_per_category INTEGER NOT NULL,
    status TEXT NOT NULL,
    score INTEGER,
    grade TEXT,
    vulnerable_tests INTEGER,
    total_tests INTEGER,
    result_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);