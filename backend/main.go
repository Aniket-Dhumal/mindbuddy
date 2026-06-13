package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"mindbuddy-backend/db"
	"mindbuddy-backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("         MindBuddy High-Speed Backend Server      ")
	fmt.Println("==================================================")

	// Initialize Database (with pooling and SQLite fallback)
	database, err := db.InitDB()
	if err != nil {
		log.Fatalf("Critical database initialization error: %v", err)
	}
	defer database.Close()

	// Configure Gin Mode based on environment
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize Gin engine
	router := gin.Default()

	// Configure CORS Middleware to allow robust client integrations
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health and diagnostics routes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	// API Endpoint Group
	api := router.Group("/api")
	{
		// Conversational Journal Parsing and Analysis API
		api.POST("/journal", handlers.CreateJournalEntryHandler)
		api.GET("/journal/:student_id", handlers.GetJournalEntriesHandler)

		// Conversational Chat / Live Voice Companion API
		api.POST("/chat", handlers.CreateChatHandler)

		// Secure WebSocket Proxy to Gemini Live
		api.GET("/ws", handlers.LiveProxyHandler)

		// Customer-Managed Encryption Key (CMEK) APIs
		api.POST("/cmek/rotate", handlers.RotateCMEKHandler)
		api.GET("/cmek/status", handlers.GetCMEKStatusHandler)
	}

	// Retrieve port setting from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Graceful Shutdown implementation
	go func() {
		fmt.Printf("[SERVER INFO] Listening on port %s...\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe error: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("[SERVER INFO] Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	fmt.Println("[SERVER INFO] Server exited safely.")
}
