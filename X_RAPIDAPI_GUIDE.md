# X (Twitter) RapidAPI Integration Guide

**Complete documentation for using Twitter-API45 RapidAPI to retrieve profile information (excluding posts/tweets) from a username.**

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

This guide explains how to use the **Twitter-API45 RapidAPI** service to retrieve comprehensive X (Twitter) profile information (username, follower count, bio, avatar, etc.) **without** retrieving posts/tweets. The posts endpoint returns timeline data, but for profile-only retrieval, we extract the user profile from the response and ignore the tweets.

### What You Can Retrieve
- Username (screen_name)
- Display name
- Profile picture (avatar)
- Follower count
- Following count
- Total likes received (favorites_count)
- Tweet count (statuses_count)
- Bio/description
- Verification status (blue_verified)
- User ID

### What Is Not Retrieved
- Posts/tweets (intentionally excluded from response)
- Timeline
- Replies
- Retweets
- Media galleries

---

## API Provider Details

| Property | Value |
|----------|-------|
| **API Name** | Twitter-API45 |
| **Provider** | RapidAPI |
| **Host** | `twitter-api45.p.rapidapi.com` |
| **Base URL** | `https://twitter-api45.p.rapidapi.com` |
| **Protocol** | HTTPS |
| **Method** | GET |

---

## Authentication

Authentication is handled via API key headers. You must have a RapidAPI account and subscribe to the Twitter-API45 service.

### Required Headers

```http
x-rapidapi-host: twitter-api45.p.rapidapi.com
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

### Primary Endpoint: User Timeline (Includes Profile)

**Endpoint:** `/replies.php`  
**Method:** `GET`  
**Purpose:** Retrieve user timeline which includes profile information

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `screenname` | string | Yes | X/Twitter username (without @ prefix) |

#### Example URL

```
https://twitter-api45.p.rapidapi.com/replies.php?screenname=cristiano
```

---

## Request Format

### Complete HTTP Request Example

```http
GET https://twitter-api45.p.rapidapi.com/replies.php?screenname=cristiano HTTP/1.1
Host: twitter-api45.p.rapidapi.com
x-rapidapi-host: twitter-api45.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

### cURL Command

```bash
curl --request GET \
  --url 'https://twitter-api45.p.rapidapi.com/replies.php?screenname=cristiano' \
  --header 'x-rapidapi-host: twitter-api45.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

---

## Response Structure

### Successful Response (200 OK)

```json
{
  "user": {
    "id": "1234567890",
    "name": "Cristiano Ronaldo",
    "screen_name": "Cristiano",
    "avatar": "https://pbs.twimg.com/profile_images/...",
    "desc": "⚽️ Football Player",
    "blue_verified": true,
    "sub_count": 15800000,
    "friends": 125,
    "favourites_count": 5000,
    "statuses_count": 856
  },
  "timeline": [
    {
      "tweet_id": "1234567890",
      "text": "Example tweet...",
      "author": {
        "screen_name": "Cristiano"
      }
    }
  ]
}
```

### Field Descriptions (User Profile)

| Field | Type | Description |
|-------|------|-------------|
| `user.id` | string | Internal X user ID |
| `user.name` | string | Display name |
| `user.screen_name` | string | Username/handle |
| `user.avatar` | string | Profile picture URL |
| `user.desc` | string | Bio/description |
| `user.blue_verified` | boolean | Blue verification badge status |
| `user.sub_count` | number | Follower count |
| `user.friends` | number | Following count |
| `user.favourites_count` | number | Total likes received |
| `user.statuses_count` | number | Total tweet count |

### Error Responses

#### 404 Not Found (User Not Found)

```json
{
  "error": "User not found on X"
}
```

#### 502 Service Error

```json
{
  "error": "X API returned 502",
  "detail": "..."
}
```

#### Timeout

```json
{
  "error": "X API request timed out"
}
```

---

## Code Examples

### JavaScript / Node.js (Fetch API)

```javascript
async function getXProfile(username) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "twitter-api45.p.rapidapi.com";
  
  // Remove @ prefix if present
  const cleanUsername = username.replace(/^@/, "").trim();
  
  const url = `https://${host}/replies.php?screenname=${encodeURIComponent(cleanUsername)}`;
  
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
        throw new Error("User not found on X");
      }
      throw new Error(`X API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract user profile from response
    const user = data.user;
    if (!user) {
      throw new Error("User not found on X");
    }

    // Avatar - enhance resolution by replacing _normal with _400x400
    const avatarUrl = user.avatar
      ? user.avatar.replace("_normal", "_400x400")
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=random&size=200`;

    return {
      username: user.screen_name || cleanUsername,
      fullName: user.name || cleanUsername,
      avatarUrl,
      followersCount: user.sub_count || 0,
      followingCount: user.friends || 0,
      likesCount: user.favourites_count || 0,
      videoCount: user.statuses_count || 0,
      bio: user.desc || "",
      verified: user.blue_verified || false,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("X API request timed out");
    }
    console.error("X profile error:", error);
    throw error;
  }
}

// Usage
const profile = await getXProfile("cristiano");
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
  const username = rawUsername.replace(/^@/, "").trim();

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  // Check cache
  const cached = getCached(`x:${username}`);
  if (cached) {
    return Response.json(cached);
  }

  const headers = {
    "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const apiUrl = `https://twitter-api45.p.rapidapi.com/replies.php?screenname=${encodeURIComponent(username)}`;
    console.log("[scraper-x] Fetching timeline:", apiUrl);

    const res = await fetchWithTimeout(apiUrl, headers);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[scraper-x] API error:", res.status, errBody);
      return Response.json(
        { error: `X API returned ${res.status}`, detail: errBody },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const data = await res.json();

    // Extract user profile
    const user = data.user;
    if (!user) {
      return Response.json({ error: "User not found on X" }, { status: 404 });
    }

    // Avatar - enhance resolution
    const avatarUrl = user.avatar
      ? user.avatar.replace("_normal", "_400x400")
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;

    const fullName = user.name || username;
    const followersCount = user.sub_count || user.friends || 0;
    const followingCount = user.friends || 0;
    const bio = user.desc || "";
    const verified = user.blue_verified || false;
    const tweetCount = user.statuses_count || 0;

    const result = {
      username: user.id ? username : username,
      fullName,
      avatarUrl,
      followersCount,
      followingCount,
      likesCount: user.favourites_count || 0,
      videoCount: tweetCount,
      bio,
      verified,
    };

    setCache(`x:${username}`, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "X API request timed out"
        : "Failed to fetch X data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

### Python (Requests)

```python
import os
import requests
from requests.exceptions import Timeout

def get_x_profile(username):
    """
    Retrieve X (Twitter) profile information (excluding posts).
    
    Args:
        username (str): X/Twitter username (with or without @)
    
    Returns:
        dict: Profile data with username, fullName, avatarUrl, etc.
    
    Raises:
        Exception: If API request fails or user not found
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "twitter-api45.p.rapidapi.com"
    
    # Clean username
    clean_username = username.replace("@", "").strip()
    
    url = f"https://{host}/replies.php"
    params = {"screenname": clean_username}
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=8)
        
        if response.status_code == 404:
            raise Exception("User not found on X")
        
        response.raise_for_status()
        data = response.json()
        
        # Extract user profile
        user = data.get("user")
        if not user:
            raise Exception("User not found on X")
        
        # Avatar - enhance resolution
        avatar = user.get("avatar", "")
        if avatar:
            avatar = avatar.replace("_normal", "_400x400")
        else:
            avatar = f"https://ui-avatars.com/api/?name={clean_username}&background=random&size=200"
        
        return {
            "username": user.get("screen_name", clean_username),
            "fullName": user.get("name", clean_username),
            "avatarUrl": avatar,
            "followersCount": user.get("sub_count", 0) or user.get("friends", 0),
            "followingCount": user.get("friends", 0),
            "likesCount": user.get("favourites_count", 0),
            "videoCount": user.get("statuses_count", 0),
            "bio": user.get("desc", ""),
            "verified": user.get("blue_verified", False),
        }
    
    except Timeout:
        raise Exception("X API request timed out")
    except Exception as e:
        print(f"X profile error: {e}")
        raise

# Usage
if __name__ == "__main__":
    profile = get_x_profile("cristiano")
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

type XTimelineResponse struct {
	User *XUser `json:"user"`
	Timeline []interface{} `json:"timeline"`
}

type XUser struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	ScreenName      string `json:"screen_name"`
	Avatar          string `json:"avatar"`
	Desc            string `json:"desc"`
	BlueVerified    bool   `json:"blue_verified"`
	SubCount        int    `json:"sub_count"`
	Friends         int    `json:"friends"`
	FavouritesCount int    `json:"favourites_count"`
	StatusesCount   int    `json:"statuses_count"`
}

type NormalizedXProfile struct {
	Username       string `json:"username"`
	FullName       string `json:"fullName"`
	AvatarUrl      string `json:"avatarUrl"`
	FollowersCount int    `json:"followersCount"`
	FollowingCount int    `json:"followingCount"`
	LikesCount     int    `json:"likesCount"`
	VideoCount     int    `json:"videoCount"`
	Bio            string `json:"bio"`
	Verified       bool   `json:"verified"`
}

func GetXProfile(username string) (*NormalizedXProfile, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "twitter-api45.p.rapidapi.com"
	
	// Clean username
	cleanUsername := strings.TrimPrefix(strings.TrimSpace(username), "@")
	
	url := fmt.Sprintf("https://%s/replies.php", host)
	params := url.Values{}
	params.Add("screenname", cleanUsername)
	
	req, _ := http.NewRequest("GET", url+"?"+params.Encode(), nil)
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
		return nil, fmt.Errorf("User not found on X")
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("X API returned %d", resp.StatusCode)
	}
	
	body, _ := io.ReadAll(resp.Body)
	var data XTimelineResponse
	json.Unmarshal(body, &data)
	
	if data.User == nil {
		return nil, fmt.Errorf("User not found on X")
	}
	
	user := data.User
	
	// Avatar - enhance resolution
	avatarUrl := user.Avatar
	if avatarUrl != "" {
		avatarUrl = strings.Replace(avatarUrl, "_normal", "_400x400", -1)
	} else {
		avatarUrl = fmt.Sprintf("https://ui-avatars.com/api/?name=%s&background=random&size=200", cleanUsername)
	}
	
	followersCount := user.SubCount
	if followersCount == 0 {
		followersCount = user.Friends
	}
	
	return &NormalizedXProfile{
		Username:       user.ScreenName,
		FullName:       user.Name,
		AvatarUrl:      avatarUrl,
		FollowersCount: followersCount,
		FollowingCount: user.Friends,
		LikesCount:     user.FavouritesCount,
		VideoCount:     user.StatusesCount,
		Bio:            user.Desc,
		Verified:       user.BlueVerified,
	}, nil
}

func main() {
	profile, err := GetXProfile("cristiano")
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
| `404` | User Not Found | Inform user to verify username |
| `429` | Rate Limited | Implement backoff/retry with exponential delay |
| `500/502` | API Error | Retry with exponential backoff |
| `Timeout` | Request Timeout | Increase timeout or implement retry logic |

### Error Handling Pattern

```javascript
async function fetchWithRetry(username, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getXProfile(username);
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

X profile data doesn't change frequently. Implement caching to reduce API calls and avoid rate limits.

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

async function getXProfileWithCache(username) {
  const cacheKey = `x:${username}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const data = await getXProfile(username);
  setCache(cacheKey, data);
  return data;
}
```

#### Redis Cache (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 180; // 3 minutes in seconds

async function getXProfileWithCache(username) {
  const cacheKey = `x:profile:${username}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const data = await getXProfile(username);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
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
    .trim();                 // Remove whitespace
}
```

### 2. URL Encoding

Always URL-encode the username:

```javascript
const url = `https://twitter-api45.p.rapidapi.com/replies.php?screenname=${encodeURIComponent(username)}`;
```

### 3. Avatar Resolution Enhancement

The API returns normal resolution avatars. Enhance to high resolution:

```javascript
const avatarUrl = user.avatar
  ? user.avatar.replace("_normal", "_400x400")
  : fallbackUrl;
```

### 4. Cache Key Prefix

Use a prefix for cache keys to avoid collisions:

```javascript
const cacheKey = `x:${username}`;
```

### 5. Extract Profile Only

The endpoint returns timeline data. Extract only the user profile:

```javascript
const user = data.user;
if (!user) {
  throw new Error("User not found");
}
// Ignore data.timeline
```

### 6. Follower Count Fallback

The API may use different field names:

```javascript
const followersCount = user.sub_count || user.friends || 0;
```

### 7. Timeout Management

Set appropriate timeouts:

```javascript
const TIMEOUT_MS = 8000; // 8 seconds
const signal = AbortSignal.timeout(TIMEOUT_MS);
```

### 8. Avatar Fallback

Provide a fallback avatar if the API returns an invalid URL:

```javascript
function getAvatarUrl(avatar, username) {
  if (avatar && avatar.startsWith("http")) {
    return avatar.replace("_normal", "_400x400");
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;
}
```

### 9. Environment Variable Security

Never hardcode API keys:

```javascript
// ❌ BAD
const apiKey = "sk_live_1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.RAPIDAPI_KEY;
```

### 10. Logging

Implement comprehensive logging:

```javascript
console.log("[scraper-x] Fetching timeline:", apiUrl);
console.error("[scraper-x] API error:", status, errBody);
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
  const username = rawUsername.replace(/^@/, "").trim();

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  // Check cache
  const cached = getCached(`x:${username}`);
  if (cached) {
    return Response.json(cached);
  }

  const headers = {
    "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const apiUrl = `https://twitter-api45.p.rapidapi.com/replies.php?screenname=${encodeURIComponent(username)}`;
    console.log("[scraper-x] Fetching timeline:", apiUrl);

    const res = await fetchWithTimeout(apiUrl, headers);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[scraper-x] API error:", res.status, errBody);
      return Response.json(
        { error: `X API returned ${res.status}`, detail: errBody },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const data = await res.json();

    // Extract user profile
    const user = data.user;
    if (!user) {
      return Response.json({ error: "User not found on X" }, { status: 404 });
    }

    // Avatar - enhance resolution by replacing _normal with _400x400
    const avatarUrl = user.avatar
      ? user.avatar.replace("_normal", "_400x400")
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;

    const fullName = user.name || username;
    const followersCount = user.sub_count || user.friends || 0;
    const followingCount = user.friends || 0;
    const bio = user.desc || "";
    const verified = user.blue_verified || false;
    const tweetCount = user.statuses_count || 0;

    const result = {
      username: user.id ? username : username,
      fullName,
      avatarUrl,
      followersCount,
      followingCount,
      likesCount: user.favourites_count || 0,
      videoCount: tweetCount,
      bio,
      verified,
    };

    setCache(`x:${username}`, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "X API request timed out"
        : "Failed to fetch X data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

---

## Summary

This guide provides everything needed to integrate the Twitter-API45 RapidAPI for retrieving X (Twitter) profile information (excluding posts):

- ✅ API provider details and authentication
- ✅ Endpoint specifications (timeline endpoint with profile extraction)
- ✅ Complete response structure documentation
- ✅ Code examples in JavaScript, Python, and Go
- ✅ Error handling strategies
- ✅ Caching and rate limiting best practices
- ✅ Production-ready implementation example

**Key Points to Remember:**
1. **Endpoint returns timeline + profile** - Extract only user profile, ignore tweets
2. Use GET method with query parameter `screenname`
3. Set headers: `x-rapidapi-host`, `x-rapidapi-key`, `Content-Type`
4. Extract `data.user` from response for profile information
5. Implement 3-minute caching to reduce API calls
6. Use 8-second timeout for requests
7. Normalize usernames (remove @, trim)
8. URL-encode username in query parameter
9. **Avatar resolution enhancement:** Replace `_normal` with `_400x400` for higher quality
10. Cache key prefix: `x:{username}` to avoid collisions
11. Follower count fallback: `sub_count` or `friends`
12. Verification field: `blue_verified` (not just `verified`)

---

**Last Updated:** 2026  
**API Version:** Twitter-API45 via RapidAPI  
**Documentation Purpose:** Profile retrieval (excluding posts/tweets)
