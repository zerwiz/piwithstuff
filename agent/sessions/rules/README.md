# 📋 Session Agent Rules

## Overview
This directory contains rules and documentation for the Session Agent at `/home/zerwiz/piwithstuff/agent/sessions`.

---

## 📂 Agent Location
- **Main Agent**: `/home/zerwiz/piwithstuff/agent/sessions/.md`
- **Rules Directory**: `/home/zerwiz/piwithstuff/agent/sessions/rules/`

---

## 🔍 Workspaces
All sessions are stored in workspaces under:
`/home/zerwiz/piwithstuff/.pi/agent/sessions/`

### Available Workspaces:
1. `--home-zerwiz-.pi--/` - Main PI workspace
2. `--home-zerwiz-piwithstuff--/` - PI with stuff workspace
3. `--home-zerwiz-CodeP-codeppi--/` - CodeP CodePPI workspace
4. `--home-zerwiz--/` - Base workspace
5. `--home-zerwiz-CodeP-wayofpi--/` - Way of PI workspace

---

## 📂 Session Data Format

Each session is a JSONL file with:

```json
{"type":"session","id":"019d9cee-c669-77e2-8c2a-ca4c9cda34a1","timestamp":"2026-04-17T19:33:07.305Z","cwd":"/home/zerwiz/.pi"}
{"type":"message","id":"f3e38121","parentId":"def2ba53","timestamp":"2026-04-17T19:33:35.255Z","message":{"role":"user","content":[{"type":"text","text":"..."}],"timestamp":1776454415254}}
{"type":"toolCall","id":"call_2bhgszv4","name":"bash","arguments":{"command":"ls -la ..."}}
{"type":"toolResult","toolCallId":"call_2bhgszv4","toolName":"bash","content":[...],"isError":false}
```

**Message Types:**
- `session` - Session header
- `model_change` - Model update
- `thinking_level_change` - Thinking level change
- `message` - User/assistant messages
- `toolCall` - Tool execution requests
- `toolResult` - Tool execution results

---

## 🛠️ Agent Tools

### `list_sessions()`
List all sessions with optional filtering.

### `search_sessions(query)`
Search sessions by text content.

### `get_session(session_id)`
Get full session details including all messages.

### `export_sessions(session_ids, format)`
Export sessions to JSON, TXT, or CSV.

### `delete_session(session_id)`
Delete a session (with confirmation).

### `get_stats()`
Get aggregate session statistics.

---

## 📂 Rule Files

- `README.md` - This file (overview & usage)
- `SYSTEM.md` - Session storage system documentation
- `SCHEDULING.md` - Session lifecycle management
- `ARCHIVE.md` - Archiving guidelines

---

See individual files for detailed rules.

