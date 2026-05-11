# Spotify RapidAPI Integration Guide

**Complete documentation for using Spotify-Scraper RapidAPI to search for tracks and retrieve track metadata.**

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

This guide explains how to use the **Spotify-Scraper RapidAPI** service to search for music tracks and retrieve detailed track metadata. **Note:** This is NOT a user profile scraper - it's specifically for searching and retrieving music track information.

### What You Can Retrieve
- Track search by name
- Track metadata by Spotify ID
- Track name
- Artist(s) information
- Album name
- Album cover art
- Track duration
- Play count (if available)
- Spotify share URL

### What Is Not Retrieved
- User profiles
- Playlists
- Artist profiles (only basic artist info within track data)
- User activity/listening history
- Audio features

---

## API Provider Details

| Property | Value |
|----------|-------|
| **API Name** | Spotify-Scraper |
| **Provider** | RapidAPI |
| **Host** | `spotify-scraper.p.rapidapi.com` |
| **Base URL** | `https://spotify-scraper.p.rapidapi.com` |
| **Protocol** | HTTPS |
| **Method** | GET |

---

## Authentication

Authentication is handled via API key headers. You must have a RapidAPI account and subscribe to the Spotify-Scraper service.

### Required Headers

```http
x-rapidapi-host: spotify-scraper.p.rapidapi.com
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

### Mode 1: Search by Track Name

**Endpoint:** `/v1/track/search`  
**Method:** `GET`  
**Purpose:** Search for a track by name

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Track name to search for |

#### Example URL

```
https://spotify-scraper.p.rapidapi.com/v1/track/search?name=Blinding+Lights
```

### Mode 2: Get Track Metadata by ID

**Endpoint:** `/v1/track/metadata`  
**Method:** `GET`  
**Purpose:** Retrieve detailed track metadata using Spotify track ID

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `trackId` | string | Yes | Spotify track ID |

#### Example URL

```
https://spotify-scraper.p.rapidapi.com/v1/track/metadata?trackId=4cOdK2wGLETKBW3PvgPWqT
```

---

## Request Format

### Mode 1: Search by Track Name

#### Complete HTTP Request Example

```http
GET https://spotify-scraper.p.rapidapi.com/v1/track/search?name=Blinding+Lights HTTP/1.1
Host: spotify-scraper.p.rapidapi.com
x-rapidapi-host: spotify-scraper.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

#### cURL Command

```bash
curl --request GET \
  --url 'https://spotify-scraper.p.rapidapi.com/v1/track/search?name=Blinding+Lights' \
  --header 'x-rapidapi-host: spotify-scraper.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

### Mode 2: Get Track Metadata by ID

#### Complete HTTP Request Example

```http
GET https://spotify-scraper.p.rapidapi.com/v1/track/metadata?trackId=4cOdK2wGLETKBW3PvgPWqT HTTP/1.1
Host: spotify-scraper.p.rapidapi.com
x-rapidapi-host: spotify-scraper.p.rapidapi.com
x-rapidapi-key: YOUR_RAPIDAPI_KEY
Content-Type: application/json
```

#### cURL Command

```bash
curl --request GET \
  --url 'https://spotify-scraper.p.rapidapi.com/v1/track/metadata?trackId=4cOdK2wGLETKBW3PvgPWqT' \
  --header 'x-rapidapi-host: spotify-scraper.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
  --header 'Content-Type: application/json'
```

---

## Response Structure

### Mode 1: Search Response (200 OK)

```json
{
  "status": true,
  "id": "4cOdK2wGLETKBW3PvgPWqT",
  "name": "Blinding Lights",
  "shareUrl": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
  "durationText": "3:20",
  "playCount": 3674247394,
  "artists": [
    {
      "name": "The Weeknd",
      "id": "1Xyo4u8uXC1ZmMpatF05PJ"
    }
  ],
  "album": {
    "name": "After Hours",
    "cover": [
      {
        "url": "https://i.scdn.co/image/..."
      }
    ]
  }
}
```

### Mode 2: Metadata Response (200 OK)

```json
{
  "status": true,
  "id": "4cOdK2wGLETKBW3PvgPWqT",
  "name": "Blinding Lights",
  "shareUrl": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
  "durationText": "3:20",
  "playCount": 3674247394,
  "artists": [
    {
      "name": "The Weeknd",
      "id": "1Xyo4u8uXC1ZmMpatF05PJ"
    }
  ],
  "album": {
    "name": "After Hours",
    "cover": [
      {
        "url": "https://i.scdn.co/image/..."
      }
    ]
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | boolean | Success status (true if successful) |
| `id` | string | Spotify track ID |
| `name` | string | Track name |
| `shareUrl` | string | Spotify share URL (open.spotify.com) |
| `durationText` | string | Track duration in MM:SS format |
| `playCount` | number | Total play count (if available) |
| `artists` | array | List of artists on the track |
| `artists[].name` | string | Artist name |
| `artists[].id` | string | Spotify artist ID |
| `album.name` | string | Album name |
| `album.cover` | array | Array of cover image URLs |
| `album.cover[].url` | string | Cover image URL (highest resolution) |

### Error Responses

#### 404 Not Found (Track Not Found)

```json
{
  "error": "Track not found"
}
```

#### 404 Not Found (No Track Found in Search)

```json
{
  "error": "No track found"
}
```

#### 502 Service Error

```json
{
  "error": "Spotify API returned 502"
}
```

#### Timeout

```json
{
  "error": "Spotify API request timed out"
}
```

---

## Code Examples

### JavaScript / Node.js (Fetch API)

```javascript
async function searchSpotifyTrack(trackName) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "spotify-scraper.p.rapidapi.com";
  
  try {
    const url = `https://${host}/v1/track/search?name=${encodeURIComponent(trackName)}`;
    
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
        throw new Error("Track not found");
      }
      throw new Error(`Spotify API returned ${response.status}`);
    }

    const raw = await response.json();

    if (!raw.status || !raw.id) {
      throw new Error("No track found");
    }

    return {
      id: raw.id,
      name: raw.name,
      shareUrl: raw.shareUrl,
      durationText: raw.durationText,
      playCount: raw.playCount ?? null,
      artists: (raw.artists || []).map((a) => ({
        name: a.name,
        id: a.id,
      })),
      cover: raw.album?.cover?.[raw.album.cover.length - 1]?.url || null,
      albumName: raw.album?.name || null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Spotify API request timed out");
    }
    console.error("Spotify search error:", error);
    throw error;
  }
}

async function getSpotifyTrackMetadata(trackId) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = "spotify-scraper.p.rapidapi.com";
  
  try {
    const url = `https://${host}/v1/track/metadata?trackId=${encodeURIComponent(trackId)}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Track not found");
      }
      throw new Error(`Spotify API returned ${response.status}`);
    }

    const raw = await response.json();

    if (!raw.status || !raw.id) {
      throw new Error("Track not found");
    }

    return {
      id: raw.id,
      name: raw.name,
      shareUrl: raw.shareUrl,
      durationText: raw.durationText,
      playCount: raw.playCount ?? null,
      artists: (raw.artists || []).map((a) => ({
        name: a.name,
        id: a.id,
      })),
      cover: raw.album?.cover?.[raw.album.cover.length - 1]?.url || null,
      albumName: raw.album?.name || null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Spotify API request timed out");
    }
    console.error("Spotify metadata error:", error);
    throw error;
  }
}

// Usage
const track = await searchSpotifyTrack("Blinding Lights");
console.log(track);

// Or by ID
const metadata = await getSpotifyTrackMetadata("4cOdK2wGLETKBW3PvgPWqT");
console.log(metadata);
```

### JavaScript / Node.js (Next.js API Route)

```typescript
import type { NextRequest } from "next/server";

// ── Simple in-memory cache (max 200 entries, 5 min TTL) ──
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

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
  const mode = searchParams.get("mode") ?? "search";
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const headers = {
    "x-rapidapi-host": "spotify-scraper.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    if (mode === "track") {
      // --- Lookup by track ID ---
      const trackId = searchParams.get("trackId")?.trim();
      if (!trackId) return Response.json({ error: "trackId required" }, { status: 400 });

      const cacheKey = `track:${trackId}`;
      const cached = getCached(cacheKey);
      if (cached) return Response.json(cached);

      const res = await fetchWithTimeout(
        `https://spotify-scraper.p.rapidapi.com/v1/track/metadata?trackId=${encodeURIComponent(trackId)}`,
        headers
      );

      if (!res.ok) {
        return Response.json({ error: `Spotify API returned ${res.status}` }, { status: 502 });
      }

      const raw = await res.json();
      if (!raw.status || !raw.id) {
        return Response.json({ error: "Track not found" }, { status: 404 });
      }

      const result = {
        id: raw.id,
        name: raw.name,
        shareUrl: raw.shareUrl,
        durationText: raw.durationText,
        playCount: raw.playCount ?? null,
        artists: (raw.artists || []).map((a: { name?: string; id?: string }) => ({
          name: a.name,
          id: a.id,
        })),
        cover: raw.album?.cover?.[raw.album.cover.length - 1]?.url || null,
        albumName: raw.album?.name || null,
      };

      setCache(cacheKey, result);
      return Response.json(result);
    }

    // --- Search by name ---
    const q = searchParams.get("q")?.trim();
    if (!q) return Response.json({ error: "q required" }, { status: 400 });

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return Response.json(cached);

    const res = await fetchWithTimeout(
      `https://spotify-scraper.p.rapidapi.com/v1/track/search?name=${encodeURIComponent(q)}`,
      headers
    );

    if (!res.ok) {
      return Response.json({ error: `Spotify API returned ${res.status}` }, { status: 502 });
    }

    const raw = await res.json();
    if (!raw.status || !raw.id) {
      return Response.json({ error: "No track found" }, { status: 404 });
    }

    const result = {
      id: raw.id,
      name: raw.name,
      shareUrl: raw.shareUrl,
      durationText: raw.durationText,
      artists: (raw.artists || []).map((a: { name?: string; id?: string }) => ({
        name: a.name,
        id: a.id,
      })),
      cover: raw.album?.cover?.[raw.album.cover.length - 1]?.url || null,
      albumName: raw.album?.name || null,
    };

    setCache(cacheKey, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Spotify API request timed out"
        : "Failed to fetch Spotify data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

### Python (Requests)

```python
import os
import requests
from requests.exceptions import Timeout

def search_spotify_track(track_name):
    """
    Search for a Spotify track by name.
    
    Args:
        track_name (str): Track name to search for
    
    Returns:
        dict: Track data with id, name, shareUrl, durationText, etc.
    
    Raises:
        Exception: If API request fails or track not found
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "spotify-scraper.p.rapidapi.com"
    
    url = f"https://{host}/v1/track/search"
    params = {"name": track_name}
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=8)
        
        if response.status_code == 404:
            raise Exception("Track not found")
        
        response.raise_for_status()
        raw = response.json()
        
        if not raw.get("status") or not raw.get("id"):
            raise Exception("No track found")
        
        # Get highest resolution cover
        cover_url = None
        album = raw.get("album", {})
        cover_array = album.get("cover", [])
        if cover_array:
            cover_url = cover_array[-1].get("url")
        
        return {
            "id": raw.get("id"),
            "name": raw.get("name"),
            "shareUrl": raw.get("shareUrl"),
            "durationText": raw.get("durationText"),
            "playCount": raw.get("playCount"),
            "artists": [
                {"name": a.get("name"), "id": a.get("id")}
                for a in raw.get("artists", [])
            ],
            "cover": cover_url,
            "albumName": album.get("name"),
        }
    
    except Timeout:
        raise Exception("Spotify API request timed out")
    except Exception as e:
        print(f"Spotify search error: {e}")
        raise

def get_spotify_track_metadata(track_id):
    """
    Get Spotify track metadata by ID.
    
    Args:
        track_id (str): Spotify track ID
    
    Returns:
        dict: Track data with id, name, shareUrl, durationText, etc.
    
    Raises:
        Exception: If API request fails or track not found
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    host = "spotify-scraper.p.rapidapi.com"
    
    url = f"https://{host}/v1/track/metadata"
    params = {"trackId": track_id}
    headers = {
        "x-rapidapi-host": host,
        "x-rapidapi-key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=8)
        
        if response.status_code == 404:
            raise Exception("Track not found")
        
        response.raise_for_status()
        raw = response.json()
        
        if not raw.get("status") or not raw.get("id"):
            raise Exception("Track not found")
        
        # Get highest resolution cover
        cover_url = None
        album = raw.get("album", {})
        cover_array = album.get("cover", [])
        if cover_array:
            cover_url = cover_array[-1].get("url")
        
        return {
            "id": raw.get("id"),
            "name": raw.get("name"),
            "shareUrl": raw.get("shareUrl"),
            "durationText": raw.get("durationText"),
            "playCount": raw.get("playCount"),
            "artists": [
                {"name": a.get("name"), "id": a.get("id")}
                for a in raw.get("artists", [])
            ],
            "cover": cover_url,
            "albumName": album.get("name"),
        }
    
    except Timeout:
        raise Exception("Spotify API request timed out")
    except Exception as e:
        print(f"Spotify metadata error: {e}")
        raise

# Usage
if __name__ == "__main__":
    track = search_spotify_track("Blinding Lights")
    print(track)
    
    # Or by ID
    metadata = get_spotify_track_metadata("4cOdK2wGLETKBW3PvgPWqT")
    print(metadata)
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
	"time"
)

type SpotifyTrackResponse struct {
	Status      bool      `json:"status"`
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	ShareURL    string    `json:"shareUrl"`
	DurationText string   `json:"durationText"`
	PlayCount   *int      `json:"playCount"`
	Artists     []Artist  `json:"artists"`
	Album       Album     `json:"album"`
}

type Artist struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

type Album struct {
	Name  string  `json:"name"`
	Cover []Cover `json:"cover"`
}

type Cover struct {
	URL string `json:"url"`
}

type NormalizedSpotifyTrack struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	ShareURL    string    `json:"shareUrl"`
	DurationText string   `json:"durationText"`
	PlayCount   *int      `json:"playCount"`
	Artists     []Artist  `json:"artists"`
	Cover       string    `json:"cover"`
	AlbumName   string    `json:"albumName"`
}

func SearchSpotifyTrack(trackName string) (*NormalizedSpotifyTrack, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "spotify-scraper.p.rapidapi.com"
	
	url := fmt.Sprintf("https://%s/v1/track/search", host)
	params := url.Values{}
	params.Add("name", trackName)
	
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
		return nil, fmt.Errorf("Track not found")
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Spotify API returned %d", resp.StatusCode)
	}
	
	body, _ := io.ReadAll(resp.Body)
	var raw SpotifyTrackResponse
	json.Unmarshal(body, &raw)
	
	if !raw.Status || raw.ID == "" {
		return nil, fmt.Errorf("No track found")
	}
	
	// Get highest resolution cover
	coverURL := ""
	if len(raw.Album.Cover) > 0 {
		coverURL = raw.Album.Cover[len(raw.Album.Cover)-1].URL
	}
	
	return &NormalizedSpotifyTrack{
		ID:          raw.ID,
		Name:        raw.Name,
		ShareURL:    raw.ShareURL,
		DurationText: raw.DurationText,
		PlayCount:   raw.PlayCount,
		Artists:     raw.Artists,
		Cover:       coverURL,
		AlbumName:   raw.Album.Name,
	}, nil
}

func GetSpotifyTrackMetadata(trackID string) (*NormalizedSpotifyTrack, error) {
	apiKey := os.Getenv("RAPIDAPI_KEY")
	host := "spotify-scraper.p.rapidapi.com"
	
	url := fmt.Sprintf("https://%s/v1/track/metadata", host)
	params := url.Values{}
	params.Add("trackId", trackID)
	
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
		return nil, fmt.Errorf("Track not found")
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Spotify API returned %d", resp.StatusCode)
	}
	
	body, _ := io.ReadAll(resp.Body)
	var raw SpotifyTrackResponse
	json.Unmarshal(body, &raw)
	
	if !raw.Status || raw.ID == "" {
		return nil, fmt.Errorf("Track not found")
	}
	
	// Get highest resolution cover
	coverURL := ""
	if len(raw.Album.Cover) > 0 {
		coverURL = raw.Album.Cover[len(raw.Album.Cover)-1].URL
	}
	
	return &NormalizedSpotifyTrack{
		ID:          raw.ID,
		Name:        raw.Name,
		ShareURL:    raw.ShareURL,
		DurationText: raw.DurationText,
		PlayCount:   raw.PlayCount,
		Artists:     raw.Artists,
		Cover:       coverURL,
		AlbumName:   raw.Album.Name,
	}, nil
}

func main() {
	track, err := SearchSpotifyTrack("Blinding Lights")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("%+v\n", track)
	
	// Or by ID
	metadata, err := GetSpotifyTrackMetadata("4cOdK2wGLETKBW3PvgPWqT")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("%+v\n", metadata)
}
```

---

## Error Handling

### Common Error Scenarios

| Error Code | Meaning | Recommended Action |
|------------|---------|-------------------|
| `400` | Bad Request | Check query parameter format |
| `404` | Track Not Found | Inform user to verify track name or ID |
| `429` | Rate Limited | Implement backoff/retry with exponential delay |
| `502` | API Error | Retry with exponential backoff |
| `Timeout` | Request Timeout | Increase timeout or implement retry logic |

### Error Handling Pattern

```javascript
async function fetchWithRetry(query, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await searchSpotifyTrack(query);
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

Spotify track data is relatively static. Implement caching to reduce API calls.

#### In-Memory Cache (Node.js)

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (longer than profile APIs)
const CACHE_MAX = 200; // Higher limit for tracks

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
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function searchSpotifyTrackWithCache(trackName) {
  const cacheKey = `search:${trackName.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const data = await searchSpotifyTrack(trackName);
  setCache(cacheKey, data);
  return data;
}
```

#### Redis Cache (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 300; // 5 minutes in seconds

async function searchSpotifyTrackWithCache(trackName) {
  const cacheKey = `spotify:search:${trackName.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const data = await searchSpotifyTrack(trackName);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
  return data;
}
```

### Rate Limiting Strategy

- **Cache TTL:** 5 minutes per track (longer than profile APIs)
- **Max retries:** 3 with exponential backoff
- **Concurrent requests:** Limit to 10-20 concurrent API calls
- **Daily quota:** Monitor RapidAPI usage and implement daily limits if needed

---

## Best Practices

### 1. URL Encoding

Always URL-encode track names and IDs:

```javascript
const url = `https://spotify-scraper.p.rapidapi.com/v1/track/search?name=${encodeURIComponent(trackName)}`;
```

### 2. Cache Key Strategy

Use different cache keys for search vs. metadata:

```javascript
const searchKey = `search:${trackName.toLowerCase()}`;
const metadataKey = `track:${trackId}`;
```

### 3. Cover Resolution

The API returns multiple cover resolutions. Use the last one for highest quality:

```javascript
const cover = raw.album?.cover?.[raw.album.cover.length - 1]?.url || null;
```

### 4. Handle Null Play Count

Play count may not always be available:

```javascript
playCount: raw.playCount ?? null,
```

### 5. Artist Array

Always handle artists as an array (even for solo tracks):

```javascript
artists: (raw.artists || []).map((a) => ({ name: a.name, id: a.id })),
```

### 6. Timeout Management

Use 8-second timeout for Spotify API:

```javascript
const TIMEOUT_MS = 8000;
const signal = AbortSignal.timeout(TIMEOUT_MS);
```

### 7. Mode Parameter

Use a mode parameter to distinguish between search and metadata lookup:

```javascript
const mode = searchParams.get("mode") ?? "search";
if (mode === "track") {
  // Lookup by track ID
} else {
  // Search by name
}
```

### 8. Lowercase Search Keys

Cache search queries in lowercase for case-insensitive matching:

```javascript
const cacheKey = `search:${q.toLowerCase()}`;
```

### 9. Environment Variable Security

Never hardcode API keys:

```javascript
// ❌ BAD
const apiKey = "sk_live_1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.RAPIDAPI_KEY;
```

### 10. Higher Cache Limit

Spotify tracks are more numerous than user profiles. Use a higher cache limit:

```javascript
const CACHE_MAX = 200; // Higher than profile APIs (100)
```

---

## Complete Implementation Example

### Full Next.js API Route with All Best Practices

```typescript
import type { NextRequest } from "next/server";

// ── Simple in-memory cache (max 200 entries, 5 min TTL) ──
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

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

/**
 * GET /api/spotify-search?mode=search&q=Blinding+Lights
 * GET /api/spotify-search?mode=track&trackId=4cOdK2wGLETKBW3PvgPWqT
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode") ?? "search";
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const headers = {
    "x-rapidapi-host": "spotify-scraper.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    if (mode === "track") {
      // --- Lookup by track ID ---
      const trackId = searchParams.get("trackId")?.trim();
      if (!trackId) return Response.json({ error: "trackId required" }, { status: 400 });

      const cacheKey = `track:${trackId}`;
      const cached = getCached(cacheKey);
      if (cached) return Response.json(cached);

      const res = await fetchWithTimeout(
        `https://spotify-scraper.p.rapidapi.com/v1/track/metadata?trackId=${encodeURIComponent(trackId)}`,
        headers
      );

      if (!res.ok) {
        return Response.json({ error: `Spotify API returned ${res.status}` }, { status: 502 });
      }

      const raw = await res.json();
      if (!raw.status || !raw.id) {
        return Response.json({ error: "Track not found" }, { status: 404 });
      }

      const result = {
        id: raw.id,
        name: raw.name,
        shareUrl: raw.shareUrl,
        durationText: raw.durationText,
        playCount: raw.playCount ?? null,
        artists: (raw.artists || []).map((a: { name?: string; id?: string }) => ({
          name: a.name,
          id: a.id,
        })),
        cover: raw.album?.cover?.[raw.album.cover.length - 1]?.url || null,
        albumName: raw.album?.name || null,
      };

      setCache(cacheKey, result);
      return Response.json(result);
    }

    // --- Search by name ---
    const q = searchParams.get("q")?.trim();
    if (!q) return Response.json({ error: "q required" }, { status: 400 });

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return Response.json(cached);

    const res = await fetchWithTimeout(
      `https://spotify-scraper.p.rapidapi.com/v1/track/search?name=${encodeURIComponent(q)}`,
      headers
    );

    if (!res.ok) {
      return Response.json({ error: `Spotify API returned ${res.status}` }, { status: 502 });
    }

    const raw = await res.json();
    if (!raw.status || !raw.id) {
      return Response.json({ error: "No track found" }, { status: 404 });
    }

    const result = {
      id: raw.id,
      name: raw.name,
      shareUrl: raw.shareUrl,
      durationText: raw.durationText,
      artists: (raw.artists || []).map((a: { name?: string; id?: string }) => ({
        name: a.name,
        id: a.id,
      })),
      cover: raw.album?.cover?.[raw.album.cover.length - 1]?.url || null,
      albumName: raw.album?.name || null,
    };

    setCache(cacheKey, result);
    return Response.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Spotify API request timed out"
        : "Failed to fetch Spotify data";
    return Response.json({ error: message }, { status: 502 });
  }
}
```

---

## Summary

This guide provides everything needed to integrate the Spotify-Scraper RapidAPI for searching and retrieving music track information:

- ✅ API provider details and authentication
- ✅ Two modes: Search by name vs. Lookup by track ID
- ✅ Complete response structure documentation
- ✅ Code examples in JavaScript, Python, and Go
- ✅ Error handling strategies
- ✅ Caching and rate limiting best practices
- ✅ Production-ready implementation example

**Key Points to Remember:**
1. **Two modes:** Search by track name OR lookup by Spotify track ID
2. This is a **track search API**, NOT a user profile scraper
3. Use GET method with query parameters
4. Set headers: `x-rapidapi-host`, `x-rapidapi-key`, `Content-Type`
5. Use `mode` parameter to distinguish search vs. metadata lookup
6. Implement 5-minute caching (longer than profile APIs)
7. Use 8-second timeout for requests
8. Always URL-encode track names and IDs
9. Cover art: use last element in array for highest resolution
10. Handle `playCount` as optional (may be null)
11. Higher cache limit (200) due to larger number of possible tracks
12. Cache search keys in lowercase for case-insensitive matching

---

**Last Updated:** 2026  
**API Version:** Spotify-Scraper via RapidAPI  
**Documentation Purpose:** Track search and metadata retrieval
