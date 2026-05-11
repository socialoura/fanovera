# TikTok RapidAPI Integration Guide

**Complete documentation for using TikTok-API23 RapidAPI to retrieve profile information (excluding posts) from a username.**

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

This guide explains how to use the **TikTok-API23 RapidAPI** service to retrieve comprehensive TikTok profile information (username, follower count, bio, avatar, etc.) **without** retrieving posts. The posts endpoint is intentionally excluded as per requirements.

### What You Can Retrieve
- Username (uniqueId)
- Full name (nickname)
- Profile picture (avatar)
- Follower count
- Following count
- Like count (total likes on all videos)
- Video count
- Bio/description (signature)
- Verification status
- SecUid (unique identifier for advanced queries)

### What Is Not Retrieved
- Posts/feed (intentionally excluded)
- Videos
- Music tracks
- Hashtags
- Comments
- Shares

---

## API Provider Details

| Property | Value |
|----------|-------|
| **API Name** | TikTok-API23 |
| **Provider** | RapidAPI |
| **Host** | `tiktok-api23.p.rapidapi.com` |
| **Base URL** | `https://tiktok-api23.p.rapidapi.com` |
| **Protocol** | HTTPS |
| **Method** | GET |

---

## Authentication

Authentication is handled via API key headers. You must have a RapidAPI account and subscribe to the TikTok-API23 service.

### Required Headers

```http
x-rapidapi-host: tiktok-api23.p.rapidapi.com
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

### Primary Endpoint: User Information

**Endpoint:** `/api/user/info`  
**Method:** `GET`  
**Purpose:** Retrieve complete profile information (excluding posts)

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uniqueId` | string | Yes | TikTok username (with or without @ prefix) |

#### Example URL

```
https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=cristiano
```

---

## Request Format

### Complete HTTP Request Example

```http
GET https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=cristiano HTTP/1.1
Host: tiktok-api23.p.rapidapi.com
x-rapidapi-host: tiktok-api23.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

### cURL Command

```bash
curl --request GET \
  --url 'https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=cristiano' \
  --header 'x-rapidapi-host: tiktok-api23.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

---

## Response Structure

### Successful Response (200 OK)

```json
{
  "userInfo": {
    "user": {
      "id": "6958085982976290821",
      "uniqueId": "cristiano",
      "nickname": "Cristiano Ronaldo",
      "avatarMedium": "https://p16-sign...",
      "avatarLarger": "https://p16-sign...",
      "avatarThumb": "https://p16-sign...",
      "signature": "CR7",
      "verified": true,
      "secUid": "MS4wLjABAAAA..."
    },
    "stats": {
      "followerCount": 15800000,
      "followingCount": 125,
      "heartCount": 285000000,
      "heart": 285000000,
      "videoCount": 856
    }
  }
}
```

### Alternative Response Format (some API versions)

```json
{
  "user": {
    "id": "6958085982976290821",
    "uniqueId": "cristiano",
    "nickname": "Cristiano Ronaldo",
    "avatarMedium": "https://p16-sign...",
    "avatarLarger": "https://p16-sign...",
    "avatarThumb": "https://p16-sign...",
    "signature": "CR7",
    "verified": true,
    "secUid": "MS4wLjABAAAA..."
  },
  "stats": {
    "followerCount": 15800000,
    "followingCount": 125,
    "heartCount": 285000000,
    "heart": 285000000,
    "videoCount": 856
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `user.id` | string | Internal TikTok user ID |
| `user.uniqueId` | string | Username/handle |
| `user.nickname` | string | Display name |
| `user.avatarMedium` | string | Medium-resolution avatar URL |
| `user.avatarLarger` | string | High-resolution avatar URL |
| `user.avatarThumb` | string | Thumbnail avatar URL |
| `user.signature` | string | Bio/description |
| `user.verified` | boolean | Verification badge status |
| `user.secUid` | string | Secure unique ID (for advanced queries) |
| `stats.followerCount` | number | Number of followers |
| `stats.followingCount` | number | Number of accounts following |
| `stats.heartCount` | number | Total likes on all videos |
| `stats.heart` | number | Same as heartCount (alternative field) |
| `stats.videoCount` | number | Total number of videos |

### Error Responses

#### 404 Not Found (User Not Found)

```json
{
  "error": "User not found on TikTok"
}
```

#### 500/502 Service Error

```json
{
  "error": "TikTok profile API returned 502"
}
```

#### Timeout

```json
{
  "error": "TikTok API request timed out"
}
```

---

## Code Examples

### JavaScript / Node.js (Fetch API)

```javascript
async function getTikTokProfile(username) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "tiktok-api23.p.rapidapi.com";
  
  // Remove @ prefix if present
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  
  const url = `https://${host}/api/user/info?uniqueId=${encodeURIComponent(cleanUsername)}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(6000), // 6 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("User not found on TikTok");
      }
      throw new Error(`TikTok profile API returned ${response.status}`);
    }

    const profileData = await response.json();
    
    // Handle both response formats: { userInfo: { user, stats } } or { user, stats }
    const user = profileData.userInfo?.user ?? profileData.user;
    const stats = profileData.userInfo?.stats ?? profileData.stats;

    if (!user) {
      throw new Error("User not found on TikTok");
    }

    // Avatar priority: larger > medium > thumb > fallback
    const avatarUrl =
      user.avatarLarger ||
      user.avatarMedium ||
      user.avatarThumb ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=random&size=200`;

    return {
      username: user.uniqueId || cleanUsername,
      fullName: user.nickname || cleanUsername,
      avatarUrl,
      followersCount: stats?.followerCount ?? 0,
      followingCount: stats?.followingCount ?? 0,
      likesCount: stats?.heartCount ?? stats?.heart ?? 0,
      videoCount: stats?.videoCount ?? 0,
      bio: user.signature || "",
      verified: user.verified ?? false,
      secUid: user.secUid || null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("TikTok API request timed out");
    }
    console.error("TikTok profile error:", error);
    throw error;
  }
}

// Usage
const profile = await getTikTokProfile("cristiano");
console.log(profile);
```

### JavaScript / Node.js (Next.js API Route)

```typescript
import type { NextRequest } from "next/server";

// ── Simple in-memory cache (LRU-ish, max 100 entries, 3 min TTL) ──
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
  // Evict oldest if at limit
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 6000) {
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

  // Check cache
  const cached = getCached(username);
  if (cached) {
    return Response.json(cached);
  }

  const headers = {
    "x-rapidapi-host": "tiktok-api23.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const profileUrl = `https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=${encodeURIComponent(username)}`;

    const profileRes = await fetchWithTimeout(profileUrl, headers);

    if (!profileRes.ok) {
      const errBody = await profileRes.text().catch(() => "");
      console.error("[scraper-tiktok] Profile API error:", profileRes.status, errBody);
      return Response.json(
        { error: `TikTok profile API returned ${profileRes.status}`, detail: errBody },
        { status: 502 }
      );
    }

    const profileData = await profileRes.json();

    // Handle both response formats
    const user = profileData.userInfo?.user ?? profileData.user;
    const stats = profileData.userInfo?.stats ?? profileData.stats;

    if (!user) {
      return Response.json(
        { error: "User not found on TikTok" },
        { status: 404 }
      );
    }

    const secUid = user.secUid;
    const userId = user.id;
    const fullName = user.nickname || username;
    const followersCount = stats?.followerCount ?? 0;
    const followingCount = stats?.followingCount ?? 0;
    const likesCount = stats?.heartCount ?? stats?.heart ?? 0;
    const videoCount = stats?.videoCount ?? 0;
    const bio = user.signature || "";
    const verified = user.verified ?? false;

    const avatarUrl =
      user.avatarMedium ||
      user.avatarLarger ||
      user.avatarThumb ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;

    const result = {
      username,
      fullName,
      avatarUrl,
      followersCount,
      followingCount,
      likesCount,
      videoCount,
      bio,
      verified,
      secUid,
    };

    setCache(username, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "TikTok API request timed out"
        : "Failed to fetch TikTok data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

### Python (Requests)

```python
import os
import requests
from requests.exceptions import Timeout

def get_tiktok_profile(username):
    """
    Retrieve TikTok profile information (excluding posts).
    
    Args:
        username (str): TikTok username (with or without @)
    
    Returns:
        dict: Profile data with username, fullName, avatarUrl, etc.
    
    Raises:
        Exception: If API request fails or user not found
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "tiktok-api23.p.rapidapi.com"
    
    # Clean username
    clean_username = username.replace("@", "").strip().lower()
    
    url = f"https://{host}/api/user/info"
    params = {"uniqueId": clean_username}
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=6)
        
        if response.status_code == 404:
            raise Exception("User not found on TikTok")
        
        response.raise_for_status()
        data = response.json()
        
        # Handle both response formats
        user = data.get("userInfo", {}).get("user") or data.get("user")
        stats = data.get("userInfo", {}).get("stats") or data.get("stats")
        
        if not user:
            raise Exception("User not found on TikTok")
        
        # Avatar priority
        avatar_url = (
            user.get("avatarLarger") or 
            user.get("avatarMedium") or 
            user.get("avatarThumb") or 
            f"https://ui-avatars.com/api/?name={clean_username}&background=random&size=200"
        )
        
        return {
            "username": user.get("uniqueId", clean_username),
            "fullName": user.get("nickname", clean_username),
            "avatarUrl": avatar_url,
            "followersCount": stats.get("followerCount", 0) if stats else 0,
            "followingCount": stats.get("followingCount", 0) if stats else 0,
            "likesCount": stats.get("heartCount") or stats.get("heart", 0) if stats else 0,
            "videoCount": stats.get("videoCount", 0) if stats else 0,
            "bio": user.get("signature", ""),
            "verified": user.get("verified", False),
            "secUid": user.get("secUid"),
        }
    
    except Timeout:
        raise Exception("TikTok API request timed out")
    except Exception as e:
        print(f"TikTok profile error: {e}")
        raise

# Usage
if __name__ == "__main__":
    profile = get_tiktok_profile("cristiano")
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

type TikTokProfileResponse struct {
	UserInfo *struct {
		User  *TikTokUser  `json:"user"`
		Stats *TikTokStats `json:"stats"`
	} `json:"userInfo"`
	User  *TikTokUser  `json:"user"`
	Stats *TikTokStats `json:"stats"`
}

type TikTokUser struct {
	ID          string `json:"id"`
	UniqueId    string `json:"uniqueId"`
	Nickname    string `json:"nickname"`
	AvatarMedium string `json:"avatarMedium"`
	AvatarLarger string `json:"avatarLarger"`
	AvatarThumb  string `json:"avatarThumb"`
	Signature   string `json:"signature"`
	Verified    bool   `json:"verified"`
	SecUid      string `json:"secUid"`
}

type TikTokStats struct {
	FollowerCount int `json:"followerCount"`
	FollowingCount int `json:"followingCount"`
	HeartCount    int `json:"heartCount"`
	Heart         int `json:"heart"`
	VideoCount    int `json:"videoCount"`
}

type NormalizedTikTokProfile struct {
	Username       string `json:"username"`
	FullName       string `json:"fullName"`
	AvatarUrl      string `json:"avatarUrl"`
	FollowersCount int    `json:"followersCount"`
	FollowingCount int    `json:"followingCount"`
	LikesCount     int    `json:"likesCount"`
	VideoCount     int    `json:"videoCount"`
	Bio            string `json:"bio"`
	Verified       bool   `json:"verified"`
	SecUid         string `json:"secUid"`
}

func GetTikTokProfile(username string) (*NormalizedTikTokProfile, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "tiktok-api23.p.rapidapi.com"
	
	// Clean username
	cleanUsername := strings.TrimPrefix(strings.ToLower(strings.TrimSpace(username)), "@")
	
	baseUrl := fmt.Sprintf("https://%s/api/user/info", host)
	params := url.Values{}
	params.Add("uniqueId", cleanUsername)
	fullUrl := fmt.Sprintf("%s?%s", baseUrl, params.Encode())
	
	req, err := http.NewRequest("GET", fullUrl, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("x-rapidapi-host", host)
	req.Header.Set("x-rapidapi-key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 6 * time.Second}
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
		return nil, fmt.Errorf("User not found on TikTok")
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("TikTok API error: %d", resp.StatusCode)
	}
	
	var profileResp TikTokProfileResponse
	if err := json.Unmarshal(body, &profileResp); err != nil {
		return nil, err
	}
	
	// Handle both response formats
	var user *TikTokUser
	var stats *TikTokStats
	
	if profileResp.UserInfo != nil {
		user = profileResp.UserInfo.User
		stats = profileResp.UserInfo.Stats
	} else {
		user = profileResp.User
		stats = profileResp.Stats
	}
	
	if user == nil {
		return nil, fmt.Errorf("User not found on TikTok")
	}
	
	// Avatar priority
	avatarUrl := user.AvatarLarger
	if avatarUrl == "" {
		avatarUrl = user.AvatarMedium
	}
	if avatarUrl == "" {
		avatarUrl = user.AvatarThumb
	}
	if avatarUrl == "" {
		avatarUrl = fmt.Sprintf("https://ui-avatars.com/api/?name=%s&background=random&size=200", cleanUsername)
	}
	
	likesCount := 0
	if stats != nil {
		if stats.HeartCount > 0 {
			likesCount = stats.HeartCount
		} else {
			likesCount = stats.Heart
		}
	}
	
	followersCount := 0
	followingCount := 0
	videoCount := 0
	if stats != nil {
		followersCount = stats.FollowerCount
		followingCount = stats.FollowingCount
		videoCount = stats.VideoCount
	}
	
	return &NormalizedTikTokProfile{
		Username:       user.UniqueId,
		FullName:       user.Nickname,
		AvatarUrl:      avatarUrl,
		FollowersCount: followersCount,
		FollowingCount: followingCount,
		LikesCount:     likesCount,
		VideoCount:     videoCount,
		Bio:            user.Signature,
		Verified:       user.Verified,
		SecUid:         user.SecUid,
	}, nil
}

func main() {
	profile, err := GetTikTokProfile("cristiano")
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
| `400` | Bad Request | Check username format and URL encoding |
| `404` | User Not Found | Inform user to verify username |
| `429` | Rate Limited | Implement backoff/retry with exponential delay |
| `500/502` | API Error | Retry with exponential backoff |
| `Timeout` | Request Timeout | Increase timeout or implement retry logic |

### Error Handling Pattern

```javascript
async function fetchWithRetry(username, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getTikTokProfile(username);
    } catch (error) {
      if (error.message.includes("User not found")) {
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

TikTok profile data doesn't change frequently. Implement caching to reduce API calls and avoid rate limits.

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

async function getTikTokProfileWithCache(username) {
  const cached = getCached(username);
  if (cached) return cached;
  
  const data = await getTikTokProfile(username);
  setCache(username, data);
  return data;
}
```

#### Redis Cache (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 180; // 3 minutes in seconds

async function getTikTokProfileWithCache(username) {
  const cached = await redis.get(`tiktok:profile:${username}`);
  if (cached) return JSON.parse(cached);
  
  const data = await getTikTokProfile(username);
  await redis.setex(`tiktok:profile:${username}`, CACHE_TTL, JSON.stringify(data));
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

### 2. URL Encoding

Always URL-encode the username in the query parameter:

```javascript
const url = `https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=${encodeURIComponent(username)}`;
```

### 3. Timeout Management

Set appropriate timeouts to prevent hanging requests:

```javascript
const TIMEOUT_MS = 6000; // 6 seconds
const signal = AbortSignal.timeout(TIMEOUT_MS);

fetch(url, { signal });
```

### 4. Avatar Fallback

Provide a fallback avatar if the API returns an invalid URL:

```javascript
function getAvatarUrl(user, username) {
  const avatar = user.avatarLarger || user.avatarMedium || user.avatarThumb;
  if (avatar && avatar.startsWith("http")) {
    return avatar;
  }
  // Fallback to UI Avatars service
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;
}
```

### 5. Handle Multiple Response Formats

The API may return data in different structures. Handle both:

```javascript
const user = profileData.userInfo?.user ?? profileData.user;
const stats = profileData.userInfo?.stats ?? profileData.stats;
```

### 6. SecUid Handling

Store the `secUid` for potential advanced queries (not used for basic profile retrieval but useful for extensions):

```javascript
const secUid = user.secUid;
// Save secUid for future use if needed
```

### 7. Environment Variable Security

Never hardcode API keys. Use environment variables:

```javascript
// ❌ BAD
const apiKey = "sk_live_1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.RAPIDAPI_KEY;
```

### 8. Logging

Implement comprehensive logging for debugging:

```javascript
console.log(`[TikTok API] Fetching profile: ${username}`);
console.error(`[TikTok API] Error: ${error.message}`);
```

### 9. Fallback for Likes Count

The API may use either `heartCount` or `heart` field. Handle both:

```javascript
const likesCount = stats?.heartCount ?? stats?.heart ?? 0;
```

### 10. Cache Eviction Strategy

Implement LRU (Least Recently Used) cache eviction to prevent memory issues:

```javascript
function setCache(key, data) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}
```

---

## Complete Implementation Example

### Full Next.js API Route with All Best Practices

```typescript
import type { NextRequest } from "next/server";

// ── Simple in-memory cache (LRU-ish, max 100 entries, 3 min TTL) ──
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
  // Evict oldest if at limit
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 6000) {
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

  // Check cache
  const cached = getCached(username);
  if (cached) {
    return Response.json(cached);
  }

  const headers = {
    "x-rapidapi-host": "tiktok-api23.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const profileUrl = `https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=${encodeURIComponent(username)}`;
    console.log("[scraper-tiktok] Fetching profile:", profileUrl);

    const profileRes = await fetchWithTimeout(profileUrl, headers);

    if (!profileRes.ok) {
      const errBody = await profileRes.text().catch(() => "");
      console.error("[scraper-tiktok] Profile API error:", profileRes.status, errBody);
      return Response.json(
        { error: `TikTok profile API returned ${profileRes.status}`, detail: errBody },
        { status: 502 }
      );
    }

    const profileData = await profileRes.json();
    console.log("[scraper-tiktok] Profile data keys:", Object.keys(profileData));

    // Handle both response formats: { userInfo: { user, stats } } or { user, stats }
    const user = profileData.userInfo?.user ?? profileData.user;
    const stats = profileData.userInfo?.stats ?? profileData.stats;

    if (!user) {
      return Response.json(
        { error: "User not found on TikTok" },
        { status: 404 }
      );
    }

    const secUid = user.secUid;
    const userId = user.id;
    const fullName = user.nickname || username;
    const followersCount = stats?.followerCount ?? 0;
    const followingCount = stats?.followingCount ?? 0;
    const likesCount = stats?.heartCount ?? stats?.heart ?? 0;
    const videoCount = stats?.videoCount ?? 0;
    const bio = user.signature || "";
    const verified = user.verified ?? false;

    // Avatar priority: larger > medium > thumb > fallback
    const avatarUrl =
      user.avatarMedium ||
      user.avatarLarger ||
      user.avatarThumb ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;

    const result = {
      username,
      fullName,
      avatarUrl,
      followersCount,
      followingCount,
      likesCount,
      videoCount,
      bio,
      verified,
      secUid,
    };

    setCache(username, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "TikTok API request timed out"
        : "Failed to fetch TikTok data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

---

## Summary

This guide provides everything needed to integrate the TikTok-API23 RapidAPI for retrieving profile information (excluding posts):

- ✅ API provider details and authentication
- ✅ Endpoint specifications and request format
- ✅ Complete response structure documentation
- ✅ Code examples in JavaScript, Python, and Go
- ✅ Error handling strategies
- ✅ Caching and rate limiting best practices
- ✅ Production-ready implementation example

**Key Points to Remember:**
1. Use GET method with query parameter `uniqueId`
2. Set headers: `x-rapidapi-host`, `x-rapidapi-key`, `Content-Type`
3. Handle two possible response formats (`{ userInfo: { user, stats } }` or `{ user, stats }`)
4. Implement 3-minute caching to reduce API calls
5. Use 6-second timeout for requests
6. Normalize usernames (remove @, lowercase, trim)
7. URL-encode username in query parameter
8. Handle both `heartCount` and `heart` fields for likes
9. Avatar priority: larger > medium > thumb > fallback
10. Store `secUid` for potential advanced queries

---

**Last Updated:** 2026  
**API Version:** TikTok-API23 via RapidAPI  
**Documentation Purpose:** Profile retrieval (excluding posts)
