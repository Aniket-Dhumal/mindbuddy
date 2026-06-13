package db

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"

	_ "github.com/glebarez/go-sqlite"
	_ "github.com/jackc/pgx/v5/stdlib"
)

var DB *sql.DB

// InitDB initializes the database. If DATABASE_URL starts with postgresql:// or postgres://,
// it uses PostgreSQL. Otherwise, it falls back to SQLite.
func InitDB() (*sql.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	var driverName, dataSourceName string

	if databaseURL != "" && (strings.HasPrefix(databaseURL, "postgres://") || strings.HasPrefix(databaseURL, "postgresql://")) {
		fmt.Println("[DB INFO] Connecting to PostgreSQL...")
		driverName = "pgx"
		dataSourceName = databaseURL
	} else {
		fmt.Println("[DB INFO] PostgreSQL connection string empty or inactive. Falling back to local SQLite...")
		driverName = "sqlite"
		dataSourceName = "mindbuddy.db"
	}

	db, err := sql.Open(driverName, dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %v", err)
	}

	// Apply strict connection pooling constraints (NFR-3.2)
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verify connection is alive
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	DB = db
	fmt.Printf("[DB INFO] Connection pool successfully initialized (MaxOpenConns = 25). Database driver: %s\n", driverName)

	// Run migration schemas
	if err := runMigrations(db, driverName); err != nil {
		return nil, fmt.Errorf("failed to run database migrations: %v", err)
	}

	return db, nil
}

func runMigrations(db *sql.DB, driverName string) error {
	var createTableQuery string

	if driverName == "pgx" {
		createTableQuery = `
		CREATE TABLE IF NOT EXISTS student_wellness_logs (
			id BIGSERIAL PRIMARY KEY,
			student_id VARCHAR(255) NOT NULL,
			exam_target VARCHAR(50) NOT NULL,
			journal_entry_raw TEXT NOT NULL,
			hidden_stress_triggers TEXT NOT NULL, -- Stored as JSON-encoded string
			burnout_risk_index DOUBLE PRECISION NOT NULL,
			coping_strategy_payload TEXT NOT NULL,
			mindfulness_exercise_assigned VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_student_wellness_logs_student_id ON student_wellness_logs(student_id);
		`
	} else {
		// SQLite compatible schema
		createTableQuery = `
		CREATE TABLE IF NOT EXISTS student_wellness_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id TEXT NOT NULL,
			exam_target TEXT NOT NULL,
			journal_entry_raw TEXT NOT NULL,
			hidden_stress_triggers TEXT NOT NULL, -- Stored as JSON-encoded string
			burnout_risk_index REAL NOT NULL,
			coping_strategy_payload TEXT NOT NULL,
			mindfulness_exercise_assigned TEXT NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_student_wellness_logs_student_id ON student_wellness_logs(student_id);
		`
	}

	_, err := db.Exec(createTableQuery)
	if err != nil {
		return fmt.Errorf("migration query failed: %v", err)
	}

	fmt.Println("[DB INFO] Database migration completed successfully.")
	return nil
}
