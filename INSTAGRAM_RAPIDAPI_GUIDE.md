# Instagram RapidAPI Integration Guide

**Complete documentation for using Instagram120.p.rapidapi.com to retrieve profile information (excluding posts) from a username.**

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

This guide explains how to use the **Instagram120 RapidAPI** service to retrieve comprehensive Instagram profile information (username, follower count, bio, avatar, etc.) **without** retrieving posts. The posts endpoint is intentionally excluded as per requirements.

### What You Can Retrieve
- Username
- Full name
- Profile picture (avatar)
- Follower count
- Following count
- Post count
- Biography
- Verification status
- Private account status

### What Is Not Retrieved
- Posts/feed (intentionally excluded)
- Stories
- Highlights
- Comments
- IGTV videos

---

## API Provider Details

| Property | Value |
|----------|-------|
| **API Name** | Instagram120 |
| **Provider** | RapidAPI |
| **Host** | `instagram120.p.rapidapi.com` |
| **Base URL** | `https://instagram120.p.rapidapi.com` |
| **Protocol** | HTTPS |
| **Method** | POST |

---

## Authentication

Authentication is handled via API key headers. You must have a RapidAPI account and subscribe to the Instagram120 service.

### Required Headers

```http
x-rapidapi-host: instagram120.p.rapidapi.com
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

### Primary Endpoint: Profile Information

**Endpoint:** `/api/instagram/profile`  
**Method:** `POST`  
**Purpose:** Retrieve complete profile information (excluding posts)

#### Request Body

```json
{
  "username": "instagram_username_here"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Instagram username (with or without @ prefix) |

### Fallback Endpoint: Search (for 404 cases)

**Endpoint:** `/api/instagram/search`  
**Method:** `POST`  
**Purpose:** Search for username suggestions when profile not found

#### Request Body

```json
{
  "query": "instagram_username_here"
}
```

---

## Request Format

### Complete HTTP Request Example

```http
POST https://instagram120.p.rapidapi.com/api/instagram/profile HTTP/1.1
Host: instagram120.p.rapidapi.com
x-rapidapi-host: instagram120.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
Content-Length: 45

{
  "username": "cristiano"
}
```

### cURL Command

```bash
curl --request POST \
  --url 'https://instagram120.p.rapidapi.com/api/instagram/profile' \
  --header 'x-rapidapi-host: instagram120.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "cristiano"
  }'
```

---

## Response Structure

### Successful Response (200 OK)

```json
{
  "result": {
    "username": "cristiano",
    "full_name": "Cristiano Ronaldo",
    "profile_pic_url_hd": "https://instagram.f...",
    "profile_pic_url": "https://instagram.f...",
    "follower_count": 615000000,
    "following_count": 567,
    "media_count": 3542,
    "biography": "🇵🇹 Football Player | @CR7",
    "is_verified": true,
    "is_private": false
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Instagram username (handle) |
| `full_name` | string | Display name of the account |
| `profile_pic_url_hd` | string | High-resolution profile picture URL |
| `profile_pic_url` | string | Standard profile picture URL |
| `follower_count` | number | Number of followers |
| `following_count` | number | Number of accounts following |
| `media_count` | number | Total number of posts |
| `biography` | string | Bio/description text |
| `is_verified` | boolean | Verification badge status |
| `is_private` | boolean | Private account status |

### Error Responses

#### 404 Not Found (User Not Found)

```json
{
  "error": "User not found"
}
```

#### 403 Forbidden (Private Account)

```json
{
  "error": "Ce compte est privé"
}
```

#### 500/502 Service Error

```json
{
  "error": "Instagram API error: 500",
  "detail": "Internal server error"
}
```

---

## Code Examples

### JavaScript / Node.js (Fetch API)

```javascript
async function getInstagramProfile(username) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "instagram120.p.rapidapi.com";
  
  // Remove @ prefix if present
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  
  try {
    const response = await fetch(`https://${host}/api/instagram/profile`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: cleanUsername }),
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Try search fallback
        return await searchFallback(cleanUsername);
      }
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const result = data.result || data;

    // Check if account is private
    if (result.is_private) {
      throw new Error("Ce compte est privé");
    }

    return {
      username: result.username || cleanUsername,
      fullName: result.full_name || cleanUsername,
      avatarUrl: result.profile_pic_url_hd || result.profile_pic_url,
      followersCount: result.follower_count || 0,
      followingCount: result.following_count || 0,
      videoCount: result.media_count || 0,
      bio: result.biography || "",
      verified: result.is_verified || false,
    };
  } catch (error) {
    console.error("Instagram profile fetch error:", error);
    throw error;
  }
}

async function searchFallback(query) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "instagram120.p.rapidapi.com";
  
  try {
    const response = await fetch(`https://${host}/api/instagram/search`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const users = data.result || data || [];
    
    if (Array.isArray(users) && users.length > 0) {
      return {
        error: "not_found",
        suggestion: users[0].username,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Usage
const profile = await getInstagramProfile("cristiano");
console.log(profile);
```

### JavaScript / Node.js (Next.js API Route)

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim().toLowerCase().replace(/^@/, "");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "instagram120.p.rapidapi.com";

  try {
    const profileRes = await fetch(`https://${host}/api/instagram/profile`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
      signal: AbortSignal.timeout(8000),
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        const suggestion = await searchFallback(username);
        if (suggestion) {
          return NextResponse.json({ error: "not_found", suggestion }, { status: 404 });
        }
      }
      return NextResponse.json({ error: `Instagram API error: ${profileRes.status}` }, { status: profileRes.status });
    }

    const json = await profileRes.json();
    const r = json.result || json;

    if (r.is_private) {
      return NextResponse.json({ error: "Ce compte est privé" }, { status: 403 });
    }

    const data = {
      username: r.username || username,
      fullName: r.full_name || username,
      avatarUrl: r.profile_pic_url_hd || r.profile_pic_url,
      followersCount: r.follower_count || 0,
      followingCount: r.following_count || 0,
      videoCount: r.media_count || 0,
      bio: r.biography || "",
      verified: r.is_verified || false,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("Instagram profile error:", err);
    return NextResponse.json({ error: "Instagram fetch failed" }, { status: 500 });
  }
}
```

### Python (Requests)

```python
import os
import requests
from requests.exceptions import Timeout

def get_instagram_profile(username):
    """
    Retrieve Instagram profile information (excluding posts).
    
    Args:
        username (str): Instagram username (with or without @)
    
    Returns:
        dict: Profile data with username, fullName, avatarUrl, etc.
    
    Raises:
        Exception: If API request fails or account is private
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "instagram120.p.rapidapi.com"
    
    # Clean username
    clean_username = username.replace("@", "").strip().lower()
    
    url = f"https://{host}/api/instagram/profile"
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {"username": clean_username}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        
        if response.status_code == 404:
            # Try search fallback
            suggestion = search_fallback(clean_username)
            if suggestion:
                return {"error": "not_found", "suggestion": suggestion}
            raise Exception("User not found")
        
        if response.status_code == 403:
            raise Exception("Ce compte est privé")
        
        response.raise_for_status()
        data = response.json()
        result = data.get("result", data)
        
        if result.get("is_private"):
            raise Exception("Ce compte est privé")
        
        return {
            "username": result.get("username", clean_username),
            "fullName": result.get("full_name", clean_username),
            "avatarUrl": result.get("profile_pic_url_hd") or result.get("profile_pic_url"),
            "followersCount": result.get("follower_count", 0),
            "followingCount": result.get("following_count", 0),
            "videoCount": result.get("media_count", 0),
            "bio": result.get("biography", ""),
            "verified": result.get("is_verified", False),
        }
    
    except Timeout:
        raise Exception("Instagram API request timed out")
    except Exception as e:
        print(f"Instagram profile error: {e}")
        raise

def search_fallback(query):
    """Search for username suggestions when profile not found."""
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "instagram120.p.rapidapi.com"
    
    url = f"https://{host}/api/instagram/search"
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {"query": query}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=6)
        if response.ok:
            data = response.json()
            users = data.get("result", data)
            if users and len(users) > 0:
                return users[0].get("username")
    except:
        pass
    return None

# Usage
if __name__ == "__main__":
    profile = get_instagram_profile("cristiano")
    print(profile)
```

### Go

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type ProfileRequest struct {
	Username string `json:"username"`
}

type ProfileResponse struct {
	Result ProfileData `json:"result"`
}

type ProfileData struct {
	Username       string `json:"username"`
	FullName       string `json:"full_name"`
	ProfilePicHD   string `json:"profile_pic_url_hd"`
	ProfilePic     string `json:"profile_pic_url"`
	FollowerCount  int    `json:"follower_count"`
	FollowingCount int    `json:"following_count"`
	MediaCount     int    `json:"media_count"`
	Biography      string `json:"biography"`
	IsVerified     bool   `json:"is_verified"`
	IsPrivate      bool   `json:"is_private"`
}

type NormalizedProfile struct {
	Username       string `json:"username"`
	FullName       string `json:"fullName"`
	AvatarUrl      string `json:"avatarUrl"`
	FollowersCount int    `json:"followersCount"`
	FollowingCount int    `json:"followingCount"`
	VideoCount     int    `json:"videoCount"`
	Bio            string `json:"bio"`
	Verified       bool   `json:"verified"`
}

func GetInstagramProfile(username string) (*NormalizedProfile, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "instagram120.p.rapidapi.com"
	
	// Clean username
	cleanUsername := strings.TrimPrefix(strings.ToLower(strings.TrimSpace(username)), "@")
	
	url := fmt.Sprintf("https://%s/api/instagram/profile", host)
	
	requestBody, err := json.Marshal(ProfileRequest{Username: cleanUsername})
	if err != nil {
		return nil, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("x-rapidapi-host", host)
	req.Header.Set("x-rapidapi-key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	if resp.StatusCode == 404 {
		// Try search fallback
		suggestion, _ := SearchFallback(cleanUsername)
		return nil, fmt.Errorf("not_found: %s", suggestion)
	}
	
	if resp.StatusCode == 403 {
		return nil, fmt.Errorf("Ce compte est privé")
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Instagram API error: %d", resp.StatusCode)
	}
	
	var profileResp ProfileResponse
	if err := json.Unmarshal(body, &profileResp); err != nil {
		return nil, err
	}
	
	result := profileResp.Result
	if result.IsPrivate {
		return nil, fmt.Errorf("Ce compte est privé")
	}
	
	avatarUrl := result.ProfilePicHD
	if avatarUrl == "" {
		avatarUrl = result.ProfilePic
	}
	
	return &NormalizedProfile{
		Username:       result.Username,
		FullName:       result.FullName,
		AvatarUrl:      avatarUrl,
		FollowersCount: result.FollowerCount,
		FollowingCount: result.FollowingCount,
		VideoCount:     result.MediaCount,
		Bio:            result.Biography,
		Verified:       result.IsVerified,
	}, nil
}

func SearchFallback(query string) (string, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "instagram120.p.rapidapi.com"
	
	url := fmt.Sprintf("https://%s/api/instagram/search", host)
	
	requestBody, _ := json.Marshal(map[string]string{"query": query})
	
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	req.Header.Set("x-rapidapi-host", host)
	req.Header.Set("x-rapidapi-key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 6 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		return "", nil
	}
	
	var data struct {
		Result []struct {
			Username string `json:"username"`
		} `json:"result"`
	}
	
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &data)
	
	if len(data.Result) > 0 {
		return data.Result[0].Username, nil
	}
	
	return "", nil
}

func main() {
	profile, err := GetInstagramProfile("cristiano")
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
| `400` | Bad Request | Check username format and request body |
| `403` | Private Account | Inform user account is private, cannot access |
| `404` | User Not Found | Try search fallback or ask user to verify username |
| `429` | Rate Limited | Implement backoff/retry with exponential delay |
| `500/502` | API Error | Retry with exponential backoff |
| `Timeout` | Request Timeout | Increase timeout or implement retry logic |

### Error Handling Pattern

```javascript
async function fetchWithRetry(username, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getInstagramProfile(username);
    } catch (error) {
      if (error.message.includes("Ce compte est privé")) {
        throw error; // Don't retry for private accounts
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

Since Instagram profile data doesn't change frequently, implement caching to reduce API calls and avoid rate limits.

#### In-Memory Cache (Node.js)

```javascript
const profileCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCached(username) {
  const entry = profileCache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    profileCache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username, data) {
  profileCache.set(username, { data, ts: Date.now() });
}

async function getInstagramProfileWithCache(username) {
  const cached = getCached(username);
  if (cached) return cached;
  
  const data = await getInstagramProfile(username);
  setCache(username, data);
  return data;
}
```

#### Redis Cache (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 180; // 3 minutes in seconds

async function getInstagramProfileWithCache(username) {
  const cached = await redis.get(`ig:profile:${username}`);
  if (cached) return JSON.parse(cached);
  
  const data = await getInstagramProfile(username);
  await redis.setex(`ig:profile:${username}`, CACHE_TTL, JSON.stringify(data));
  return data;
}
```

### Rate Limiting Strategy

- **Cache TTL:** 3-5 minutes per profile
- **Max retries:** 3 with exponential backoff
- **Concurrent requests:** Limit to 5-10 concurrent API calls
- **Daily quota:** Monitor RapidAPI usage and implement daily limits if needed

---

## Best Practices

### 1. Username Normalization

Always normalize usernames before making API calls:

```javascript
function normalizeUsername(username) {
  return username
    .replace(/^@/, "")      // Remove @ prefix
    .trim()                 // Remove whitespace
    .toLowerCase();         // Convert to lowercase
}
```

### 2. Timeout Management

Set appropriate timeouts to prevent hanging requests:

```javascript
const TIMEOUT_MS = 8000; // 8 seconds
const signal = AbortSignal.timeout(TIMEOUT_MS);

fetch(url, { signal });
```

### 3. Avatar Fallback

Provide a fallback avatar if the API returns an invalid URL:

```javascript
function getAvatarUrl(profilePic, username) {
  if (profilePic && profilePic.startsWith("http")) {
    return profilePic;
  }
  // Fallback to UI Avatars service
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;
}
```

### 4. Private Account Handling

Always check for private accounts and handle gracefully:

```javascript
if (result.is_private) {
  return {
    error: "private_account",
    message: "Ce compte est privé et ne peut pas être analysé"
  };
}
```

### 5. Search Fallback

Implement search fallback for 404 errors to suggest correct usernames:

```javascript
if (response.status === 404) {
  const suggestion = await searchFallback(username);
  return {
    error: "not_found",
    message: "Utilisateur non trouvé",
    suggestion: suggestion || null
  };
}
```

### 6. Environment Variable Security

Never hardcode API keys. Use environment variables:

```javascript
// ❌ BAD
const apiKey = "sk_live_1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.RAPIDAPI_KEY;
```

### 7. Logging

Implement comprehensive logging for debugging:

```javascript
console.log(`[Instagram API] Fetching profile: ${username}`);
console.error(`[Instagram API] Error: ${error.message}`);
```

### 8. Monitoring

Monitor API usage, success rates, and response times:

```javascript
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
};

// Track each request
const startTime = Date.now();
try {
  await getInstagramProfile(username);
  metrics.successfulRequests++;
  metrics.avgResponseTime = (metrics.avgResponseTime + (Date.now() - startTime)) / 2;
} catch {
  metrics.failedRequests++;
}
metrics.totalRequests++;
```

---

## Complete Implementation Example

### Full Next.js API Route with All Best Practices

```typescript
import { NextRequest, NextResponse } from "next/server";

// ── Cache (in-memory for simplicity, use Redis in production) ──
interface CacheEntry {
  data: Record<string, unknown>;
  ts: number;
}
const profileCache = new Map<string, CacheEntry>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCached(key: string) {
  const entry = profileCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    profileCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  // Evict oldest if at limit (LRU-ish)
  if (profileCache.size >= 100) {
    const oldest = profileCache.keys().next().value;
    if (oldest !== undefined) profileCache.delete(oldest);
  }
  profileCache.set(key, { data, ts: Date.now() });
}

// ── Avatar proxy helper ──
function proxyUrl(url: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

// ── Search fallback ──
async function searchFallback(query: string): Promise<string | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "instagram120.p.rapidapi.com";
  
  try {
    const res = await fetch(`https://${host}/api/instagram/search`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const users = json?.result || json || [];
    if (Array.isArray(users) && users.length > 0) {
      return users[0].username || null;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main handler ──
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim().toLowerCase().replace(/^@/, "");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  // Check cache
  const cached = getCached(username);
  if (cached) {
    return NextResponse.json(cached);
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const host = "instagram120.p.rapidapi.com";

  try {
    // Fetch profile
    const profileRes = await fetch(`https://${host}/api/instagram/profile`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
      signal: AbortSignal.timeout(8000),
    });

    if (!profileRes.ok) {
      // Try search fallback on 404
      if (profileRes.status === 404) {
        const suggestion = await searchFallback(username);
        if (suggestion) {
          return NextResponse.json(
            { error: "not_found", suggestion },
            { status: 404 }
          );
        }
      }
      return NextResponse.json(
        { error: `Instagram API error: ${profileRes.status}` },
        { status: profileRes.status }
      );
    }

    const json = await profileRes.json();
    const r = json?.result || json;

    if (r.is_private) {
      return NextResponse.json({ error: "Ce compte est privé" }, { status: 403 });
    }

    // Avatar — proxy it to avoid CORS issues
    const avatarRaw = r.profile_pic_url_hd || r.profile_pic_url || "";
    const avatarUrl = avatarRaw
      ? proxyUrl(avatarRaw)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.full_name || username)}&background=0e1512&color=00ff4c&size=200`;

    const data = {
      username: r.username || username,
      fullName: r.full_name || username,
      avatarUrl,
      followersCount: r.follower_count || 0,
      followingCount: r.following_count || 0,
      videoCount: r.media_count || 0,
      bio: r.biography || "",
      verified: r.is_verified || false,
    };

    // Cache the result
    setCache(username, data);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Instagram profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Instagram fetch failed" },
      { status: 500 }
    );
  }
}
```

---

## Summary

This guide provides everything needed to integrate the Instagram120 RapidAPI for retrieving profile information (excluding posts):

- ✅ API provider details and authentication
- ✅ Endpoint specifications and request format
- ✅ Complete response structure documentation
- ✅ Code examples in JavaScript, Python, and Go
- ✅ Error handling strategies
- ✅ Caching and rate limiting best practices
- ✅ Production-ready implementation example

**Key Points to Remember:**
1. Use POST method with JSON body containing `username`
2. Set headers: `x-rapidapi-host`, `x-rapidapi-key`, `Content-Type`
3. Implement 3-minute caching to reduce API calls
4. Handle 404 with search fallback
5. Check for private accounts (403)
6. Use 8-second timeout for requests
7. Normalize usernames (remove @, lowercase, trim)
8. Provide avatar fallback for invalid URLs

---

**Last Updated:** 2026  
**API Version:** Instagram120 via RapidAPI  
**Documentation Purpose:** Profile retrieval (excluding posts)
