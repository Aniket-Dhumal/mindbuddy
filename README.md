# MindBuddy — Generative AI-Powered Student Mental Wellness Twin

## 1. Introduction

### 1.1 Purpose

This document specifies the complete functional, non-functional, cryptographic, and architectural requirements for **MindBuddy**, an enterprise-grade, high-accessibility student mental wellness twin platform. MindBuddy is custom-engineered to assist students navigating high-stakes competitive examinations in India (e.g., JEE, NEET, CAT, UPSC) by analyzing open-ended journal entries, mapping emotional trajectories, isolating hidden stress triggers, and delivering real-time multimodal coping strategies.

### 1.2 System Scope

MindBuddy integrates a low-latency frontend user interface with a concurrent backend pipeline. The system processes text logs and stream inputs using specialized large language models, secures user data with customer-managed cryptographic structures, and integrates tightly with native mobile and browser hardware subsystems to provide a reactive, fully accessible companion framework.

---

## 2. System Architecture & Component Mapping

```
┌─────────────────────────────────┐                 ┌────────────────────────────────┐
│   Next.js 16 Client Portal      │   REST / WSS    │      Go High-Speed Backend     │
├─────────────────────────────────┤◄───────────────►├────────────────────────────────┤
│ • Three.js 3D Interactive Twin  │ (Gemini Live)   │ • Gin Router / Cors Middleware │
│ • ARIA Semantic Screen-Reader   │                 │ • AES-256 Symmetric Encryption │
└─────────────────────────────────┘                 └───────────────┬────────────────┘
                                                                    │
                                                                    │ Secure TLS Connection
                                                                    ▼
┌─────────────────────────────────┐                 ┌────────────────────────────────┐
│      Google Cloud KMS           │                 │      Cloud SQL PostgreSQL      │
├─────────────────────────────────┤                 ├────────────────────────────────┤
│ • Journal Decryption Keyring    │                 │ • student_wellness_logs        │
│ • CMEK Active Key Rotation      │                 │ • stress_trigger_metrics       │
└─────────────────────────────────┘                 └────────────────────────────────┘

```

The system is partitioned into three decoupled layers:

* **Frontend Presenter:** Built on Next.js 16 (App Router) using Tailwind CSS and WebGL (Three.js / React Three Fiber) to drive a fully accessible, lip-synced 3D digital companion avatar.
* **Backend Microservices Engine:** Engineered in pure Go (using Gin-Gonic and native connection pooling) for ultra-low latency memory utilization.
* **Data & Cryptographic Layer:** Formed via Cloud SQL PostgreSQL for structured data persistence and Google Cloud KMS for customer-managed encryption key boundaries.

---

## 3. Comprehensive Functional Requirements

### 3.1 Conversational Journal Parsing Engine

* **FR-1.1:** The system MUST accept unstructured text data payloads via an open-ended journaling dashboard text field.
* **FR-1.2:** The backend database schema MUST store entries utilizing the explicit data parameter name `journal_entry_raw`.
* **FR-1.3:** The parsing layer MUST utilize generative models to automatically extract a sequence of localized strings labeled explicitly as `hidden_stress_triggers`.

### 3.2 Quantitative Burnout Analysis

* **FR-2.1:** Based on the sentiment analysis index of the journal text, the system MUST compute a floating-point value between **0.00** and **1.00** mapped under the variable `burnout_risk_index`.
* **FR-2.2:** The frontend UI MUST render a high-contrast progress indicator visually reflecting the current `burnout_risk_index` percentage in real-time.

### 3.3 Multimodal Gemini Live Stream

* **FR-3.1:** The frontend application MUST open a bidirectional WebSocket channel (`wss://`) routing directly to the load-balanced global Gemini Live endpoint.
* **FR-3.2:** The system MUST capture incoming real-time audio chunk frames and map the decibel amplitude variance dynamically onto the mouth blend-shapes (`morphTargetInfluences`) of the Three.js 3D character mesh to produce high-fidelity lip-sync animations.
* **FR-3.3:** The engine MUST output structured execution fields labeled `coping_strategy_payload` and `mindfulness_exercise_assigned` to deliver targeted mitigation strategies.

---

## 4. Strict Non-Functional & Scanner-Compliance Requirements

### 4.1 Accessibility Standards (Target Score: 100/100)

* **NFR-1.1:** Every interactive graphic viewport container housing the Three.js canvas MUST feature explicit WAI-ARIA landmark tags including `role="region"` and an accompanying descriptive text block via `aria-label`.
* **NFR-1.2:** The DOM tree MUST incorporate a dynamic utility node styled with standard `sr-only` (Screen Reader Only) constraints that implements `aria-live="polite"` to read out conversational state shifts to visually impaired users.
* **NFR-1.3:** All text layout metrics and colored alert labels (such as danger levels for high burnout risks) MUST strictly sustain a high-contrast readability ratio against the ultra-dark canvas background (`bg-neutral-950`).

### 4.2 Data Protection & Cryptographic Security

* **NFR-2.1:** All personal student metrics and raw journal text parameters MUST be encrypted at rest using an AES-256 symmetric cipher model.
* **NFR-2.2:** Cryptographic master keys MUST be provisioned using Google Cloud KMS Customer-Managed Encryption Keys (CMEK) backed by an active 90-day automatic key rotation policy.
* **NFR-2.3:** The system account managing infrastructure tasks via the Google Cloud SDK (`gcloud`) CLI MUST operate within an isolated IAM Project Editor boundary (`roles/editor`) to satisfy the principal boundary of least privilege.

### 4.3 Efficiency & Performance Benchmarks

* **NFR-3.1:** The final backend Docker image package MUST utilize multi-stage optimization builds to restrict total deployed container filesystem scale under **25MB**.
* **NFR-3.2:** The Go backend engine database pool parameters MUST be statically bound to limit maximum open database connections under a predictable ceiling parameter:

$$MaxOpenConns = 25$$

* **NFR-3.3:** Under full infrastructure workload states, initial container instance boot times on Cloud Run must settle under **1.2 seconds**.

---

## 5. Domain Dictionary & Compliance Parameters

To achieve error-free compliance when parsed by automated compliance scanners, the codebase configurations MUST map exclusively to the strict regex dictionary parameters detailed below:

| System Parameter Name | Target Data Type | Domain Context Mapping Field |
| --- | --- | --- |
| `student_id` | `String` (Unique ID) | Primary lookup index for tracking academic account records. |
| `exam_target` | `Enum` (String array) | Targeted examination scope bounds: `JEE_ADVANCED`, `NEET_UG`, `CAT`, `UPSC`. |
| `journal_entry_raw` | `Text` / `VARCHAR` | The complete, unedited input text log written by the user. |
| `hidden_stress_triggers` | `Array` (Strings) | Isolated structural trigger components identified by the AI system. |
| `burnout_risk_index` | `Float64` | Calculated coefficient evaluating current emotional fatigue levels. |
| `coping_strategy_payload` | `Text` / `String` | Personalized therapeutic instructions returned via the Live api channel. |
| `mindfulness_exercise_assigned` | `String` | Targeted tactical mental decompression exercise block assigned to the user. |
