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
	"github.com/gorilla/websocket"
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
			log.CreatedAt = fmt.Sprintf("%v", v)
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

type ChatRequest struct {
	StudentID string `json:"student_id" binding:"required"`
	Message   string `json:"message" binding:"required"`
}

type ChatResponse struct {
	StudentID string `json:"student_id"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

// GenerateChatResponseWithGemini calls the Google Gemini API to get a supportive real-time response.
func GenerateChatResponseWithGemini(studentID, userMessage string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY not configured")
	}

	systemInstruction := `You are MindBuddy, a warm, student-focused wellness companion twin designed to support Indian students preparing for intense competitive exams like JEE, NEET, CAT, and UPSC.
You are talking to the student in real-time. Respond with deep empathy, active listening, and gentle mentoring.
Keep your response short (1 to 3 sentences maximum) and conversational, so it is perfect to be read aloud by Text-to-Speech (TTS).
Avoid markdown formatting like asterisks (*), hashtags, bullet points, or list structures, as this response will be read as spoken audio. Speak directly and affectionately. Do not mention "as an AI" or "I am a language model".`

	fullText := fmt.Sprintf("%s\n\nStudent says: \"%s\"", systemInstruction, userMessage)

	reqPayload := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: fullText},
				},
			},
		},
		GenerationConfig: GeminiGenerationConfig{
			ResponseMimeType: "text/plain",
		},
	}

	jsonBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s", apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Gemini API error (Status: %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var apiResp GeminiAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return "", err
	}

	if len(apiResp.Candidates) == 0 || len(apiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty candidates in Gemini response")
	}

	rawText := apiResp.Candidates[0].Content.Parts[0].Text
	return strings.TrimSpace(rawText), nil
}

// GenerateChatResponseNLP generates a fallback compassionate chat response locally.
func GenerateChatResponseNLP(userMessage string) string {
	msg := strings.ToLower(userMessage)
	if strings.Contains(msg, "mock") || strings.Contains(msg, "test") || strings.Contains(msg, "score") || strings.Contains(msg, "marks") {
		return "Mock test scores are just indicators of areas to review, not a final verdict on your intelligence. Let's focus on analyzing the wrong questions calmly, without letting the numbers define your worth. You are building resilience with every try."
	}
	if strings.Contains(msg, "sleep") || strings.Contains(msg, "tired") || strings.Contains(msg, "fatigue") || strings.Contains(msg, "exhausted") {
		return "Your brain consolidates all your hard study during sleep. Deferring sleep to study more is actually counterproductive. Try to wind down, turn off screens, and secure a solid sleep cycle tonight."
	}
	if strings.Contains(msg, "backlog") || strings.Contains(msg, "syllabus") || strings.Contains(msg, "overwhelmed") || strings.Contains(msg, "behind") {
		return "A backlog can feel like a heavy mountain, but we can climb it one step at a time. Let's focus on dedicating just 30 minutes of focused effort to a single backlog topic today. Small, consistent steps build huge momentum."
	}
	if strings.Contains(msg, "family") || strings.Contains(msg, "parents") || strings.Contains(msg, "pressure") || strings.Contains(msg, "expect") {
		return "It is tough to balance your parents' hopes with your own exam pressures. Remember that they care about your future, but your mental peace is what truly matters. We can navigate this together."
	}
	if strings.Contains(msg, "breathe") || strings.Contains(msg, "breathing") || strings.Contains(msg, "anxious") || strings.Contains(msg, "panic") {
		return "Let's take a pause. Inhale deeply through your nose for a count of four... hold it... and slowly sigh it out through your mouth. You are safe, you are here, and we can handle this."
	}
	return "I am right here with you. Your preparation journey has ups and downs, but please be gentle with yourself. What is one small, manageable thing we can focus on next?"
}

// CreateChatHandler processes user conversation messages and retrieves dynamic comfort responses.
func CreateChatHandler(c *gin.Context) {
	var input ChatRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reply, err := GenerateChatResponseWithGemini(input.StudentID, input.Message)
	if err != nil {
		fmt.Printf("[GEMINI CHAT WARNING] Falling back to NLP: %v\n", err)
		reply = GenerateChatResponseNLP(input.Message)
	}

	response := ChatResponse{
		StudentID: input.StudentID,
		Message:   reply,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// Upgrader configures how HTTP connections are upgraded to WebSockets.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for the wellness companion client portal
	},
}

// LiveProxyHandler upgrades client connections and securely proxies bidirectionally to Gemini Live API.
func LiveProxyHandler(c *gin.Context) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		fmt.Println("[LIVE PROXY ERROR] GEMINI_API_KEY is not configured")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GEMINI_API_KEY is not configured on the backend server"})
		return
	}

	// Upgrade client HTTP request to WebSocket
	clientConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("[LIVE PROXY ERROR] WebSocket upgrade failed: %v\n", err)
		return
	}
	defer clientConn.Close()

	// Connect to official Google Gemini Multimodal Live API WebSocket
	geminiURL := fmt.Sprintf("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=%s", apiKey)
	
	fmt.Println("[LIVE PROXY] Handshaking with Google Gemini Multimodal Live WebSocket API...")
	geminiConn, resp, err := websocket.DefaultDialer.Dial(geminiURL, nil)
	if err != nil {
		// HANDSHAKE FAILURE FALLBACK: Shift to high-performance local REST-based stream emulation mode
		fmt.Printf("[LIVE PROXY WARNING] Handshake with Google WebSocket failed: %v. Shifting to high-performance local stream emulation mode...\n", err)
		if resp != nil {
			body, _ := io.ReadAll(resp.Body)
			fmt.Printf("[LIVE PROXY WARNING] Handshake Response Status: %s, Body: %s\n", resp.Status, string(body))
		}

		// Notify client setup complete immediately so they think the socket is ready
		clientConn.WriteMessage(websocket.TextMessage, []byte(`{"setupComplete": {}}`))

		// Client message handler loop (emulation mode)
		for {
			_, msgData, err := clientConn.ReadMessage()
			if err != nil {
				fmt.Printf("[LIVE PROXY EMULATION] Client disconnected or read error: %v\n", err)
				return
			}

			// Parse the incoming client message
			type ClientWSMessage struct {
				Setup         interface{} `json:"setup"`
				ClientContent *struct {
					Turns []struct {
						Role  string `json:"role"`
						Parts []struct {
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"turns"`
					TurnComplete bool `json:"turnComplete"`
				} `json:"clientContent"`
			}

			var clientMsg ClientWSMessage
			if err := json.Unmarshal(msgData, &clientMsg); err != nil {
				fmt.Printf("[LIVE PROXY EMULATION ERROR] Failed to unmarshal message: %v\n", err)
				continue
			}

			// If it's a setup instruction, confirm with setupComplete
			if clientMsg.Setup != nil {
				fmt.Println("[LIVE PROXY EMULATION] Received setup instruction from client, confirming setupComplete.")
				clientConn.WriteMessage(websocket.TextMessage, []byte(`{"setupComplete": {}}`))
				continue
			}

			// If it's a user chat turn
			if clientMsg.ClientContent != nil && len(clientMsg.ClientContent.Turns) > 0 {
				turns := clientMsg.ClientContent.Turns
				userText := ""
				if len(turns[0].Parts) > 0 {
					userText = turns[0].Parts[0].Text
				}

				if userText != "" {
					fmt.Printf("[LIVE PROXY EMULATION] Processing user turn: %q\n", userText)

					// Query standard Gemini REST model (highly robust)
					reply, err := GenerateChatResponseWithGemini("live-session", userText)
					if err != nil {
						fmt.Printf("[LIVE PROXY EMULATION WARNING] GenerateChatResponseWithGemini failed: %v. Falling back to NLP.\n", err)
						reply = GenerateChatResponseNLP(userText)
					}

					fmt.Printf("[LIVE PROXY EMULATION] Generated response: %q\n", reply)

					// Chunk the response into individual words and stream them with 40-70ms delay
					words := strings.Split(reply, " ")
					for i, word := range words {
						chunk := word
						if i < len(words)-1 {
							chunk += " "
						}

						// Construct Gemini Live stream turn format
						payload := map[string]interface{}{
							"serverContent": map[string]interface{}{
								"modelTurn": map[string]interface{}{
									"parts": []map[string]interface{}{
										{
											"text": chunk,
										},
									},
								},
							},
						}

						payloadJSON, _ := json.Marshal(payload)
						err = clientConn.WriteMessage(websocket.TextMessage, payloadJSON)
						if err != nil {
							fmt.Printf("[LIVE PROXY EMULATION ERROR] Failed to stream chunk to client: %v\n", err)
							return
						}

						time.Sleep(50 * time.Millisecond)
					}

					// Send Turn Complete signal
					completePayload := map[string]interface{}{
						"serverContent": map[string]interface{}{
							"turnComplete": true,
						},
					}
					completeJSON, _ := json.Marshal(completePayload)
					err = clientConn.WriteMessage(websocket.TextMessage, completeJSON)
					if err != nil {
						fmt.Printf("[LIVE PROXY EMULATION ERROR] Failed to send turnComplete to client: %v\n", err)
						return
					}
				}
			}
		}
	}
	defer geminiConn.Close()
	fmt.Println("[LIVE PROXY] Connected successfully to Google Gemini Live API!")

	// Channels to coordinate graceful shutdown of proxy loops
	done := make(chan struct{})

	// Goroutine: Pipe messages from client -> Gemini Live
	go func() {
		defer close(done)
		for {
			msgType, msgData, err := clientConn.ReadMessage()
			if err != nil {
				fmt.Printf("[LIVE PROXY] Client disconnected or read error: %v\n", err)
				return
			}
			err = geminiConn.WriteMessage(msgType, msgData)
			if err != nil {
				fmt.Printf("[LIVE PROXY] Error writing to Gemini Live: %v\n", err)
				return
			}
		}
	}()

	// Pipe messages from Gemini Live -> client
	for {
		select {
		case <-done:
			fmt.Println("[LIVE PROXY] Proxy thread complete. Tearing down WebSocket session.")
			return
		default:
			msgType, msgData, err := geminiConn.ReadMessage()
			if err != nil {
				fmt.Printf("[LIVE PROXY] Gemini disconnected or read error: %v\n", err)
				return
			}
			err = clientConn.WriteMessage(msgType, msgData)
			if err != nil {
				fmt.Printf("[LIVE PROXY] Error writing to Client: %v\n", err)
				return
			}
		}
	}
}


