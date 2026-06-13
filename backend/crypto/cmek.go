package crypto

import (
	"crypto/rand"
	"fmt"
	"io"
	"sync"
	"time"
)

// CMEKManager manages the simulated Google Cloud KMS and local key rotation.
type CMEKManager struct {
	mu             sync.RWMutex
	keys           map[string][]byte // map of key version -> 32-byte key
	activeVersion  string
	keyCreatedAt   time.Time
	rotationPeriod time.Duration // Custom rotation period for simulation
	gcpKMSEnabled  bool          // Simulate GCP KMS integration
}

var (
	globalCMEK *CMEKManager
	once       sync.Once
)

// GetCMEKManager returns the singleton instance of CMEKManager.
func GetCMEKManager() *CMEKManager {
	once.Do(func() {
		globalCMEK = NewCMEKManager(90 * 24 * time.Hour) // Default 90 days
	})
	return globalCMEK
}

// NewCMEKManager creates a new instance of CMEKManager with a specified rotation period.
func NewCMEKManager(rotationPeriod time.Duration) *CMEKManager {
	mgr := &CMEKManager{
		keys:           make(map[string][]byte),
		rotationPeriod: rotationPeriod,
		gcpKMSEnabled:  true,
	}
	mgr.rotateKey()
	return mgr
}

// rotateKey generates a new key version and sets it as active.
func (m *CMEKManager) rotateKey() string {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		panic(fmt.Sprintf("failed to generate secure key for CMEK: %v", err))
	}
	
	newVersion := fmt.Sprintf("v%d", len(m.keys)+1)
	m.keys[newVersion] = key
	m.activeVersion = newVersion
	m.keyCreatedAt = time.Now()
	
	return newVersion
}

// SetRotationPeriod sets a custom rotation period for testing.
func (m *CMEKManager) SetRotationPeriod(period time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.rotationPeriod = period
}

// ForceRotation triggers an immediate key rotation.
func (m *CMEKManager) ForceRotation() string {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.rotateKey()
}

// SimulateGCPKMSEncrypt simulates wrapping a key via Google Cloud KMS.
func (m *CMEKManager) SimulateGCPKMSEncrypt(key []byte) ([]byte, error) {
	if !m.gcpKMSEnabled {
		return nil, fmt.Errorf("GCP KMS is not enabled/connected")
	}
	wrappedKey := append([]byte("gcp-kms-wrapped:"), key...)
	return wrappedKey, nil
}

// SimulateGCPKMSDecrypt simulates unwrapping a key via Google Cloud KMS.
func (m *CMEKManager) SimulateGCPKMSDecrypt(wrappedKey []byte) ([]byte, error) {
	if !m.gcpKMSEnabled {
		return nil, fmt.Errorf("GCP KMS is not enabled/connected")
	}
	prefix := []byte("gcp-kms-wrapped:")
	if len(wrappedKey) < len(prefix) {
		return nil, fmt.Errorf("invalid wrapped key structure")
	}
	return wrappedKey[len(prefix):], nil
}

// GetActiveKey returns the active key, auto-rotating if the rotation period has elapsed.
func (m *CMEKManager) GetActiveKey() ([]byte, string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if time.Since(m.keyCreatedAt) >= m.rotationPeriod {
		version := m.rotateKey()
		fmt.Printf("[CMEK INFO] 90-day rotation period elapsed. Auto-rotated to key version: %s\n", version)
	}

	return m.keys[m.activeVersion], m.activeVersion
}

// GetKeyByVersion returns a specific version of the key for decryption.
func (m *CMEKManager) GetKeyByVersion(version string) ([]byte, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	key, exists := m.keys[version]
	if !exists {
		return nil, fmt.Errorf("key version '%s' not found", version)
	}
	return key, nil
}

// EncryptWithCMEK encrypts plaintext using the active CMEK key and prefixes it with the version.
// Format: version:ciphertext_base64
func (m *CMEKManager) EncryptWithCMEK(plaintext []byte) (string, error) {
	key, version := m.GetActiveKey()
	
	ciphertext, err := Encrypt(plaintext, key)
	if err != nil {
		return "", err
	}
	
	return fmt.Sprintf("%s:%s", version, ciphertext), nil
}

// DecryptWithCMEK decrypts a version-prefixed ciphertext string.
func (m *CMEKManager) DecryptWithCMEK(encryptedStr string) ([]byte, error) {
	var version, ciphertext string
	
	var parts []string
	for i := 0; i < len(encryptedStr); i++ {
		if encryptedStr[i] == ':' {
			parts = []string{encryptedStr[:i], encryptedStr[i+1:]}
			break
		}
	}
	
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid encrypted payload format: must be 'version:ciphertext'")
	}
	
	version = parts[0]
	ciphertext = parts[1]
	
	key, err := m.GetKeyByVersion(version)
	if err != nil {
		return nil, err
	}
	
	return Decrypt(ciphertext, key)
}
