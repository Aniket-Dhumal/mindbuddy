package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"mindbuddy-backend/crypto"
	"mindbuddy-backend/db"
	"mindbuddy-backend/models"

	"github.com/gin-gonic/gin"
)

// TestMain sets up Gin mode and initializes the test database with SQLite in-memory fallback.
func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	
	// Force SQLite fallback in test
	os.Setenv("DATABASE_URL", "")
	
	_, err := db.InitDB()
	if err != nil {
		panic("Failed to initialize test database: " + err.Error())
	}
	defer db.DB.Close()

	os.Exit(m.Run())
}

// TestEncryptionDecryption verifies AES-256-GCM encryption/decryption.
func TestEncryptionDecryption(t *testing.T) {
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}

	plaintext := "MindBuddy stress level raw journal text"
	encrypted, err := crypto.Encrypt([]byte(plaintext), key)
	if err != nil {
		t.Fatalf("Encryption failed: %v", err)
	}

	if encrypted == "" {
		t.Fatalf("Encrypted string is empty")
	}

	decrypted, err := crypto.Decrypt(encrypted, key)
	if err != nil {
		t.Fatalf("Decryption failed: %v", err)
	}

	if string(decrypted) != plaintext {
		t.Errorf("Decrypted text does not match. Got '%s', expected '%s'", string(decrypted), plaintext)
	}
}

// TestCMEKRotationAndCompatibility tests active CMEK rotation and backwards decryption compatibility.
func TestCMEKRotationAndCompatibility(t *testing.T) {
	cmek := crypto.NewCMEKManager(10 * time.Millisecond) // Short rotation period for testing

	plaintext1 := "First entry with CMEK v1"
	encrypted1, err := cmek.EncryptWithCMEK([]byte(plaintext1))
	if err != nil {
		t.Fatalf("CMEK Encryption 1 failed: %v", err)
	}

	if !strings.HasPrefix(encrypted1, "v1:") {
		t.Errorf("Expected CMEK payload 1 to start with 'v1:', got: %s", encrypted1)
	}

	// Wait for rotation period to elapse
	time.Sleep(15 * time.Millisecond)

	plaintext2 := "Second entry after auto-rotation to v2"
	encrypted2, err := cmek.EncryptWithCMEK([]byte(plaintext2))
	if err != nil {
		t.Fatalf("CMEK Encryption 2 failed: %v", err)
	}

	if !strings.HasPrefix(encrypted2, "v2:") {
		t.Errorf("Expected CMEK payload 2 to start with 'v2:', got: %s", encrypted2)
	}

	// Decrypt second plaintext (uses v2)
	decrypted2, err := cmek.DecryptWithCMEK(encrypted2)
	if err != nil {
		t.Fatalf("Decryption of v2 text failed: %v", err)
	}
	if string(decrypted2) != plaintext2 {
		t.Errorf("Expected decrypted v2 text '%s', got '%s'", plaintext2, string(decrypted2))
	}

	// Decrypt first plaintext (uses v1 - backwards compatibility!)
	decrypted1, err := cmek.DecryptWithCMEK(encrypted1)
	if err != nil {
		t.Fatalf("Decryption of v1 text after rotation failed: %v", err)
	}
	if string(decrypted1) != plaintext1 {
		t.Errorf("Expected decrypted v1 text '%s', got '%s'", plaintext1, string(decrypted1))
	}
}

// TestDatabasePoolingConstraints verifies MaxOpenConns = 25 setting (NFR-3.2).
func TestDatabasePoolingConstraints(t *testing.T) {
	stats := db.DB.Stats()
	if stats.MaxOpenConnections != 25 {
		t.Errorf("Strict pooling constraint violated: expected MaxOpenConnections = 25, got %d", stats.MaxOpenConnections)
	}
}

// TestDataMappingAndValidationCompliance checks models validation rules.
func TestDataMappingAndValidationCompliance(t *testing.T) {
	// 1. Valid log
	validLog := &models.StudentWellnessLog{
		StudentID:       "student_101",
		ExamTarget:      "JEE_ADVANCED",
		JournalEntryRaw: "I am feeling stressed about the upcoming mock test.",
	}
	if err := models.ValidateWellnessLog(validLog); err != nil {
		t.Errorf("Valid log should pass validation, got error: %v", err)
	}

	// 2. Invalid Exam Target (Compliance/Regulatory check)
	invalidExamLog := &models.StudentWellnessLog{
		StudentID:       "student_101",
		ExamTarget:      "SAT_SUBJECT",
		JournalEntryRaw: "Slightly nervous.",
	}
	if err := models.ValidateWellnessLog(invalidExamLog); err == nil {
		t.Error("Validation should fail for non-compliant ExamTarget, but it succeeded")
	}

	// 3. Empty fields
	emptyLog := &models.StudentWellnessLog{
		StudentID:       "",
		ExamTarget:      "CAT",
		JournalEntryRaw: "",
	}
	if err := models.ValidateWellnessLog(emptyLog); err == nil {
		t.Error("Validation should fail for empty student_id/journal, but it succeeded")
	}
}

// TestJournalRoutesIntegration tests the complete API sequence (create, parse, encrypt, retrieve, decrypt).
func TestJournalRoutesIntegration(t *testing.T) {
	r := gin.Default()
	r.POST("/api/journal", CreateJournalEntryHandler)
	r.GET("/api/journal/:student_id", GetJournalEntriesHandler)

	studentID := "test_student_999"

	// 1. Test POST /api/journal (Create and Analyze Entry)
	reqPayload := map[string]string{
		"student_id":        studentID,
		"exam_target":       "UPSC",
		"journal_entry_raw": "The syllabus backlog is massive. I am studying for 14 hours and feeling very tired and hopeless about clearing the UPSC exam.",
	}
	body, _ := json.Marshal(reqPayload)
	req, _ := http.NewRequest(http.MethodPost, "/api/journal", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response models.StudentWellnessLog
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response JSON: %v", err)
	}

	// Verify structural data mapping compliance (FR-1.3, FR-2.1)
	if response.StudentID != studentID {
		t.Errorf("Expected student_id '%s', got '%s'", studentID, response.StudentID)
	}
	if response.BurnoutRiskIndex <= 0.20 {
		t.Errorf("Expected high burnout risk index, got %f", response.BurnoutRiskIndex)
	}
	if len(response.HiddenStressTriggers) == 0 {
		t.Errorf("Expected stress triggers to be identified, got empty list")
	}

	// Check specific NLP extracted trigger
	foundBacklogTrigger := false
	for _, trigger := range response.HiddenStressTriggers {
		if trigger == "Syllabus Backlog Panic" || trigger == "Sleep Deprivation" {
			foundBacklogTrigger = true
		}
	}
	if !foundBacklogTrigger {
		t.Errorf("Expected 'Syllabus Backlog Panic' or 'Sleep Deprivation' in triggers, got: %v", response.HiddenStressTriggers)
	}

	// 2. Test GET /api/journal/:student_id (Retrieve and Decrypt)
	reqGet, _ := http.NewRequest(http.MethodGet, "/api/journal/"+studentID, nil)
	wGet := httptest.NewRecorder()

	r.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d. Body: %s", wGet.Code, wGet.Body.String())
	}

	var logs []models.StudentWellnessLog
	if err := json.Unmarshal(wGet.Body.Bytes(), &logs); err != nil {
		t.Fatalf("Failed to parse logs JSON list: %v", err)
	}

	if len(logs) == 0 {
		t.Fatalf("Expected at least 1 log returned, got 0")
	}

	retrievedLog := logs[0]
	// Verify data decrypted successfully
	if retrievedLog.JournalEntryRaw != reqPayload["journal_entry_raw"] {
		t.Errorf("Expected decrypted journal raw to match original, got '%s'", retrievedLog.JournalEntryRaw)
	}
	if retrievedLog.BurnoutRiskIndex != response.BurnoutRiskIndex {
		t.Errorf("Expected burnout risk index to match, got %f vs %f", retrievedLog.BurnoutRiskIndex, response.BurnoutRiskIndex)
	}
}
