# Step 1: Build the statically linked Go binary
FROM golang:1.21-alpine AS builder

# Install system CA certificates and tzdata
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy dependency manifests
COPY go.mod go.sum ./

# Fetch dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the statically linked Go binary
# CGO_ENABLED=0 disables C library links
# -ldflags="-s -w" strips debug info and symbols for maximum size reduction
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a \
    -installsuffix cgo \
    -ldflags="-s -w" \
    -o mindbuddy-server .

# Step 2: Build the final clean, minimal execution container
FROM scratch

# Copy SSL certificates and timezone databases from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy statically linked binary
COPY --from=builder /app/mindbuddy-server /mindbuddy-server

# Expose default listener port
EXPOSE 8080

# Set release environment configurations
ENV GIN_MODE=release
ENV PORT=8080

# Execute compiled server binary
ENTRYPOINT ["/mindbuddy-server"]
