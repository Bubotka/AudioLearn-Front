# AudioLearn API Documentation

## Base URL

```
Local: http://localhost:8080
Production: TBD
```

## Authentication

All API endpoints (except `/health`) require JWT authentication using Supabase Auth.

### Headers

```
Authorization: Bearer <SUPABASE_JWT_TOKEN>
Content-Type: application/json
```

### Getting JWT Token

Use Supabase Auth client to authenticate users:

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Access token
const token = data.session.access_token
```

## Supabase Configuration

```javascript
const supabaseUrl = 'https://aficcialnnzezvartjph.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaWNjaWFsbm56ZXp2YXJ0anBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjg4NTYsImV4cCI6MjA3NjgwNDg1Nn0.qxJJ2TKtp0b2-QGojdT9rJw8QrW02of-DHuqLGH9cb8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running.

**Authentication:** Not required

**Response:**
```json
{
  "status": "ok"
}
```

---

### 2. Translation

**POST** `/api/translate`

Translate text with usage limits based on user's plan.

**Authentication:** Required

**Request Body:**
```json
{
  "text": "Hello world",
  "type": "word",  // "word" or "paragraph"
  "sourceLang": "en",
  "targetLang": "ru"
}
```

**Field Validation:**
- `text`: required, string
- `type`: required, must be either "word" or "paragraph"
- `sourceLang`: required, language code (e.g., "en", "ru")
- `targetLang`: required, language code (e.g., "en", "ru")

**Response (200 OK):**
```json
{
  "translatedText": "Привет мир"
}
```

**Errors:**

- `400 Bad Request`: Invalid request format
```json
{
  "error": "invalid request: Key: 'TranslateRequest.Type' Error:Field validation for 'Type' failed on the 'oneof' tag"
}
```

- `401 Unauthorized`: Missing or invalid JWT token
```json
{
  "error": "missing authorization token"
}
```

- `402 Payment Required`: Usage limit exceeded
```json
{
  "error": "word translation limit exceeded: text too long (max 12 words for free plan)"
}
```
or
```json
{
  "error": "paragraph translation limit exceeded: 20/20 used today"
}
```

- `500 Internal Server Error`: Translation service error

**Usage Limits:**

| Plan | Word Limit | Paragraph Limit |
|------|-----------|----------------|
| Free | 12 words per translation | 20 paragraphs per day |
| Premium | Unlimited | Unlimited |

---

### 3. Get Current User

**GET** `/api/auth/me`

Get current authenticated user info with usage statistics.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "plan": "free",
  "usage": {
    "used": 5,
    "limit": 20
  }
}
```

**Fields:**
- `user_id`: Supabase user UUID
- `email`: User email from JWT
- `plan`: Current subscription plan ("free" or "premium")
- `usage.used`: Paragraphs translated today
- `usage.limit`: Daily paragraph limit (20 for free, -1 for unlimited)

---

### 4. List Subscription Plans

**GET** `/api/v1/subscriptions/plans`

Get all available subscription plans.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "plans": [
    {
      "id": "premium",
      "name": "Premium",
      "description": "Unlimited translations, no ads",
      "periodicity": "MONTHLY",
      "features": {
        "maxBooks": 50,
        "paragraphsPerDay": -1,
        "wordsPerTranslation": -1,
        "hasAds": false
      },
      "displayPriceHint": "from 499 RUB/month",
      "provider": "lava"
    }
  ]
}
```

**Plan Features:**
- `maxBooks`: Maximum number of books (free: 5, premium: 50)
- `paragraphsPerDay`: Daily paragraph translation limit (-1 = unlimited)
- `wordsPerTranslation`: Words per translation limit (-1 = unlimited)
- `hasAds`: Whether plan shows ads (true for free)

---

### 5. Create Subscription

**POST** `/api/v1/subscriptions`

Create a new subscription and get payment URL.

**Authentication:** Required

**Request Body:**
```json
{
  "plan_id": "premium",
  "currency": "RUB",
  "email": "user@example.com",
  "provider": "lava",
  "payment_method": "card",
  "buyer_language": "ru"
}
```

**Field Validation:**
- `plan_id`: required, must be valid plan ID
- `currency`: required, must be "RUB", "USD", or "EUR"
- `email`: required, valid email format
- `provider`: optional, default: "lava"
- `payment_method`: optional (provider-specific)
- `buyer_language`: optional (for payment page localization)

**Response (201 Created):**
```json
{
  "subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentUrl": "https://pay.lava.top/invoice/...",
  "status": "pending"
}
```

**Next Steps:**
1. Redirect user to `paymentUrl` to complete payment
2. User completes payment on Lava payment page
3. Lava sends webhook to backend
4. Backend updates subscription status to "active"
5. Poll `/api/v1/subscriptions/me` or listen to Supabase Realtime for status updates

**Errors:**

- `400 Bad Request`: Invalid request
```json
{
  "error": "invalid currency"
}
```

- `404 Not Found`: Plan not found
```json
{
  "error": "plan not found"
}
```

- `409 Conflict`: User already has active subscription
```json
{
  "error": "user already has an active subscription"
}
```

---

### 6. Get User Subscription

**GET** `/api/v1/subscriptions/me`

Get current user's subscription details.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid",
  "email": "user@example.com",
  "planId": "premium",
  "status": "active",
  "provider": "lava",
  "providerSubId": "lava-contract-123",
  "providerInvoiceId": "lava-invoice-456",
  "startDate": "2025-01-27T10:00:00Z",
  "endDate": null,
  "trialEndsAt": null,
  "cancelledAt": null,
  "createdAt": "2025-01-27T10:00:00Z",
  "updatedAt": "2025-01-27T10:00:00Z"
}
```

**Status Values:**
- `pending`: Waiting for payment
- `active`: Active paid subscription
- `cancelled`: Cancelled by user
- `expired`: Subscription expired
- `failed`: Payment failed

**Errors:**

- `404 Not Found`: No subscription found
```json
{
  "error": "subscription not found"
}
```

---

### 7. Cancel Subscription

**DELETE** `/api/v1/subscriptions/me`

Cancel current user's active subscription.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "subscription cancelled successfully"
}
```

**Errors:**

- `404 Not Found`: No subscription found
```json
{
  "error": "subscription not found"
}
```

- `400 Bad Request`: Subscription not active
```json
{
  "error": "subscription is not active"
}
```

---

### 8. Admin Cancel Subscription

**DELETE** `/api/v1/admin/subscriptions/cancel?contractId=xxx&email=user@example.com`

Admin endpoint to cancel subscription by contract ID and email.

**Authentication:** Required (admin only - TODO: add admin middleware)

**Query Parameters:**
- `contractId`: Provider contract ID (required)
- `email`: User email (required)

**Response (200 OK):**
```json
{
  "message": "subscription cancelled successfully"
}
```

**Errors:**

- `400 Bad Request`: Missing parameters
```json
{
  "error": "contractId is required"
}
```

---

## Data Models

### User Plan Features

```typescript
interface PlanFeatures {
  free: {
    maxBooks: 5
    paragraphsPerDay: 20
    wordsPerTranslation: 12
    hasAds: true
  }
  premium: {
    maxBooks: 50
    paragraphsPerDay: -1  // unlimited
    wordsPerTranslation: -1  // unlimited
    hasAds: false
  }
}
```

### Subscription Status Flow

```
pending (payment created)
   ↓
active (payment confirmed via webhook)
   ↓
cancelled (user cancelled) / expired (auto-renewal failed)
```

---

## Error Codes

| HTTP Status | Meaning |
|------------|---------|
| 200 | Success |
| 201 | Created (subscription) |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid JWT) |
| 402 | Payment Required (usage limit exceeded) |
| 404 | Not Found (plan/subscription not found) |
| 409 | Conflict (duplicate subscription) |
| 500 | Internal Server Error |

---

## Usage Examples

### Complete Flow: Sign Up → Subscribe → Translate

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://aficcialnnzezvartjph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaWNjaWFsbm56ZXp2YXJ0anBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjg4NTYsImV4cCI6MjA3NjgwNDg1Nn0.qxJJ2TKtp0b2-QGojdT9rJw8QrW02of-DHuqLGH9cb8'
)

const API_URL = 'http://localhost:8080'

// 1. Sign up
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
})

// 2. Sign in
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})

const token = signInData.session.access_token

// 3. Get current user info
const userResponse = await fetch(`${API_URL}/api/auth/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const userData = await userResponse.json()
console.log('User:', userData)
// { user_id: "...", email: "...", plan: "free", usage: { used: 0, limit: 20 } }

// 4. Translate text (free plan - limited)
const translateResponse = await fetch(`${API_URL}/api/translate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Hello world',
    type: 'paragraph',
    sourceLang: 'en',
    targetLang: 'ru'
  })
})
const translation = await translateResponse.json()
console.log('Translation:', translation)
// { translatedText: "Привет мир" }

// 5. Get available plans
const plansResponse = await fetch(`${API_URL}/api/v1/subscriptions/plans`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const plansData = await plansResponse.json()
console.log('Plans:', plansData.plans)

// 6. Subscribe to premium
const subscribeResponse = await fetch(`${API_URL}/api/v1/subscriptions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_id: 'premium',
    currency: 'RUB',
    email: 'user@example.com',
    buyer_language: 'ru'
  })
})
const subscribeData = await subscribeResponse.json()
console.log('Subscription:', subscribeData)
// { subscriptionId: "...", paymentUrl: "https://pay.lava.top/...", status: "pending" }

// 7. Redirect user to payment
window.location.href = subscribeData.paymentUrl

// 8. After payment, check subscription status
const subResponse = await fetch(`${API_URL}/api/v1/subscriptions/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const subData = await subResponse.json()
console.log('Subscription status:', subData.status)
// "active"

// 9. Now translate without limits
const unlimitedTranslate = await fetch(`${API_URL}/api/translate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Very long paragraph with more than 12 words...',
    type: 'paragraph',
    sourceLang: 'en',
    targetLang: 'ru'
  })
})
// Success! No limits for premium users
```

---

## Webhooks (Backend Only)

These endpoints are called by payment providers and should NOT be called from frontend.

**POST** `/webhooks/lava/payment` - Lava payment result webhook
**POST** `/webhooks/lava/recurring` - Lava recurring payment webhook

**Security:** IP whitelist (only Lava IPs allowed in production, disabled in development mode)

---

## Notes

### Free Plan Limitations

When user hits free plan limits:

1. **Word translation**: Text longer than 12 words will be rejected
   - Error: `402 Payment Required`
   - Message: "word translation limit exceeded: text too long (max 12 words for free plan)"

2. **Paragraph translation**: After 20 paragraphs per day
   - Error: `402 Payment Required`
   - Message: "paragraph translation limit exceeded: 20/20 used today"

3. **Books**: Maximum 5 books stored (enforced on frontend)

4. **Ads**: Free users see banner ads (frontend implementation)

### Premium Plan Benefits

- ✅ Unlimited word translations
- ✅ Unlimited paragraph translations per day
- ✅ Store up to 50 books
- ✅ No ads

### Testing

Use development environment with `ENVIRONMENT=development` in `.env` to:
- Disable webhook IP whitelist (allows ngrok testing)
- Enable verbose logging

---

## Support

For issues or questions, check project documentation:
- [PROGRESS.md](./PROGRESS.md) - Development progress
- [MVP-PLAN.md](./MVP-PLAN.md) - Product roadmap
- [PAYMENT_SYSTEM_ARCHITECTURE.md](./PAYMENT_SYSTEM_ARCHITECTURE.md) - Payment system details