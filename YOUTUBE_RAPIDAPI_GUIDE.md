# YouTube RapidAPI Integration Guide

**Complete documentation for using YouTube-V2 RapidAPI to retrieve channel profile information (excluding videos) from a username/handle.**

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

This guide explains how to use the **YouTube-V2 RapidAPI** service to retrieve comprehensive YouTube channel profile information (username, subscriber count, description, avatar, etc.) **without** retrieving videos. The videos endpoint is intentionally excluded as per requirements.

### What You Can Retrieve
- Channel handle/username
- Channel name/title
- Channel ID
- Profile picture (avatar)
- Subscriber count
- Video count
- Total view count
- Channel description
- Verification status
- Country (if available)

### What Is Not Retrieved
- Videos/feed (intentionally excluded)
- Playlists
- Comments
- Live streams
- Community posts

---

## API Provider Details

| Property | Value |
|----------|-------|
| **API Name** | YouTube-V2 |
| **Provider** | RapidAPI |
| **Host** | `youtube-v2.p.rapidapi.com` |
| **Base URL** | `https://youtube-v2.p.rapidapi.com` |
| **Protocol** | HTTPS |
| **Method** | GET |

---

## Authentication

Authentication is handled via API key headers. You must have a RapidAPI account and subscribe to the YouTube-V2 service.

### Required Headers

```http
x-rapidapi-host: youtube-v2.p.rapidapi.com
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

### Step 1: Search Endpoint (Find Channel)

**Endpoint:** `/search`  
**Method:** `GET`  
**Purpose:** Search for a channel by username/handle to get the channel ID

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query (username with @ prefix) |
| `lang` | string | No | Language code (default: "fr") |
| `order_by` | string | No | Sort order (default: "relevance") |
| `country` | string | No | Country code (default: "fr") |

#### Example URL

```
https://youtube-v2.p.rapidapi.com/search/?query=@cristiano&lang=fr&order_by=relevance&country=fr
```

### Step 2: Channel Details Endpoint

**Endpoint:** `/channel/details`  
**Method:** `GET`  
**Purpose:** Retrieve complete channel profile information

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel_id` | string | Yes | YouTube channel ID (from search results) |

#### Example URL

```
https://youtube-v2.p.rapidapi.com/channel/details?channel_id=UC7fCSl8sLqM8p0p5q5q5q5q
```

---

## Request Format

### Complete HTTP Request Example (Two-Step Process)

#### Step 1: Search

```http
GET https://youtube-v2.p.rapidapi.com/search/?query=@cristiano&lang=fr&order_by=relevance&country=fr HTTP/1.1
Host: youtube-v2.p.rapidapi.com
x-rapidapi-host: youtube-v2.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

#### Step 2: Channel Details

```http
GET https://youtube-v2.p.rapidapi.com/channel/details?channel_id=UC7fCSl8sLqM8p0p5q5q5q5q HTTP/1.1
Host: youtube-v2.p.rapidapi.com
x-rapidapi-host: youtube-v2.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

### cURL Commands

#### Step 1: Search

```bash
curl --request GET \
  --url 'https://youtube-v2.p.rapidapi.com/search/?query=@cristiano&lang=fr&order_by=relevance&country=fr' \
  --header 'x-rapidapi-host: youtube-v2.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

#### Step 2: Channel Details

```bash
curl --request GET \
  --url 'https://youtube-v2.p.rapidapi.com/channel/details?channel_id=UC7fCSl8sLqM8p0p5q5q5q5q' \
  --header 'x-rapidapi-host: youtube-v2.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

---

## Response Structure

### Step 1: Search Response (200 OK)

```json
{
  "channels": [
    {
      "channel_id": "UC7fCSl8sLqM8p0p5q5q5q5q",
      "channelId": "UC7fCSl8sLqM8p0p5q5q5q5q",
      "title": "Cristiano Ronaldo",
      "username": "cristiano",
      "handle": "cristiano",
      "custom_url": "cristiano",
      "thumbnail": "https://yt3.ggpht.com/...",
      "subscriber_count": 15800000,
      "video_count": 856,
      "view_count": 2850000000
    }
  ],
  "results": [...]
}
```

### Step 2: Channel Details Response (200 OK)

```json
{
  "channel_id": "UC7fCSl8sLqM8p0p5q5q5q5q",
  "title": "Cristiano Ronaldo",
  "handle": "cristiano",
  "custom_url": "cristiano",
  "username": "cristiano",
  "description": "Official channel of Cristiano Ronaldo",
  "avatar": [
    {
      "url": "https://yt3.ggpht.com/..."
    }
  ],
  "thumbnail": "https://yt3.ggpht.com/...",
  "avatar_url": "https://yt3.ggpht.com/...",
  "subscriber_count": 15800000,
  "subscriberCount": 15800000,
  "video_count": 856,
  "videoCount": 856,
  "view_count": 2850000000,
  "viewCount": 2850000000,
  "is_verified": true,
  "country": "PT",
  "created_at": "2015-01-15"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `channel_id` / `channelId` | string | YouTube channel ID (unique identifier) |
| `title` / `name` | string | Channel display name |
| `handle` / `custom_url` / `username` | string | Channel handle/username |
| `description` | string | Channel description/about text |
| `avatar` / `avatar_url` / `thumbnail` | string | Profile picture URL |
| `subscriber_count` / `subscriberCount` | number | Number of subscribers |
| `video_count` / `videoCount` | number | Total number of videos |
| `view_count` / `viewCount` | number | Total view count across all videos |
| `is_verified` / `is_verified` | boolean | Verification badge status |
| `country` | string | Channel country code (if available) |
| `created_at` | string | Channel creation date |

### Error Responses

#### 404 Not Found (Channel Not Found)

```json
{
  "error": "Chaîne YouTube introuvable"
}
```

#### 500/502 Service Error

```json
{
  "error": "YouTube search API returned 502"
}
```

#### Timeout

```json
{
  "error": "YouTube API request timed out"
}
```

---

## Code Examples

### JavaScript / Node.js (Fetch API)

```javascript
async function getYouTubeProfile(handle) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "youtube-v2.p.rapidapi.com";
  
  // Remove @ prefix if present
  const cleanHandle = handle.replace(/^@/, "").trim();
  
  try {
    // Step 1: Search for channel
    const searchUrl = `https://${host}/search/?query=${encodeURIComponent("@" + cleanHandle)}&lang=fr&order_by=relevance&country=fr`;
    
    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!searchRes.ok) {
      throw new Error(`YouTube search API returned ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    
    // Find the channel in results
    const channels = searchData.channels || searchData.results?.filter((r) => r.type === "channel") || [];
    const channel = channels[0];

    if (!channel) {
      throw new Error("Chaîne YouTube introuvable");
    }

    const channelId = channel.channel_id || channel.channelId || channel.id;

    if (!channelId) {
      throw new Error("Chaîne YouTube introuvable");
    }

    // Step 2: Get channel details
    const channelUrl = `https://${host}/channel/details?channel_id=${encodeURIComponent(channelId)}`;
    
    const channelRes = await fetch(channelUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!channelRes.ok) {
      throw new Error(`YouTube channel API returned ${channelRes.status}`);
    }

    const channelData = await channelRes.json();
    const info = channelData;

    const username = info.handle || info.custom_url || cleanHandle;
    const fullName = info.title || info.name || cleanHandle;
    const avatarUrl = info.avatar?.[0]?.url || info.thumbnail || info.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanHandle)}&background=random&size=200`;
    const subscriberCount = info.subscriber_count || info.subscriberCount || 0;
    const videoCount = info.video_count || info.videoCount || 0;
    const viewCount = info.view_count || info.viewCount || 0;
    const bio = info.description || "";
    const verified = info.is_verified ?? false;

    return {
      username: username.replace(/^@/, ""),
      fullName,
      avatarUrl,
      followersCount: subscriberCount,
      followingCount: 0,
      likesCount: viewCount,
      videoCount,
      bio,
      verified,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("YouTube API request timed out");
    }
    console.error("YouTube profile error:", error);
    throw error;
  }
}

// Usage
const profile = await getYouTubeProfile("cristiano");
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
  const rawInput = searchParams.get("username") ?? "";
  // Accept @handle, channel URL slug, or plain handle
  const handle = rawInput.replace(/^@/, "").trim();

  if (!handle) {
    return Response.json({ error: "Username or channel handle is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  // Check cache
  const cached = getCached(handle);
  if (cached) return Response.json(cached);

  const headers = {
    "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    // ---- Step 1: Search for channel by handle ----
    const searchUrl = `https://youtube-v2.p.rapidapi.com/search/?query=${encodeURIComponent("@" + handle)}&lang=fr&order_by=relevance&country=fr`;

    const searchRes = await fetchWithTimeout(searchUrl, headers);
    if (!searchRes.ok) {
      const errBody = await searchRes.text().catch(() => "");
      console.error("[scraper-youtube] Search API error:", searchRes.status, errBody);
      return Response.json({ error: `YouTube search API returned ${searchRes.status}` }, { status: 502 });
    }

    const searchData = await searchRes.json();
    // Find the channel in results
    const channels = searchData.channels || searchData.results?.filter((r: { type?: string }) => r.type === "channel") || [];
    const channel = channels[0];

    if (!channel) {
      return Response.json({ error: "Chaîne YouTube introuvable" }, { status: 404 });
    }

    const channelId = channel.channel_id || channel.channelId || channel.id;

    if (!channelId) {
      return Response.json({ error: "Chaîne YouTube introuvable" }, { status: 404 });
    }

    // ---- Step 2: Get channel details ----
    const channelUrl = `https://youtube-v2.p.rapidapi.com/channel/details?channel_id=${encodeURIComponent(channelId)}`;

    const channelRes = await fetchWithTimeout(channelUrl, headers);
    if (!channelRes.ok) {
      const errBody = await channelRes.text().catch(() => "");
      console.error("[scraper-youtube] Channel API error:", channelRes.status, errBody);
      return Response.json({ error: `YouTube channel API returned ${channelRes.status}` }, { status: 502 });
    }

    const channelData = await channelRes.json();
    const info = channelData;

    const username = info.handle || info.custom_url || handle;
    const fullName = info.title || info.name || handle;
    const avatarUrl = info.avatar?.[0]?.url || info.thumbnail || info.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&background=random&size=200`;
    const subscriberCount = info.subscriber_count || info.subscriberCount || 0;
    const videoCount = info.video_count || info.videoCount || 0;
    const viewCount = info.view_count || info.viewCount || 0;
    const bio = info.description || "";
    const verified = info.is_verified ?? false;

    const result = {
      username: (username as string).replace(/^@/, ""),
      fullName,
      avatarUrl,
      followersCount: subscriberCount,
      followingCount: 0,
      likesCount: viewCount,
      videoCount,
      bio,
      verified,
    };

    setCache(handle, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "YouTube API request timed out"
      : "Failed to fetch YouTube data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

### Python (Requests)

```python
import os
import requests
from requests.exceptions import Timeout

def get_youtube_profile(handle):
    """
    Retrieve YouTube channel profile information (excluding videos).
    
    Args:
        handle (str): YouTube channel handle (with or without @)
    
    Returns:
        dict: Profile data with username, fullName, avatarUrl, etc.
    
    Raises:
        Exception: If API request fails or channel not found
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "youtube-v2.p.rapidapi.com"
    
    # Clean handle
    clean_handle = handle.replace("@", "").strip()
    
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        # Step 1: Search for channel
        search_url = f"https://{host}/search/"
        search_params = {
            "query": f"@{clean_handle}",
            "lang": "fr",
            "order_by": "relevance",
            "country": "fr"
        }
        
        search_res = requests.get(search_url, headers=headers, params=search_params, timeout=8)
        
        if not search_res.ok:
            raise Exception(f"YouTube search API returned {search_res.status}")
        
        search_data = search_res.json()
        
        # Find the channel in results
        channels = search_data.get("channels") or \
                   [r for r in search_data.get("results", []) if r.get("type") == "channel"] or []
        
        if not channels:
            raise Exception("Chaîne YouTube introuvable")
        
        channel = channels[0]
        channel_id = channel.get("channel_id") or channel.get("channelId") or channel.get("id")
        
        if not channel_id:
            raise Exception("Chaîne YouTube introuvable")
        
        # Step 2: Get channel details
        channel_url = f"https://{host}/channel/details"
        channel_params = {"channel_id": channel_id}
        
        channel_res = requests.get(channel_url, headers=headers, params=channel_params, timeout=8)
        
        if not channel_res.ok:
            raise Exception(f"YouTube channel API returned {channel_res.status}")
        
        info = channel_res.json()
        
        username = info.get("handle") or info.get("custom_url") or clean_handle
        full_name = info.get("title") or info.get("name") or clean_handle
        
        # Avatar priority
        avatar_url = (
            (info.get("avatar") or [{}])[0].get("url") or
            info.get("thumbnail") or
            info.get("avatar_url") or
            f"https://ui-avatars.com/api/?name={clean_handle}&background=random&size=200"
        )
        
        return {
            "username": username.replace("@", ""),
            "fullName": full_name,
            "avatarUrl": avatar_url,
            "followersCount": info.get("subscriber_count") or info.get("subscriberCount") or 0,
            "followingCount": 0,
            "likesCount": info.get("view_count") or info.get("viewCount") or 0,
            "videoCount": info.get("video_count") or info.get("videoCount") or 0,
            "bio": info.get("description", ""),
            "verified": info.get("is_verified", False),
        }
    
    except Timeout:
        raise Exception("YouTube API request timed out")
    except Exception as e:
        print(f"YouTube profile error: {e}")
        raise

# Usage
if __name__ == "__main__":
    profile = get_youtube_profile("cristiano")
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

type YouTubeSearchResponse struct {
	Channels []YouTubeChannel `json:"channels"`
	Results  []interface{}    `json:"results"`
}

type YouTubeChannel struct {
	ChannelID     string `json:"channel_id"`
	ChannelIDAlt  string `json:"channelId"`
	ID            string `json:"id"`
	Title         string `json:"title"`
	Handle        string `json:"handle"`
	CustomURL     string `json:"custom_url"`
	Username      string `json:"username"`
	Thumbnail     string `json:"thumbnail"`
	SubscriberCount int `json:"subscriber_count"`
	VideoCount    int `json:"video_count"`
	ViewCount     int `json:"view_count"`
}

type YouTubeChannelDetails struct {
	ChannelID       string `json:"channel_id"`
	Title           string `json:"title"`
	Handle          string `json:"handle"`
	CustomURL       string `json:"custom_url"`
	Username        string `json:"username"`
	Description     string `json:"description"`
	Avatar          []struct {
		URL string `json:"url"`
	} `json:"avatar"`
	Thumbnail       string `json:"thumbnail"`
	AvatarURL       string `json:"avatar_url"`
	SubscriberCount int `json:"subscriber_count"`
	SubscriberCountAlt int `json:"subscriberCount"`
	VideoCount      int `json:"video_count"`
	VideoCountAlt   int `json:"videoCount"`
	ViewCount       int `json:"view_count"`
	ViewCountAlt    int `json:"viewCount"`
	IsVerified      bool `json:"is_verified"`
	Country         string `json:"country"`
}

type NormalizedYouTubeProfile struct {
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

func GetYouTubeProfile(handle string) (*NormalizedYouTubeProfile, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "youtube-v2.p.rapidapi.com"
	
	// Clean handle
	cleanHandle := strings.TrimPrefix(strings.TrimSpace(handle), "@")
	
	headers := map[string]string{
		"x-rapidapi-host": host,
		"x-rapidapi-key": apiKey,
		"Content-Type":  "application/json",
	}
	
	// Step 1: Search for channel
	searchUrl := fmt.Sprintf("https://%s/search/", host)
	searchParams := url.Values{}
	searchParams.Add("query", "@"+cleanHandle)
	searchParams.Add("lang", "fr")
	searchParams.Add("order_by", "relevance")
	searchParams.Add("country", "fr")
	
	req, _ := http.NewRequest("GET", searchUrl+"?"+searchParams.Encode(), nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("YouTube search API returned %d", resp.StatusCode)
	}
	
	body, _ := io.ReadAll(resp.Body)
	var searchResp YouTubeSearchResponse
	json.Unmarshal(body, &searchResp)
	
	if len(searchResp.Channels) == 0 {
		return nil, fmt.Errorf("Chaîne YouTube introuvable")
	}
	
	channel := searchResp.Channels[0]
	channelID := channel.ChannelID
	if channelID == "" {
		channelID = channel.ChannelIDAlt
	}
	if channelID == "" {
		channelID = channel.ID
	}
	if channelID == "" {
		return nil, fmt.Errorf("Chaîne YouTube introuvable")
	}
	
	// Step 2: Get channel details
	channelUrl := fmt.Sprintf("https://%s/channel/details", host)
	channelParams := url.Values{}
	channelParams.Add("channel_id", channelID)
	
	req2, _ := http.NewRequest("GET", channelUrl+"?"+channelParams.Encode(), nil)
	for k, v := range headers {
		req2.Header.Set(k, v)
	}
	
	resp2, err := client.Do(req2)
	if err != nil {
		return nil, err
	}
	defer resp2.Body.Close()
	
	if resp2.StatusCode != 200 {
		return nil, fmt.Errorf("YouTube channel API returned %d", resp2.StatusCode)
	}
	
	body2, _ := io.ReadAll(resp2.Body)
	var info YouTubeChannelDetails
	json.Unmarshal(body2, &info)
	
	username := info.Handle
	if username == "" {
		username = info.CustomURL
	}
	if username == "" {
		username = cleanHandle
	}
	
	fullName := info.Title
	if fullName == "" {
		fullName = cleanHandle
	}
	
	// Avatar priority
	avatarUrl := info.Thumbnail
	if avatarUrl == "" && len(info.Avatar) > 0 {
		avatarUrl = info.Avatar[0].URL
	}
	if avatarUrl == "" {
		avatarUrl = info.AvatarURL
	}
	if avatarUrl == "" {
		avatarUrl = fmt.Sprintf("https://ui-avatars.com/api/?name=%s&background=random&size=200", cleanHandle)
	}
	
	subscriberCount := info.SubscriberCount
	if subscriberCount == 0 {
		subscriberCount = info.SubscriberCountAlt
	}
	
	videoCount := info.VideoCount
	if videoCount == 0 {
		videoCount = info.VideoCountAlt
	}
	
	viewCount := info.ViewCount
	if viewCount == 0 {
		viewCount = info.ViewCountAlt
	}
	
	return &NormalizedYouTubeProfile{
		Username:       strings.TrimPrefix(username, "@"),
		FullName:       fullName,
		AvatarUrl:      avatarUrl,
		FollowersCount: subscriberCount,
		FollowingCount: 0,
		LikesCount:     viewCount,
		VideoCount:     videoCount,
		Bio:            info.Description,
		Verified:       info.IsVerified,
	}, nil
}

func main() {
	profile, err := GetYouTubeProfile("cristiano")
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
| `400` | Bad Request | Check handle format and URL encoding |
| `404` | Channel Not Found | Inform user to verify channel handle |
| `429` | Rate Limited | Implement backoff/retry with exponential delay |
| `500/502` | API Error | Retry with exponential backoff |
| `Timeout` | Request Timeout | Increase timeout or implement retry logic |

### Error Handling Pattern

```javascript
async function fetchWithRetry(handle, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getYouTubeProfile(handle);
    } catch (error) {
      if (error.message.includes("introuvable")) {
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

YouTube channel data doesn't change frequently. Implement caching to reduce API calls and avoid rate limits.

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

async function getYouTubeProfileWithCache(handle) {
  const cached = getCached(handle);
  if (cached) return cached;
  
  const data = await getYouTubeProfile(handle);
  setCache(handle, data);
  return data;
}
```

#### Redis Cache (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 180; // 3 minutes in seconds

async function getYouTubeProfileWithCache(handle) {
  const cached = await redis.get(`youtube:profile:${handle}`);
  if (cached) return JSON.parse(cached);
  
  const data = await getYouTubeProfile(handle);
  await redis.setex(`youtube:profile:${handle}`, CACHE_TTL, JSON.stringify(data));
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

### 1. Handle Normalization

Accept multiple input formats (handle, URL slug, plain handle):

```javascript
function normalizeHandle(input) {
  return input
    .replace(/^@/, "")      // Remove @ prefix
    .trim();                 // Remove whitespace
}
```

### 2. Two-Step Process

Always use the two-step process: Search → Channel Details. This is required because YouTube doesn't have a direct profile lookup by handle.

```javascript
// Step 1: Search to get channel ID
const channelId = await searchChannel(handle);
// Step 2: Get channel details using channel ID
const profile = await getChannelDetails(channelId);
```

### 3. URL Encoding

Always URL-encode query parameters:

```javascript
const url = `https://youtube-v2.p.rapidapi.com/search/?query=${encodeURIComponent("@" + handle)}`;
```

### 4. Timeout Management

Set appropriate timeouts for both API calls:

```javascript
const TIMEOUT_MS = 8000; // 8 seconds per call
const signal = AbortSignal.timeout(TIMEOUT_MS);
```

### 5. Handle Multiple Response Formats

The API may use different field names. Handle both:

```javascript
const channelId = channel.channel_id || channel.channelId || channel.id;
const subscriberCount = info.subscriber_count || info.subscriberCount || 0;
```

### 6. Avatar Fallback

Provide a fallback avatar if the API returns an invalid URL:

```javascript
function getAvatarUrl(info, handle) {
  const avatar = info.avatar?.[0]?.url || info.thumbnail || info.avatar_url;
  if (avatar && avatar.startsWith("http")) {
    return avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&background=random&size=200`;
}
```

### 7. Channel ID Extraction

Extract channel ID from search results with fallbacks:

```javascript
const channelId = channel.channel_id || channel.channelId || channel.id;
if (!channelId) {
  throw new Error("Chaîne YouTube introuvable");
}
```

### 8. Environment Variable Security

Never hardcode API keys:

```javascript
// ❌ BAD
const apiKey = "sk_live_1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.RAPIDAPI_KEY;
```

### 9. Logging

Implement comprehensive logging:

```javascript
console.log("[scraper-youtube] Searching channel:", searchUrl);
console.error("[scraper-youtube] Search API error:", status, errBody);
```

### 10. Cache by Handle

Cache by the input handle, not channel ID, for consistency:

```javascript
setCache(handle, result); // Cache by handle, not channelId
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
  const rawInput = searchParams.get("username") ?? "";
  const handle = rawInput.replace(/^@/, "").trim();

  if (!handle) {
    return Response.json({ error: "Username or channel handle is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const cached = getCached(handle);
  if (cached) return Response.json(cached);

  const headers = {
    "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    // ---- Step 1: Search for channel by handle ----
    const searchUrl = `https://youtube-v2.p.rapidapi.com/search/?query=${encodeURIComponent("@" + handle)}&lang=fr&order_by=relevance&country=fr`;
    console.log("[scraper-youtube] Searching channel:", searchUrl);

    const searchRes = await fetchWithTimeout(searchUrl, headers);
    if (!searchRes.ok) {
      const errBody = await searchRes.text().catch(() => "");
      console.error("[scraper-youtube] Search API error:", searchRes.status, errBody);
      return Response.json({ error: `YouTube search API returned ${searchRes.status}` }, { status: 502 });
    }

    const searchData = await searchRes.json();
    const channels = searchData.channels || searchData.results?.filter((r: { type?: string }) => r.type === "channel") || [];
    const channel = channels[0];

    if (!channel) {
      return Response.json({ error: "Chaîne YouTube introuvable" }, { status: 404 });
    }

    const channelId = channel.channel_id || channel.channelId || channel.id;

    if (!channelId) {
      return Response.json({ error: "Chaîne YouTube introuvable" }, { status: 404 });
    }

    // ---- Step 2: Get channel details ----
    const channelUrl = `https://youtube-v2.p.rapidapi.com/channel/details?channel_id=${encodeURIComponent(channelId)}`;
    console.log("[scraper-youtube] Fetching channel details:", channelUrl);

    const channelRes = await fetchWithTimeout(channelUrl, headers);
    if (!channelRes.ok) {
      const errBody = await channelRes.text().catch(() => "");
      console.error("[scraper-youtube] Channel API error:", channelRes.status, errBody);
      return Response.json({ error: `YouTube channel API returned ${channelRes.status}` }, { status: 502 });
    }

    const channelData = await channelRes.json();
    const info = channelData;

    const username = info.handle || info.custom_url || handle;
    const fullName = info.title || info.name || handle;
    const avatarUrl = info.avatar?.[0]?.url || info.thumbnail || info.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&background=random&size=200`;
    const subscriberCount = info.subscriber_count || info.subscriberCount || 0;
    const videoCount = info.video_count || info.videoCount || 0;
    const viewCount = info.view_count || info.viewCount || 0;
    const bio = info.description || "";
    const verified = info.is_verified ?? false;

    const result = {
      username: (username as string).replace(/^@/, ""),
      fullName,
      avatarUrl,
      followersCount: subscriberCount,
      followingCount: 0,
      likesCount: viewCount,
      videoCount,
      bio,
      verified,
    };

    setCache(handle, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "YouTube API request timed out"
      : "Failed to fetch YouTube data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

---

## Summary

This guide provides everything needed to integrate the YouTube-V2 RapidAPI for retrieving channel profile information (excluding videos):

- ✅ API provider details and authentication
- ✅ Two-step endpoint specifications (search → details)
- ✅ Complete response structure documentation
- ✅ Code examples in JavaScript, Python, and Go
- ✅ Error handling strategies
- ✅ Caching and rate limiting best practices
- ✅ Production-ready implementation example

**Key Points to Remember:**
1. **Two-step process required:** Search for channel ID → Get channel details
2. Use GET method with query parameters
3. Set headers: `x-rapidapi-host`, `x-rapidapi-key`, `Content-Type`
4. Handle multiple field name variants (e.g., `channel_id` vs `channelId`)
5. Implement 3-minute caching to reduce API calls
6. Use 8-second timeout for each API call
7. Accept multiple input formats (@handle, URL slug, plain handle)
8. URL-encode all query parameters
9. Avatar priority: avatar[0].url > thumbnail > avatar_url > fallback
10. Cache by handle, not channel ID, for consistency

---

**Last Updated:** 2026  
**API Version:** YouTube-V2 via RapidAPI  
**Documentation Purpose:** Channel profile retrieval (excluding videos)
