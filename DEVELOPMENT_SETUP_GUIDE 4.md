# Enterprise Data Intelligence Platform - Development Setup Guide

A comprehensive guide to setting up a modern full-stack application with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Pydantic AI + LLM Integration
- **Infrastructure**: Docker, PostgreSQL, Neo4j

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Project Structure](#project-structure)
4. [Frontend Setup](#frontend-setup)
5. [Backend Setup](#backend-setup)
6. [Environment Variables](#environment-variables)
7. [Docker Configuration](#docker-configuration)
8. [Theme & Layout Components](#theme--layout-components)
9. [Pydantic AI & LLM Integration](#pydantic-ai--llm-integration)
10. [VSCode Configuration](#vscode-configuration)
11. [Running the Application](#running-the-application)
12. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software
```bash
# Node.js (v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python (v3.11+)
sudo apt install python3.11 python3.11-venv python3-pip

# Docker & Docker Compose
sudo apt install docker.io docker-compose-v2
sudo usermod -aG docker $USER

# Git
sudo apt install git
```

### Recommended Tools
- **VSCode** with extensions (see [VSCode Configuration](#vscode-configuration))
- **Postman** or **HTTPie** for API testing
- **DBeaver** for database management

---

## Repository Setup

### Initialize GitHub Repository
```bash
# Create new directory
mkdir my-platform && cd my-platform

# Initialize git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Environment
.env
.env.local
*.pem
*.key
private_key*

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Docker
docker-compose.override.yml

# Testing
coverage/
.pytest_cache/
playwright-report/
EOF

# Initial commit
git add .
git commit -m "Initial commit: project structure"

# Create GitHub repo and push
gh repo create my-platform --public --source=. --remote=origin --push
```

---

## Project Structure

```
my-platform/
├── docker-compose.yml          # Docker orchestration
├── .gitignore
├── README.md
├── DEVELOPMENT_SETUP_GUIDE.md
│
├── backend/                    # FastAPI Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env                    # Backend secrets (git-ignored)
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI app entry
│       ├── config.py           # Pydantic Settings
│       ├── database.py         # SQLAlchemy setup
│       ├── schemas.py          # Pydantic models
│       ├── routers/            # API route modules
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── users.py
│       │   └── ai_chat.py
│       └── services/           # Business logic & LLM
│           ├── __init__.py
│           ├── llm.py          # Pydantic AI agents
│           └── analytics.py
│
├── frontend/                   # React Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env                    # Frontend env vars (git-ignored)
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root component with routing
│       ├── lib/
│       │   └── api.ts          # Axios API client
│       ├── components/
│       │   ├── AppLayout.tsx   # Main layout with sidebar
│       │   ├── PageHeader.tsx  # Unified page headers
│       │   ├── Navbar.tsx      # Top navigation
│       │   └── Toast.tsx       # Notifications
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   └── Settings.tsx
│       ├── hooks/              # Custom React hooks
│       ├── types/              # TypeScript interfaces
│       └── styles/
│           └── globals.css     # Tailwind imports
│
└── storage/                    # Persistent data (git-ignored)
    └── artifacts/
```

---

## Frontend Setup

### 1. Initialize Vite + React + TypeScript

```bash
cd frontend
npm create vite@latest . -- --template react-ts
```

### 2. Install Dependencies

```bash
npm install \
  react-router-dom \
  axios \
  framer-motion \
  lucide-react \
  tailwind-merge \
  clsx \
  react-hot-toast \
  reactflow \
  @monaco-editor/react \
  chart.js react-chartjs-2

npm install -D \
  tailwindcss postcss autoprefixer \
  @types/react @types/react-dom \
  typescript \
  @playwright/test
```

### 3. package.json

```json
{
  "name": "my-platform",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.8",
    "lucide-react": "^0.562.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^6.21.2",
    "reactflow": "^11.10.1",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.42.1",
    "@types/react": "^18.2.50",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0"
  }
}
```

### 4. vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
});
```

### 5. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2021"],
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 6. tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom dark theme palette
        night: "#05030B",
        plum: "#2D0E49",
        iris: "#5B1AE3",
        mint: "#7EF6D5",
        lime: "#C8FF71",
        ember: "#F45B8A"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: "0 0 35px rgba(126, 246, 213, 0.35)"
      },
      animation: {
        "aurora-shimmer": "auroraShimmer 18s ease-in-out infinite",
        "blob-float": "blobFloat 14s ease-in-out infinite",
      },
      keyframes: {
        auroraShimmer: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blobFloat: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },
    }
  },
  plugins: []
};
```

### 7. src/styles/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import Inter font from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* Base styles */
@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  body {
    @apply bg-slate-950 text-white antialiased;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-slate-900/50;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-slate-700 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-slate-600;
  }
}

/* Aurora animation keyframes */
@keyframes auroraShimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes auroraBlob1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.15); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
}

@keyframes auroraBlob2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-40px, 30px) scale(1.1); }
  50% { transform: translate(20px, -20px) scale(0.9); }
  75% { transform: translate(30px, 40px) scale(1.05); }
}
```

### 8. src/lib/api.ts

```typescript
import axios, { AxiosResponse } from "axios";

// Build API base URL: use env port for localhost, otherwise use /api/ prefix
const buildApiBaseUrl = (): string => {
    const { hostname, protocol } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        const port = import.meta.env.VITE_API_PORT || "8000";
        return `${protocol}//${hostname}:${port}`;
    }
    return `${window.location.origin}/api`;
};

export const API_BASE_URL = buildApiBaseUrl();

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API helper functions
export const api = {
    // Health check
    health: () => axiosInstance.get("/health"),
    
    // Auth
    login: (email: string, password: string) => 
        axiosInstance.post("/auth/login", { email, password }),
    
    // AI Chat
    chat: (message: string, context?: object) =>
        axiosInstance.post("/ai/chat", { message, context }),
    
    // Generic CRUD
    get: <T>(url: string): Promise<AxiosResponse<T>> => 
        axiosInstance.get(url),
    post: <T>(url: string, data: object): Promise<AxiosResponse<T>> => 
        axiosInstance.post(url, data),
    put: <T>(url: string, data: object): Promise<AxiosResponse<T>> => 
        axiosInstance.put(url, data),
    delete: <T>(url: string): Promise<AxiosResponse<T>> => 
        axiosInstance.delete(url),
};
```

---

## Backend Setup

### 1. requirements.txt

```txt
fastapi>=0.115.5
uvicorn[standard]>=0.27.1
httpx>=0.27.2
pydantic>=2.10.4
pydantic-settings>=2.1.0
pydantic-ai>=0.1.0
openai>=1.74.0
python-dotenv>=1.0.1
structlog>=24.1.0
sqlalchemy>=2.0.25
psycopg2-binary>=2.9.9
asyncpg>=0.29.0
email-validator>=2.1.0.post1
bcrypt>=4.1.2
python-multipart>=0.0.21
logfire[fastapi]>=2.5.0
```

### 2. app/config.py (Pydantic Settings)

```python
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central FastAPI configuration pulled from environment variables."""

    app_name: str = "My Platform"
    
    # OpenAI / LLM Configuration
    openai_api_key: str
    openai_model: str = "gpt-4o"
    
    # Optional: Pydantic Logfire for observability
    logfire_token: str = ""
    
    # CORS Origins
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
    ]

    # PostgreSQL Configuration
    db_host: str = "localhost"
    db_name: str = "myplatform"
    db_user: str = "postgres"
    db_password: str
    db_port: int = 5432

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### 3. app/main.py (FastAPI Entry)

```python
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, ai_chat

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown events."""
    print("🚀 Starting application...")
    # Initialize database, services, etc.
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}


# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(ai_chat.router, prefix="/ai", tags=["AI Chat"])
```

### 4. app/routers/ai_chat.py

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm import chat_with_ai

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


class ChatResponse(BaseModel):
    response: str
    tokens_used: int | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with AI assistant."""
    try:
        result = await chat_with_ai(request.message, request.context)
        return ChatResponse(response=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 5. app/services/llm.py (Pydantic AI Integration)

```python
from __future__ import annotations

import os
from typing import Any, Dict, Optional

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from app.config import get_settings

settings = get_settings()

# Set OpenAI API key for pydantic_ai
os.environ["OPENAI_API_KEY"] = settings.openai_api_key


# Define response models for structured outputs
class ChatResponse(BaseModel):
    """Structured AI response."""
    content: str
    confidence: float = 1.0
    sources: list[str] = []


# Create the AI agent
chat_agent = Agent(
    model=OpenAIModel(model_name=settings.openai_model),
    system_prompt=(
        "You are a helpful AI assistant for an enterprise data platform. "
        "Provide clear, concise, and accurate responses. "
        "When discussing technical topics, include relevant examples."
    ),
    output_type=ChatResponse,
)


async def chat_with_ai(
    message: str, 
    context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Chat with the AI agent using Pydantic AI.
    
    Args:
        message: User's message
        context: Optional context dictionary
        
    Returns:
        AI response string
    """
    # Build context-aware prompt
    prompt = message
    if context:
        context_str = "\n".join(f"- {k}: {v}" for k, v in context.items())
        prompt = f"Context:\n{context_str}\n\nUser: {message}"
    
    # Run the agent
    result = await chat_agent.run(prompt)
    
    # Return structured response content
    if isinstance(result.data, ChatResponse):
        return result.data.content
    return str(result.data)


# Additional specialized agents
analysis_agent = Agent(
    model=OpenAIModel(model_name=settings.openai_model),
    system_prompt=(
        "You are a data analysis expert. Analyze the provided data "
        "and generate actionable insights with specific recommendations."
    ),
)


async def analyze_data(data: Dict[str, Any]) -> str:
    """Analyze data using AI agent."""
    prompt = f"Analyze this data and provide insights:\n{data}"
    result = await analysis_agent.run(prompt)
    return str(result.data)
```

### 6. Dockerfile (Backend)

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Environment Variables

### backend/.env

```env
# ==============================================
# APPLICATION SETTINGS
# ==============================================
APP_NAME="My Platform"

# ==============================================
# OPENAI / LLM CONFIGURATION
# ==============================================
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o

# ==============================================
# DATABASE CONFIGURATION
# ==============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myplatform
DB_USER=postgres
DB_PASSWORD=your-secure-password

# ==============================================
# OPTIONAL: OBSERVABILITY
# ==============================================
LOGFIRE_TOKEN=

# ==============================================
# OPTIONAL: NEO4J (Knowledge Graph)
# ==============================================
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4jpassword

# ==============================================
# CORS SETTINGS (comma-separated)
# ==============================================
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

### frontend/.env

```env
# API Configuration
VITE_API_PORT=8000

# Optional: Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=false
```

---

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: myplatform-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: myplatform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-secure-password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: myplatform-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      - DB_HOST=postgres
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app  # Hot reload in dev
      - ./storage:/app/storage
    depends_on:
      - postgres
    networks:
      - app-network

  # Vite React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: myplatform-frontend
    restart: unless-stopped
    env_file:
      - ./frontend/.env
    ports:
      - "4173:3000"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    name: app-network

volumes:
  postgres_data:
```

### frontend/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## Theme & Layout Components

### src/components/PageHeader.tsx

```tsx
/**
 * PageHeader Component - Unified title card with aurora gradient
 */
import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentColor?: "cyan" | "purple" | "amber" | "green" | "rose" | "blue";
  actions?: React.ReactNode;
  stats?: React.ReactNode;
  children?: React.ReactNode;
}

const accentColors = {
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    blob1: "rgba(0, 212, 255, 0.35)",
    blob2: "rgba(34, 211, 238, 0.25)",
  },
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    blob1: "rgba(168, 85, 247, 0.35)",
    blob2: "rgba(139, 92, 246, 0.25)",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    blob1: "rgba(245, 158, 11, 0.35)",
    blob2: "rgba(251, 191, 36, 0.25)",
  },
  green: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    blob1: "rgba(16, 185, 129, 0.35)",
    blob2: "rgba(52, 211, 153, 0.25)",
  },
  rose: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    blob1: "rgba(244, 63, 94, 0.35)",
    blob2: "rgba(251, 113, 133, 0.25)",
  },
  blue: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    blob1: "rgba(59, 130, 246, 0.35)",
    blob2: "rgba(96, 165, 250, 0.25)",
  },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  description,
  icon: Icon,
  accentColor = "cyan",
  actions,
  stats,
  children,
}) => {
  const colors = accentColors[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-6 p-6 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0d14 0%, #111827 50%, #1a1f2e 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Aurora Gradient Background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="absolute -inset-10 opacity-80"
          style={{
            backgroundImage: `repeating-linear-gradient(100deg, ${colors.blob1} 0%, ${colors.blob2} 15%, transparent 30%)`,
            backgroundSize: "300% 300%",
            animation: "auroraShimmer 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full blur-[50px]"
          style={{
            top: "-20%",
            left: "10%",
            width: "280px",
            height: "280px",
            background: `radial-gradient(circle, ${colors.blob1} 0%, transparent 70%)`,
            animation: "auroraBlob1 14s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} border ${colors.border}`}>
              <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
              <span className={`text-xs font-medium ${colors.text} uppercase tracking-wider`}>
                {badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {title}
            </h1>

            {/* Description */}
            <p className="text-slate-400 text-base max-w-2xl">
              {description}
            </p>
          </div>

          {/* Actions & Stats */}
          <div className="flex flex-col items-end gap-3">
            {actions}
            {stats}
          </div>
        </div>

        {/* Children */}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </motion.div>
  );
};
```

### src/components/AppLayout.tsx (Simplified)

```tsx
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  Home, Settings, Database, Users, ChevronLeft, 
  ChevronRight, Menu, X 
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Data", path: "/data", icon: Database },
  { label: "Users", path: "/users", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950
          border-r border-white/10
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64" : "w-20"}
          hidden lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {sidebarOpen && (
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Platform
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${isActive 
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 flex flex-col min-h-screen
          transition-all duration-300
          ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}
        `}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          
          <div className="flex items-center gap-4">
            {/* Add notification bell, user menu, etc. */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-[1920px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/10 p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-white">Platform</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
```

---

## VSCode Configuration

### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/.venv/bin/python",
  "python.analysis.typeCheckingMode": "basic",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "emmet.includeLanguages": {
    "typescriptreact": "html"
  }
}
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    // TypeScript & React
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    
    // Python
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "charliermarsh.ruff",
    
    // Docker
    "ms-azuretools.vscode-docker",
    
    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",
    
    // Utilities
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env",
      "console": "integratedTerminal"
    },
    {
      "name": "Chrome: Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["Python: FastAPI", "Chrome: Frontend"]
    }
  ]
}
```

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Docker Mode

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Production Build

```bash
# Frontend
cd frontend && npm run build

# Backend (with Docker)
docker build -t myplatform-backend ./backend

# Run with production settings
docker compose -f docker-compose.prod.yml up -d
```

---

## Best Practices

### 1. Environment Security
- Never commit `.env` files to git
- Use secrets managers (AWS Secrets Manager, HashiCorp Vault) in production
- Rotate API keys regularly

### 2. Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Separate business logic into services

### 3. Type Safety
- Define interfaces for all API responses
- Use Pydantic models for request/response validation
- Enable strict TypeScript mode

### 4. Error Handling
- Use try-catch with specific error types
- Log errors with context (structlog)
- Show user-friendly error messages

### 5. Testing
- Write unit tests for services
- Use Playwright for E2E tests
- Test API endpoints with pytest

### 6. Performance
- Lazy load pages with React.lazy()
- Use React.memo for expensive components
- Cache LLM responses when appropriate

---

## Quick Start Checklist

- [ ] Install prerequisites (Node.js, Python, Docker)
- [ ] Clone/create repository
- [ ] Create `.env` files with API keys
- [ ] Set up PostgreSQL database
- [ ] Install backend dependencies
- [ ] Install frontend dependencies
- [ ] Run in development mode
- [ ] Test API endpoints
- [ ] Build Docker images
- [ ] Deploy to production

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic AI Documentation](https://ai.pydantic.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Framer Motion](https://www.framer.com/motion/)
