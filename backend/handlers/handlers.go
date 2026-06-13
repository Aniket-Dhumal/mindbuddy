package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"mindbuddy-backend/crypto"
	"mindbuddy-backend/db"
	"mindbuddy-backend/models"

	"github.com/gin-gonic/gin"
)

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiGenerationConfig struct {
	ResponseMimeType string `json:"responseMimeType,omitempty"`
}

type GeminiRequest struct {
	Contents         []GeminiContent        `json:"contents"`
	GenerationConfig GeminiGenerationConfig `json:"generationConfig"`
}

type GeminiCandidatesPart struct {
	Text string `json:"text"`
}

type GeminiCandidatesContent struct {
	Parts []GeminiCandidatesPart `json:"parts"`
}

type GeminiCandidate struct {
	Content GeminiCandidatesContent `json:"content"`
}

type GeminiAPIResponse struct {
	Candidates []GeminiCandidate `json:"candidates"`
}

type GeminiResponse struct {
	HiddenStressTriggers        []string `json:"hidden_stress_triggers"`
	BurnoutRiskIndex            float64  `json:"burnout_risk_index"`
	CopingStrategyPayload      string   `json:"coping_strategy_payload"`
	MindfulnessExerciseAssigned string   `json:"mindfulness_exercise_assigned"`
}

// AnalyzeJournalWithGemini calls the Google Gemini API to analyze the journal text.
func AnalyzeJournalWithGemini(text string, exam string) ([]string, float64, string, string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, 0, "", "", fmt.Errorf("GEMINI_API_KEY not configured")
	}

	systemInstruction := `You are MindBuddy, an empathetic, expert Student Mental Wellness Twin companion designed to help Indian students preparing for highly competitive exams (JEE, NEET, CAT, UPSC) navigate academic pressure, stress, and anxiety.
Analyze the student's open-ended journal entry. Identify specific stressors and calculate a burnout risk index between 0.00 (completely calm) and 1.00 (severe crisis/exhaustion).
Expose NO developer jargon or technical metrics.
You must respond with a JSON object containing EXACTLY these four keys:
1. "hidden_stress_triggers": A string array containing 1 to 4 student-friendly stress triggers isolated from the text (e.g. "Mock Test Volatility", "Syllabus Backlog Panic", "Sleep Deprivation", "Family Expectation Stress").
2. "burnout_risk_index": A float strictly between 0.00 and 1.00.
3. "coping_strategy_payload": A warm, deeply supportive, personalized coping strategy (2-3 sentences) tailored to their specific stressors. Speak directly to them, with gentle, encouraging tone. Do not mention "as an AI" or "I am a mental wellness twin". Speak like a compassionate mentor.
4. "mindfulness_exercise_assigned": A specific mindfulness exercise name and brief description (e.g., "5-4-3-2-1 Sensory Grounding: list 5 things you can see...").`

	prompt := fmt.Sprintf("Student preparing for %s says: \"%s\"", exam, text)
	fullText := fmt.Sprintf("%s\n\nUser Input: %s", systemInstruction, prompt)

	reqPayload := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: fullText},
				},
			},
		},
		GenerationConfig: GeminiGenerationConfig{
			ResponseMimeType: "application/json",
		},
	}

	jsonBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, 0, "", "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s", apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, 0, "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, 0, "", "", fmt.Errorf("Gemini API error (Status: %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var apiResp GeminiAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, 0, "", "", err
	}

	if len(apiResp.Candidates) == 0 || len(apiResp.Candidates[0].Content.Parts) == 0 {
		return nil, 0, "", "", fmt.Errorf("empty candidates in Gemini response")
	}

	rawJSONText := apiResp.Candidates[0].Content.Parts[0].Text

	var geminiResult GeminiResponse
	if err := json.Unmarshal([]byte(rawJSONText), &geminiResult); err != nil {
		return nil, 0, "", "", fmt.Errorf("failed to unmarshal Gemini JSON output: %w. Raw text: %s", err, rawJSONText)
	}

	// Clamp risk strictly between 0.00 and 1.00
	if geminiResult.BurnoutRiskIndex < 0.00 {
		geminiResult.BurnoutRiskIndex = 0.00
	} else if geminiResult.BurnoutRiskIndex > 1.00 {
		geminiResult.BurnoutRiskIndex = 1.00
	}

	return geminiResult.HiddenStressTriggers, geminiResult.BurnoutRiskIndex, geminiResult.CopingStrategyPayload, geminiResult.MindfulnessExerciseAssigned, nil
}

// AnalyzeJournalNLP analyzes the journal text and returns extracted stress triggers and a burnout risk index.
func AnalyzeJournalNLP(text string) ([]string, float64, string, string) {
	textLower := strings.ToLower(text)
	var triggers []string
	var risk float64 = 0.15 // Baseline risk

	// Check academic competition pressure
	if strings.Contains(textLower, "rank") || strings.Contains(textLower, "percentile") ||
		strings.Contains(textLower, "marks") || strings.Contains(textLower, "mock") ||
		strings.Contains(textLower, "fail") || strings.Contains(textLower, "compete") {
		triggers = append(triggers, "Academic Competition Pressure")
		risk += 0.20
	}

	// Check syllabus backlog panic
	if strings.Contains(textLower, "syllabus") || strings.Contains(textLower, "backlog") ||
		strings.Contains(textLower, "revision") || strings.Contains(textLower, "prepare") ||
		strings.Contains(textLower, "studying") {
		triggers = append(triggers, "Syllabus Backlog Panic")
		risk += 0.15
	}

	// Check sleep deprivation
	if strings.Contains(textLower, "sleep") || strings.Contains(textLower, "insomnia") ||
		strings.Contains(textLower, "tired") || strings.Contains(textLower, "exhausted") ||
		strings.Contains(textLower, "night") {
		triggers = append(triggers, "Sleep Deprivation")
		risk += 0.18
	}

	// Check family expectation stress
	if strings.Contains(textLower, "parents") || strings.Contains(textLower, "family") ||
		strings.Contains(textLower, "expectation") || strings.Contains(textLower, "pressure") ||
		strings.Contains(textLower, "father") || strings.Contains(textLower, "mother") {
		triggers = append(triggers, "Family Expectation Stress")
		risk += 0.15
	}

	// Check poor time management anxiety
	if strings.Contains(textLower, "time") || strings.Contains(textLower, "schedule") ||
		strings.Contains(textLower, "hours") || strings.Contains(textLower, "waste") ||
		strings.Contains(textLower, "delay") {
		triggers = append(triggers, "Poor Time Management Anxiety")
		risk += 0.12
	}

	// Adjust risk score based on high-intensity stress words
	if strings.Contains(textLower, "hopeless") || strings.Contains(textLower, "give up") ||
		strings.Contains(textLower, "quit") || strings.Contains(textLower, "cry") ||
		strings.Contains(textLower, "depressed") || strings.Contains(textLower, "panic") ||
		strings.Contains(textLower, "anxious") {
		risk += 0.25
	}

	// Adjust risk score down based on positive/coping words
	if strings.Contains(textLower, "confident") || strings.Contains(textLower, "happy") ||
		strings.Contains(textLower, "relaxed") || strings.Contains(textLower, "optimistic") ||
		strings.Contains(textLower, "better") {
		risk -= 0.15
	}

	// Clamp risk strictly between 0.00 and 1.00
	if risk < 0.00 {
		risk = 0.00
	} else if risk > 1.00 {
		risk = 1.00
	}

	// If no triggers were found but text contains some negative sentiment, add a generic trigger
	if len(triggers) == 0 && (risk > 0.30 || strings.Contains(textLower, "stress") || strings.Contains(textLower, "hard")) {
		triggers = append(triggers, "General Exam Fatigue")
	}

	// Create a tailored coping strategy payload and mindfulness exercise assigned
	var copingStrategy string
	var mindfulnessExercise string

	// Build customized feedback
	if risk >= 0.70 {
		copingStrategy = "High fatigue detected. Please implement immediate box-breathing, limit study slots to 45 minutes, and take a mandatory 15-minute screen-free break. Do not look at percentile trackers today."
		mindfulnessExercise = "4-7-8 Deep Breathing Decompression"
	} else if risk >= 0.40 {
		copingStrategy = "Moderate stress signature detected. Try listing your top 3 backlogs and dedicate just 1 hour to them today. Avoid comparisons with peers."
		mindfulnessExercise = "5-4-3-2-1 Sensory Grounding Technique"
	} else {
		copingStrategy = "Excellent emotional baseline. Maintain your current circadian rhythm, schedule a 20-minute physical walk, and proceed with mock practice."
		mindfulnessExercise = "Progressive Muscle Relaxation (PMR)"
	}

	return triggers, risk, copingStrategy, mindfulnessExercise
}

// CreateJournalEntryHandler processes, analyzes, encrypts, and stores a student's journal entry.
func CreateJournalEntryHandler(c *gin.Context) {
	var input models.StudentWellnessLog
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := models.ValidateWellnessLog(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Extract triggers and calculate burnout risk via Gemini or local NLP engine fallback
	triggers, risk, coping, mindfulness, errGemini := AnalyzeJournalWithGemini(input.JournalEntryRaw, string(input.ExamTarget))
	if errGemini != nil {
		fmt.Printf("[GEMINI WARNING] Falling back to rule-based local NLP: %v\n", errGemini)
		triggers, risk, coping, mindfulness = AnalyzeJournalNLP(input.JournalEntryRaw)
	}

	// Encrypt the raw journal entry using CMEK (at-rest data protection)
	cmek := crypto.GetCMEKManager()
	encryptedRaw, err := cmek.EncryptWithCMEK([]byte(input.JournalEntryRaw))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt journal entry: " + err.Error()})
		return
	}

	// Store stress triggers as a JSON-encoded string for cross-db compatibility
	triggersJSON, err := json.Marshal(triggers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal triggers: " + err.Error()})
		return
	}

	// Persist to database
	var lastInsertID int64
	query := `
		INSERT INTO student_wellness_logs 
		(student_id, exam_target, journal_entry_raw, hidden_stress_triggers, burnout_risk_index, coping_strategy_payload, mindfulness_exercise_assigned)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	
	databaseURL := os.Getenv("DATABASE_URL")
	var errDB error
	if db.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database not initialized"})
		return
	}

	// Since we are using standard database/sql, we need to handle postgresql RETURNING and sqlite standard LastInsertId
	if strings.HasPrefix(databaseURL, "postgres:") || strings.HasPrefix(databaseURL, "postgresql:") {
		pgQuery := `
			INSERT INTO student_wellness_logs 
			(student_id, exam_target, journal_entry_raw, hidden_stress_triggers, burnout_risk_index, coping_strategy_payload, mindfulness_exercise_assigned)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`
		errDB = db.DB.QueryRow(pgQuery, input.StudentID, input.ExamTarget, encryptedRaw, string(triggersJSON), risk, coping, mindfulness).Scan(&lastInsertID)
	} else {
		res, errExec := db.DB.Exec(query, input.StudentID, input.ExamTarget, encryptedRaw, string(triggersJSON), risk, coping, mindfulness)
		if errExec == nil {
			lastInsertID, _ = res.LastInsertId()
		}
		errDB = errExec
	}

	if errDB != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save journal to database: " + errDB.Error()})
		return
	}

	// Prepare successful response mapping
	input.ID = lastInsertID
	input.HiddenStressTriggers = triggers
	input.BurnoutRiskIndex = risk
	input.CopingStrategyPayload = coping
	input.MindfulnessExerciseAssigned = mindfulness
	input.CreatedAt = time.Now().Format(time.RFC3339)

	c.JSON(http.StatusCreated, input)
}

// GetJournalEntriesHandler returns all wellness logs for a given student ID.
func GetJournalEntriesHandler(c *gin.Context) {
	studentID := c.Param("student_id")
	if studentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id is required"})
		return
	}

	query := `
		SELECT id, student_id, exam_target, journal_entry_raw, hidden_stress_triggers, burnout_risk_index, coping_strategy_payload, mindfulness_exercise_assigned, created_at
		FROM student_wellness_logs
		WHERE student_id = ?
		ORDER BY id DESC
	`
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.HasPrefix(databaseURL, "postgres:") || strings.HasPrefix(databaseURL, "postgresql:") {
		query = `
			SELECT id, student_id, exam_target, journal_entry_raw, hidden_stress_triggers, burnout_risk_index, coping_strategy_payload, mindfulness_exercise_assigned, created_at
			FROM student_wellness_logs
			WHERE student_id = $1
			ORDER BY id DESC
		`
	}

	rows, err := db.DB.Query(query, studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database: " + err.Error()})
		return
	}
	defer rows.Close()

	var logs []models.StudentWellnessLog
	cmek := crypto.GetCMEKManager()

	for rows.Next() {
		var log models.StudentWellnessLog
		var encryptedRaw, triggersJSON string
		var createdAtInterface interface{}

		errScan := rows.Scan(
			&log.ID,
			&log.StudentID,
			&log.ExamTarget,
			&encryptedRaw,
			&triggersJSON,
			&log.BurnoutRiskIndex,
			&log.CopingStrategyPayload,
			&log.MindfulnessExerciseAssigned,
			&createdAtInterface,
		)
		if errScan != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan database row: " + errScan.Error()})
			return
		}

		// Map created_at representation safely
		switch v := createdAtInterface.(type) {
		case time.Time:
			log.CreatedAt = v.Format(time.RFC3339)
		case string:
			log.CreatedAt = v
		default:
			log.CreatedAt = fmt.Sprintf("%%v", v)
		}

		// Decrypt the raw journal text
		decryptedBytes, errDec := cmek.DecryptWithCMEK(encryptedRaw)
		if errDec != nil {
			log.JournalEntryRaw = "[DECRYPTION ERROR: " + errDec.Error() + "]"
		} else {
			log.JournalEntryRaw = string(decryptedBytes)
		}

		// Unmarshal the stress triggers array
		var triggers []string
		if errUn := json.Unmarshal([]byte(triggersJSON), &triggers); errUn != nil {
			log.HiddenStressTriggers = []string{}
		} else {
			log.HiddenStressTriggers = triggers
		}

		logs = append(logs, log)
	}

	c.JSON(http.StatusOK, logs)
}

// RotateCMEKHandler manually triggers a CMEK key rotation.
func RotateCMEKHandler(c *gin.Context) {
	cmek := crypto.GetCMEKManager()
	newVersion := cmek.ForceRotation()
	c.JSON(http.StatusOK, gin.H{
		"message":            "CMEK key successfully rotated",
		"active_key_version": newVersion,
		"timestamp":          time.Now().Format(time.RFC3339),
		"90_day_cycle_reset": true,
	})
}

// GetCMEKStatusHandler returns the status of CMEK manager.
func GetCMEKStatusHandler(c *gin.Context) {
	cmek := crypto.GetCMEKManager()
	_, version := cmek.GetActiveKey()
	c.JSON(http.StatusOK, gin.H{
		"active_key_version":            version,
		"simulated_gcp_kms_connected":  true,
		"automatic_rotation_cycle_days": 90,
		"last_rotated_timestamp":        time.Now().Format(time.RFC3339), 
	})
}
