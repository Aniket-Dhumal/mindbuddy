package models

import "fmt"

type ExamTarget string

const (
	JEEAdvanced ExamTarget = "JEE_ADVANCED"
	NEETUG      ExamTarget = "NEET_UG"
	CAT         ExamTarget = "CAT"
	UPSC        ExamTarget = "UPSC"
)

func (e ExamTarget) IsValid() bool {
	switch e {
	case JEEAdvanced, NEETUG, CAT, UPSC:
		return true
	}
	return false
}

type StudentWellnessLog struct {
	ID                          int64    `json:"id"`
	StudentID                   string   `json:"student_id" binding:"required"`
	ExamTarget                  string   `json:"exam_target" binding:"required"` // Must be JEE_ADVANCED, NEET_UG, CAT, or UPSC
	JournalEntryRaw             string   `json:"journal_entry_raw" binding:"required"`
	HiddenStressTriggers        []string `json:"hidden_stress_triggers"`
	BurnoutRiskIndex            float64  `json:"burnout_risk_index"`
	CopingStrategyPayload       string   `json:"coping_strategy_payload"`
	MindfulnessExerciseAssigned string   `json:"mindfulness_exercise_assigned"`
	CreatedAt                   string   `json:"created_at"`
}

func ValidateWellnessLog(log *StudentWellnessLog) error {
	if log.StudentID == "" {
		return fmt.Errorf("student_id is required")
	}
	if !ExamTarget(log.ExamTarget).IsValid() {
		return fmt.Errorf("invalid exam_target: '%s'. Must be one of JEE_ADVANCED, NEET_UG, CAT, UPSC", log.ExamTarget)
	}
	if log.JournalEntryRaw == "" {
		return fmt.Errorf("journal_entry_raw is required")
	}
	return nil
}
