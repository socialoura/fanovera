# Twitch RapidAPI Integration Guide

**Complete documentation for using Twitch-Data-API2 RapidAPI to retrieve channel profile information (excluding streams/videos) from a username.**

---

## Table of Contents

1. [Overview](#overview)
2. [API Provider Details](#api-provider-details)
3. [Authentication](#authentication)
4. [Endpoint Specifications](#endpoint-specifications)
5. [Request Format](#request-format)
6. [Response Structure](#response-structure)
7. [Code Examples](#code-examples)
8. [Error Handling](#error-handling)
9. [Rate Limiting & Caching](#rate-limiting--caching)
10. [Best Practices](#best-practices)

---

## Overview

This guide explains how to use the **Twitch-Data-API2 RapidAPI** service to retrieve comprehensive Twitch channel profile information (username, display name, avatar, description, etc.) **without** retrieving streams or videos. The endpoint returns channel information including live status, but for profile-only retrieval, we focus on the static channel data.

### What You Can Retrieve
- Username (login)
- Display name
- Profile picture (avatar)
- Channel description
- Offline image (banner)
- Primary color hex
- Partner status (verified)
- Affiliate status
- Last broadcast title
- Last broadcast timestamp
- Live status (whether currently streaming)
- Profile URL

### What Is Not Retrieved
- Streams (intentionally excluded)
- Videos/VODs
- Clips
- Chat logs
- Followers/following counts (not provided by this endpoint)

---

## API Provider Details

| Property | Value |
|----------|-------|
| **API Name** | Twitch-Data-API2 |
| **Provider** | RapidAPI |
| **Host** | `twitch-data-api2.p.rapidapi.com` |
| **Base URL** | `https://twitch-data-api2.p.rapidapi.com` |
| **Protocol** | HTTPS |
| **Method** | GET |

---

## Authentication

Authentication is handled via API key headers. You must have a RapidAPI account and subscribe to the Twitch-Data-API2 service.

### Required Headers

```http
x-rapidapi-host: twitch-data-api2.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

### Environment Variable

Store your API key as an environment variable:

```bash
# .env file
RAPIDAPI_KEY=your_rapidapi_key_here
```

---

## Endpoint Specifications

### Primary Endpoint: Channel Information

**Endpoint:** `/channels/{username}`  
**Method:** `GET`  
**Purpose:** Retrieve complete channel profile information

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Twitch username (without @ prefix) |

#### Example URL

```
https://twitch-data-api2.p.rapidapi.com/channels/cristiano
```

---

## Request Format

### Complete HTTP Request Example

```http
GET https://twitch-data-api2.p.rapidapi.com/channels/cristiano HTTP/1.1
Host: twitch-data-api2.p.rapidapi.com
x-rapidapi-host: twitch-data-api2.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

### cURL Command

```bash
curl --request GET \
  --url 'https://twitch-data-api2.p.rapidapi.com/channels/cristiano' \
  --header 'x-rapidapi-host: twitch-data-api2.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

---

## Response Structure

### Successful Response (200 OK)

```json
{
  "id": "123456789",
  "login": "cristiano",
  "displayName": "Cristiano Ronaldo",
  "profileImageUrl": "https://static-cdn.jtvnw.net/...",
  "description": "Official channel of Cristiano Ronaldo",
  "isPartner": true,
  "isAffiliate": false,
  "primaryColorHex": "9147FF",
  "offlineImageUrl": "https://static-cdn.jtvnw.net/...",
  "lastBroadcast": {
    "title": "Training Session",
    "startedAt": "2024-01-15T10:00:00Z"
  },
  "stream": {
    "id": "987654321",
    "title": "Live Now!"
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Internal Twitch user ID |
| `login` | string | Username/handle (lowercase) |
| `displayName` | string | Display name (with capitalization) |
| `profileImageUrl` | string | Profile picture URL |
| `description` | string | Channel description/bio |
| `isPartner` | boolean | Partner status (verified badge) |
| `isAffiliate` | boolean | Affiliate status |
| `primaryColorHex` | string | Primary theme color (hex code) |
| `offlineImageUrl` | string | Offline banner image URL |
| `lastBroadcast.title` | string | Title of last broadcast |
| `lastBroadcast.startedAt` | string | Timestamp of last broadcast start |
| `stream` | object/null | Stream object if currently live, null if offline |
| `stream.id` | string | Stream ID if live |
| `stream.title` | string | Stream title if live |

### Error Responses

#### 404 Not Found (Channel Not Found)

```json
{
  "error": "Channel not found on Twitch"
}
```

#### 500/502 Service Error

```json
{
  "error": "Twitch API returned 502",
  "detail": "..."
}
```

#### Timeout

```json
{
  "error": "Twitch API request timed out"
}
```

---

## Code Examples

### JavaScript / Node.js (Fetch API)

```javascript
async function getTwitchProfile(username) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "twitch-data-api2.p.rapidapi.com";
  
  // Remove @ prefix if present and convert to lowercase
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  
  const url = `https://${host}/channels/${encodeURIComponent(cleanUsername)}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Channel not found on Twitch");
      }
      throw new Error(`Twitch API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.id) {
      throw new Error("Channel not found on Twitch");
    }

    const avatarUrl = data.profileImageUrl || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=random&size=200`;

    return {
      username: data.login || cleanUsername,
      fullName: data.displayName || cleanUsername,
      avatarUrl,
      followersCount: 0, // Not provided by this endpoint
      followingCount: 0, // Not provided by this endpoint
      likesCount: 0, // Not provided by this endpoint
      videoCount: 0, // Not provided by this endpoint
      bio: data.description || "",
      verified: data.isPartner || false,
      isAffiliate: data.isAffiliate || false,
      primaryColorHex: data.primaryColorHex || "9147FF",
      offlineImageUrl: data.offlineImageUrl || "",
      lastBroadcastTitle: data.lastBroadcast?.title || "",
      lastBroadcastAt: data.lastBroadcast?.startedAt || "",
      isLive: !!data.stream,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Twitch API request timed out");
    }
    console.error("Twitch profile error:", error);
    throw error;
  }
}

// Usage
const profile = await getTwitchProfile("cristiano");
console.log(profile);
```

### JavaScript / Node.js (Next.js API Route)

```typescript
import type { NextRequest } from "next/server";

// ── Simple in-memory cache (max 100 entries, 3 min TTL) ──
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const CACHE_MAX = 100;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawUsername = searchParams.get("username") ?? "";
  const username = rawUsername.replace(/^@/, "").trim().toLowerCase();

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const cached = getCached(`tw:${username}`);
  if (cached) {
    return Response.json(cached);
  }

  const headers = {
    "x-rapidapi-host": "twitch-data-api2.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const apiUrl = `https://twitch-data-api2.p.rapidapi.com/channels/${encodeURIComponent(username)}`;
    console.log("[scraper-twitch] Fetching channel:", apiUrl);

    const res = await fetchWithTimeout(apiUrl, headers);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[scraper-twitch] API error:", res.status, errBody);
      return Response.json(
        { error: `Twitch API returned ${res.status}`, detail: errBody },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const data = await res.json();

    if (!data || !data.id) {
      return Response.json({ error: "Channel not found on Twitch" }, { status: 404 });
    }

    const result = {
      username: data.login || username,
      fullName: data.displayName || data.login || username,
      avatarUrl: data.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      videoCount: 0,
      bio: data.description || "",
      verified: data.isPartner || false,
      isAffiliate: data.isAffiliate || false,
      primaryColorHex: data.primaryColorHex || "9147FF",
      offlineImageUrl: data.offlineImageUrl || "",
      lastBroadcastTitle: data.lastBroadcast?.title || "",
      lastBroadcastAt: data.lastBroadcast?.startedAt || "",
      isLive: !!data.stream,
      posts: [],
    };

    setCache(`tw:${username}`, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Twitch API request timed out"
        : "Failed to fetch Twitch data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

### Python (Requests)

```python
import os
import requests
from requests.exceptions import Timeout

def get_twitch_profile(username):
    """
    Retrieve Twitch channel profile information (excluding streams).
    
    Args:
        username (str): Twitch username (with or without @)
    
    Returns:
        dict: Profile data with username, fullName, avatarUrl, etc.
    
    Raises:
        Exception: If API request fails or channel not found
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "twitch-data-api2.p.rapidapi.com"
    
    # Clean username
    clean_username = username.replace("@", "").strip().lower()
    
    url = f"https://{host}/channels/{clean_username}"
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=8)
        
        if response.status_code == 404:
            raise Exception("Channel not found on Twitch")
        
        response.raise_for_status()
        data = response.json()
        
        if not data or not data.get("id"):
            raise Exception("Channel not found on Twitch")
        
        avatar_url = data.get("profileImageUrl") or \
            f"https://ui-avatars.com/api/?name={clean_username}&background=random&size=200"
        
        last_broadcast = data.get("lastBroadcast", {})
        
        return {
            "username": data.get("login", clean_username),
            "fullName": data.get("displayName", clean_username),
            "avatarUrl": avatar_url,
            "followersCount": 0,
            "followingCount": 0,
            "likesCount": 0,
            "videoCount": 0,
            "bio": data.get("description", ""),
            "verified": data.get("isPartner", False),
            "isAffiliate": data.get("isAffiliate", False),
            "primaryColorHex": data.get("primaryColorHex", "9147FF"),
            "offlineImageUrl": data.get("offlineImageUrl", ""),
            "lastBroadcastTitle": last_broadcast.get("title", ""),
            "lastBroadcastAt": last_broadcast.get("startedAt", ""),
            "isLive": bool(data.get("stream")),
        }
    
    except Timeout:
        raise Exception("Twitch API request timed out")
    except Exception as e:
        print(f"Twitch profile error: {e}")
        raise

# Usage
if __name__ == "__main__":
    profile = get_twitch_profile("cristiano")
    print(profile)
```

### Go

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type TwitchChannelResponse struct {
	ID               string           `json:"id"`
	Login            string           `json:"login"`
	DisplayName      string           `json:"displayName"`
	ProfileImageUrl  string           `json:"profileImageUrl"`
	Description      string           `json:"description"`
	IsPartner        bool             `json:"isPartner"`
	IsAffiliate      bool             `json:"isAffiliate"`
	PrimaryColorHex  string           `json:"primaryColorHex"`
	OfflineImageUrl  string           `json:"offlineImageUrl"`
	LastBroadcast    *LastBroadcast   `json:"lastBroadcast"`
	Stream           *Stream          `json:"stream"`
}

type LastBroadcast struct {
	Title     string `json:"title"`
	StartedAt string `json:"startedAt"`
}

type Stream struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type NormalizedTwitchProfile struct {
	Username          string `json:"username"`
	FullName          string `json:"fullName"`
	AvatarUrl         string `json:"avatarUrl"`
	FollowersCount    int    `json:"followersCount"`
	FollowingCount    int    `json:"followingCount"`
	LikesCount        int    `json:"likesCount"`
	VideoCount        int    `json:"videoCount"`
	Bio               string `json:"bio"`
	Verified          bool   `json:"verified"`
	IsAffiliate       bool   `json:"isAffiliate"`
	PrimaryColorHex   string `json:"primaryColorHex"`
	OfflineImageUrl   string `json:"offlineImageUrl"`
	LastBroadcastTitle string `json:"lastBroadcastTitle"`
	LastBroadcastAt   string `json:"lastBroadcastAt"`
	IsLive            bool   `json:"isLive"`
}

func GetTwitchProfile(username string) (*NormalizedTwitchProfile, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "twitch-data-api2.p.rapidapi.com"
	
	// Clean username
	cleanUsername := strings.TrimPrefix(strings.ToLower(strings.TrimSpace(username)), "@")
	
	url := fmt.Sprintf("https://%s/channels/%s", host, url.PathEscape(cleanUsername))
	
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("x-rapidapi-host", host)
	req.Header.Set("x-rapidapi-key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("Channel not found on Twitch")
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Twitch API returned %d", resp.StatusCode)
	}
	
	body, _ := io.ReadAll(resp.Body)
	var data TwitchChannelResponse
	json.Unmarshal(body, &data)
	
	if data.ID == "" {
		return nil, fmt.Errorf("Channel not found on Twitch")
	}
	
	avatarUrl := data.ProfileImageUrl
	if avatarUrl == "" {
		avatarUrl = fmt.Sprintf("https://ui-avatars.com/api/?name=%s&background=random&size=200", cleanUsername)
	}
	
	lastBroadcastTitle := ""
	lastBroadcastAt := ""
	if data.LastBroadcast != nil {
		lastBroadcastTitle = data.LastBroadcast.Title
		lastBroadcastAt = data.LastBroadcast.StartedAt
	}
	
	primaryColorHex := data.PrimaryColorHex
	if primaryColorHex == "" {
		primaryColorHex = "9147FF"
	}
	
	return &NormalizedTwitchProfile{
		Username:          data.Login,
		FullName:          data.DisplayName,
		AvatarUrl:         avatarUrl,
		FollowersCount:    0,
		FollowingCount:    0,
		LikesCount:        0,
		VideoCount:        0,
		Bio:               data.Description,
		Verified:          data.IsPartner,
		IsAffiliate:       data.IsAffiliate,
		PrimaryColorHex:   primaryColorHex,
		OfflineImageUrl:   data.OfflineImageUrl,
		LastBroadcastTitle: lastBroadcastTitle,
		LastBroadcastAt:   lastBroadcastAt,
		IsLive:            data.Stream != nil,
	}, nil
}

func main() {
	profile, err := GetTwitchProfile("cristiano")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("%+v\n", profile)
}
```

---

## Error Handling

### Common Error Scenarios

| Error Code | Meaning | Recommended Action |
|------------|---------|-------------------|
| `400` | Bad Request | Check username format |
| `404` | Channel Not Found | Inform user to verify username |
| `429` | Rate Limited | Implement backoff/retry with exponential delay |
| `500/502` | API Error | Retry with exponential backoff |
| `Timeout` | Request Timeout | Increase timeout or implement retry logic |

### Error Handling Pattern

```javascript
async function fetchWithRetry(username, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getTwitchProfile(username);
    } catch (error) {
      if (error.message.includes("not found")) {
        throw error; // Don't retry for not found
      }
      if (i === maxRetries - 1) throw error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Rate Limiting & Caching

### Implementing Caching

Twitch channel data is relatively static. Implement caching to reduce API calls and avoid rate limits.

#### In-Memory Cache (Node.js)

```javascript
const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const CACHE_MAX = 100;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // Evict oldest if at limit
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function getTwitchProfileWithCache(username) {
  const cacheKey = `tw:${username}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const data = await getTwitchProfile(username);
  setCache(cacheKey, data);
  return data;
}
```

#### Redis Cache (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 180; // 3 minutes in seconds

async function getTwitchProfileWithCache(username) {
  const cacheKey = `twitch:profile:${username}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const data = await getTwitchProfile(username);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
  return data;
}
```

### Rate Limiting Strategy

- **Cache TTL:** 3-5 minutes per channel
- **Max retries:** 3 with exponential backoff
- **Concurrent requests:** Limit to 5-10 concurrent API calls
- **Daily quota:** Monitor RapidAPI usage and implement daily limits if needed

---

## Best Practices

### 1. Username Normalization

Always normalize usernames to lowercase:

```javascript
function normalizeUsername(username) {
  return username
    .replace(/^@/, "")      // Remove @ prefix
    .trim()                 // Remove whitespace
    .toLowerCase();         // Convert to lowercase (Twitch usernames are case-insensitive)
}
```

### 2. URL Encoding

Always URL-encode the username in the path:

```javascript
const url = `https://twitch-data-api2.p.rapidapi.com/channels/${encodeURIComponent(username)}`;
```

### 3. Cache Key Prefix

Use a prefix for cache keys to avoid collisions:

```javascript
const cacheKey = `tw:${username}`;
```

### 4. Handle Missing Data

The endpoint doesn't provide follower/following counts. Set to 0:

```javascript
followersCount: 0,
followingCount: 0,
```

### 5. Partner vs Affiliate

Distinguish between Partner (verified) and Affiliate status:

```javascript
verified: data.isPartner || false,
isAffiliate: data.isAffiliate || false,
```

### 6. Primary Color Fallback

Provide a default Twitch purple color:

```javascript
primaryColorHex: data.primaryColorHex || "9147FF",
```

### 7. Live Status Check

Check if stream object exists to determine live status:

```javascript
isLive: !!data.stream,
```

### 8. Last Broadcast Handling

Handle missing last broadcast data:

```javascript
lastBroadcastTitle: data.lastBroadcast?.title || "",
lastBroadcastAt: data.lastBroadcast?.startedAt || "",
```

### 9. Timeout Management

Set appropriate timeouts:

```javascript
const TIMEOUT_MS = 8000; // 8 seconds
const signal = AbortSignal.timeout(TIMEOUT_MS);
```

### 10. Environment Variable Security

Never hardcode API keys:

```javascript
// ❌ BAD
const apiKey = "sk_live_1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.RAPIDAPI_KEY;
```

---

## Complete Implementation Example

### Full Next.js API Route with All Best Practices

```typescript
import type { NextRequest } from "next/server";

// ── Simple in-memory cache (max 100 entries, 3 min TTL) ──
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const CACHE_MAX = 100;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawUsername = searchParams.get("username") ?? "";
  const username = rawUsername.replace(/^@/, "").trim().toLowerCase();

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const cached = getCached(`tw:${username}`);
  if (cached) {
    return Response.json(cached);
  }

  const headers = {
    "x-rapidapi-host": "twitch-data-api2.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const apiUrl = `https://twitch-data-api2.p.rapidapi.com/channels/${encodeURIComponent(username)}`;
    console.log("[scraper-twitch] Fetching channel:", apiUrl);

    const res = await fetchWithTimeout(apiUrl, headers);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[scraper-twitch] API error:", res.status, errBody);
      return Response.json(
        { error: `Twitch API returned ${res.status}`, detail: errBody },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const data = await res.json();

    if (!data || !data.id) {
      return Response.json({ error: "Channel not found on Twitch" }, { status: 404 });
    }

    const result = {
      username: data.login || username,
      fullName: data.displayName || data.login || username,
      avatarUrl: data.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      videoCount: 0,
      bio: data.description || "",
      verified: data.isPartner || false,
      isAffiliate: data.isAffiliate || false,
      primaryColorHex: data.primaryColorHex || "9147FF",
      offlineImageUrl: data.offlineImageUrl || "",
      lastBroadcastTitle: data.lastBroadcast?.title || "",
      lastBroadcastAt: data.lastBroadcast?.startedAt || "",
      isLive: !!data.stream,
      posts: [],
    };

    setCache(`tw:${username}`, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Twitch API request timed out"
        : "Failed to fetch Twitch data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

---

## Summary

This guide provides everything needed to integrate the Twitch-Data-API2 RapidAPI for retrieving channel profile information (excluding streams):

- ✅ API provider details and authentication
- ✅ Endpoint specifications (channel information)
- ✅ Complete response structure documentation
- ✅ Code examples in JavaScript, Python, and Go
- ✅ Error handling strategies
- ✅ Caching and rate limiting best practices
- ✅ Production-ready implementation example

**Key Points to Remember:**
1. Use GET method with path parameter (not query parameter)
2. Set headers: `x-rapidapi-host`, `x-rapidapi-key`, `Content-Type`
3. URL format: `/channels/{username}` (username in path, not query string)
4. Implement 3-minute caching to reduce API calls
5. Use 8-second timeout for requests
6. **Username must be lowercase** - Twitch usernames are case-insensitive
7. **No follower/following counts** - This endpoint doesn't provide them, set to 0
8. Partner status = verification badge (`isPartner`)
9. Separate Affiliate status (`isAffiliate`)
10. Primary color hex provided for theming (default: "9147FF")
11. Live status: check if `stream` object exists (`!!data.stream`)
12. Last broadcast info: optional, may be null
13. Cache key prefix: `tw:{username}` to avoid collisions

---

**Last Updated:** 2026  
**API Version:** Twitch-Data-API2 via RapidAPI  
**Documentation Purpose:** Channel profile retrieval (excluding streams/videos)
