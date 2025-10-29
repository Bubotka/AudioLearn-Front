у # Payment System Architecture

## Overview

Гибкая архитектура платежной системы для AudioLearn с возможностью легкой замены платежных провайдеров (Lava → 2Checkout → другие).

**Architecture Type:** Modular Monolith
**Database:** Supabase (PostgreSQL + Auth + Storage)
**Deployment:** Single repository, single service

## Goals

- ✅ Поддержка подписок (subscriptions)
- ✅ Легкая замена платежных провайдеров без изменения бизнес-логики
- ✅ Webhook обработка для подтверждения платежей
- ✅ Поддержка Web, iOS (Apple IAP), Android (Google Play)
- ✅ Transaction logging для аудита
- 🔮 Future: Pay-as-you-go / Credits (после MVP)

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│          HTTP Layer (Gin Handlers)              │
│   - /api/subscriptions/*                        │
│   - /webhooks/:provider                         │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│       Subscription Service (Business Logic)     │
│   - CreateSubscription()                        │
│   - CancelSubscription()                        │
│   - GetUserSubscription()                       │
│   - HandleWebhook()                             │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──────┐ ┌──▼────────┐ ┌─▼──────────┐
│Payment   │ │Repository │ │ Validator  │
│Provider  │ │ (DB)      │ │            │
│Interface │ │           │ │            │
└───┬──────┘ └───────────┘ └────────────┘
    │
    ├─────┬─────────┬──────────┬───────────┐
    │     │         │          │           │
┌───▼──┐ ┌▼──────┐ ┌▼───────┐ ┌▼────────┐ │
│ Lava │ │2Check │ │ Apple  │ │ Google  │ │
│      │ │ out   │ │  IAP   │ │  Play   │ │
└──────┘ └───────┘ └────────┘ └─────────┘ │
```

## Directory Structure

```
internal/
├── payment/
│   ├── domain/
│   │   ├── models.go              # Domain entities
│   │   ├── subscription.go        # Subscription entity & enums
│   │   ├── transaction.go         # Transaction entity
│   │   └── errors.go              # Domain errors
│   │
│   ├── service/
│   │   ├── subscription_service.go  # Main business logic
│   │   └── webhook_service.go       # Webhook processing
│   │
│   ├── provider/
│   │   ├── provider.go              # PaymentProvider interface
│   │   │
│   │   ├── lava/
│   │   │   ├── lava.go              # Lava adapter
│   │   │   ├── client.go            # HTTP client for Lava API
│   │   │   └── webhooks.go          # Lava webhook signature verification
│   │   │
│   │   ├── twocheckout/
│   │   │   └── twocheckout.go       # 2Checkout adapter (future)
│   │   │
│   │   ├── apple/
│   │   │   └── appstore.go          # Apple IAP adapter (future)
│   │   │
│   │   └── google/
│   │       └── playstore.go         # Google Play adapter (future)
│   │
│   └── repository/
│       ├── repository.go            # Repository interface
│       ├── postgres/
│       │   └── subscription_repo.go # PostgreSQL implementation
│       └── migrations/
│           └── 001_create_subscriptions.sql
│
└── handlers/
    ├── subscription_handler.go      # REST API handlers
    └── webhook_handler.go           # Webhook handlers
```

## Core Components

### 1. Domain Models

#### Subscription
```go
type Subscription struct {
    ID              string
    UserID          string
    PlanID          string
    Status          SubscriptionStatus
    Provider        PaymentProvider
    ProviderSubID   string    // ID подписки у провайдера
    StartDate       time.Time
    EndDate         *time.Time
    TrialEndsAt     *time.Time
    CancelledAt     *time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

type SubscriptionStatus string
const (
    StatusTrial    SubscriptionStatus = "trial"
    StatusActive   SubscriptionStatus = "active"
    StatusCanceled SubscriptionStatus = "canceled"
    StatusExpired  SubscriptionStatus = "expired"
    StatusPaused   SubscriptionStatus = "paused"
)

type PaymentProvider string
const (
    ProviderLava       PaymentProvider = "lava"
    Provider2Checkout  PaymentProvider = "2checkout"
    ProviderApple      PaymentProvider = "apple"
    ProviderGoogle     PaymentProvider = "google"
)
```

#### SubscriptionPlan
```go
type SubscriptionPlan struct {
    ID          string
    Name        string  // "Free", "Premium", "Pro"
    PriceUSD    float64
    BillingCycle string // "monthly", "yearly"
    Features    map[string]interface{} // flexible features
    Active      bool
}
```

#### Transaction
```go
type Transaction struct {
    ID              string
    SubscriptionID  string
    UserID          string
    Provider        PaymentProvider
    ProviderTxnID   string
    Amount          float64
    Currency        string
    Status          TransactionStatus
    Type            TransactionType  // "charge", "refund"
    Metadata        map[string]string
    CreatedAt       time.Time
}

type TransactionStatus string
const (
    TxnPending   TransactionStatus = "pending"
    TxnCompleted TransactionStatus = "completed"
    TxnFailed    TransactionStatus = "failed"
    TxnRefunded  TransactionStatus = "refunded"
)
```

### 2. PaymentProvider Interface

```go
type PaymentProvider interface {
    // CreateSubscription creates a new subscription with the provider
    CreateSubscription(ctx context.Context, req CreateSubscriptionRequest) (*CreateSubscriptionResponse, error)

    // CancelSubscription cancels an existing subscription
    CancelSubscription(ctx context.Context, providerSubID string) error

    // GetSubscription retrieves subscription details from provider
    GetSubscription(ctx context.Context, providerSubID string) (*ProviderSubscription, error)

    // VerifyWebhook verifies webhook signature/authenticity
    VerifyWebhook(req *http.Request) error

    // ParseWebhook parses webhook payload into standard event
    ParseWebhook(req *http.Request) (*WebhookEvent, error)

    // Name returns provider name
    Name() string
}

type CreateSubscriptionRequest struct {
    UserID       string
    PlanID       string
    Email        string
    TrialDays    int
    SuccessURL   string
    CancelURL    string
}

type CreateSubscriptionResponse struct {
    ProviderSubID string
    CheckoutURL   string  // URL для редиректа пользователя
    Status        string
}

type WebhookEvent struct {
    Type              WebhookEventType
    ProviderSubID     string
    ProviderTxnID     string
    Status            string
    Amount            float64
    Currency          string
    Metadata          map[string]string
}

type WebhookEventType string
const (
    EventSubscriptionCreated   WebhookEventType = "subscription.created"
    EventSubscriptionActivated WebhookEventType = "subscription.activated"
    EventSubscriptionCanceled  WebhookEventType = "subscription.canceled"
    EventSubscriptionExpired   WebhookEventType = "subscription.expired"
    EventPaymentSucceeded      WebhookEventType = "payment.succeeded"
    EventPaymentFailed         WebhookEventType = "payment.failed"
)
```

### 3. Repository Interface

```go
type Repository interface {
    // Subscriptions
    CreateSubscription(ctx context.Context, sub *Subscription) error
    GetSubscription(ctx context.Context, id string) (*Subscription, error)
    GetUserSubscription(ctx context.Context, userID string) (*Subscription, error)
    UpdateSubscription(ctx context.Context, sub *Subscription) error

    // Plans
    GetPlan(ctx context.Context, planID string) (*SubscriptionPlan, error)
    ListActivePlans(ctx context.Context) ([]*SubscriptionPlan, error)

    // Transactions
    CreateTransaction(ctx context.Context, txn *Transaction) error
    GetTransactionByProviderID(ctx context.Context, providerTxnID string) (*Transaction, error)
}
```

### 4. SubscriptionService

```go
type SubscriptionService struct {
    repo      Repository
    providers map[PaymentProvider]Provider
}

func (s *SubscriptionService) CreateSubscription(
    ctx context.Context,
    userID string,
    planID string,
    provider PaymentProvider,
) (*CreateSubscriptionResponse, error)

func (s *SubscriptionService) CancelSubscription(
    ctx context.Context,
    userID string,
) error

func (s *SubscriptionService) GetUserSubscription(
    ctx context.Context,
    userID string,
) (*Subscription, error)

func (s *SubscriptionService) HandleWebhook(
    ctx context.Context,
    provider PaymentProvider,
    req *http.Request,
) error
```

## API Endpoints

### REST API

```
GET    /api/subscriptions/plans
       → List available subscription plans

POST   /api/subscriptions
       Body: {
         "plan_id": "premium",
         "provider": "lava"  // optional, default "lava"
       }
       → Create subscription, returns checkout URL

GET    /api/subscriptions/me
       → Get current user's subscription

DELETE /api/subscriptions/me
       → Cancel current subscription

GET    /api/subscriptions/:id
       → Get specific subscription (admin)
```

### Webhooks

```
POST   /webhooks/lava
       → Lava payment webhook

POST   /webhooks/2checkout
       → 2Checkout webhook (future)

POST   /webhooks/apple
       → Apple IAP webhook (future)

POST   /webhooks/google
       → Google Play webhook (future)
```

## Database Schema

### subscriptions table

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_sub_id VARCHAR(255) UNIQUE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    INDEX idx_user_id (user_id),
    INDEX idx_provider_sub_id (provider_sub_id),
    INDEX idx_status (status)
);
```

### subscription_plans table

```sql
CREATE TABLE subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    features JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO subscription_plans (id, name, price_usd, billing_cycle, features) VALUES
('free', 'Free', 0.00, 'monthly', '{"translations_per_day": 30, "books": 2}'),
('premium', 'Premium', 6.99, 'monthly', '{"translations_per_day": 300, "books": -1, "offline": true}');
```

### transactions table

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id),
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_txn_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    INDEX idx_subscription_id (subscription_id),
    INDEX idx_user_id (user_id),
    INDEX idx_provider_txn_id (provider_txn_id)
);
```

## Lava Integration Details

### Lava API Endpoints

Base URL: `https://api.lava.top/v1`

**Create Payment:**
```
POST /invoice/create
Headers:
  Authorization: Bearer {api_key}
Body:
{
  "sum": 6.99,
  "order_id": "sub_xxx",
  "hook_url": "https://audiolearn.com/webhooks/lava",
  "success_url": "https://audiolearn.com/success",
  "fail_url": "https://audiolearn.com/cancel",
  "expire": 300,
  "custom_fields": {
    "user_id": "user_123",
    "plan_id": "premium"
  }
}
```

**Webhook from Lava:**
```json
{
  "invoice_id": "xxx",
  "order_id": "sub_xxx",
  "status": "success",
  "pay_time": "2024-10-23T12:00:00Z",
  "amount": 6.99,
  "custom_fields": {...}
}
```

### Webhook Security

Lava подписывает webhooks через HMAC SHA256:
```
signature = HMAC_SHA256(secret_key, request_body)
```

Проверка:
```go
func (l *LavaProvider) VerifyWebhook(req *http.Request) error {
    signature := req.Header.Get("X-Lava-Signature")
    body, _ := io.ReadAll(req.Body)

    expectedSignature := hmac256(l.secretKey, body)
    if signature != expectedSignature {
        return errors.New("invalid webhook signature")
    }
    return nil
}
```

## Configuration

Добавить в `.env`:
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Lava
LAVA_API_KEY=your_lava_api_key
LAVA_SECRET_KEY=your_lava_secret_key

# App URLs
APP_URL=https://audiolearn.com
SUCCESS_URL=https://audiolearn.com/subscription/success
CANCEL_URL=https://audiolearn.com/subscription/cancel
```

Обновить `config/config.go`:
```go
type Config struct {
    // ... existing fields

    // Supabase
    SupabaseURL        string `env:"SUPABASE_URL,required"`
    SupabaseAnonKey    string `env:"SUPABASE_ANON_KEY,required"`
    SupabaseServiceKey string `env:"SUPABASE_SERVICE_KEY,required"`
    DatabaseURL        string `env:"DATABASE_URL,required"`

    // Lava
    LavaAPIKey     string `env:"LAVA_API_KEY"`
    LavaSecretKey  string `env:"LAVA_SECRET_KEY"`

    // App
    AppURL         string `env:"APP_URL,required"`
    SuccessURL     string `env:"SUCCESS_URL,required"`
    CancelURL      string `env:"CANCEL_URL,required"`
}
```

## Implementation Flow

### User subscribes:
1. User clicks "Subscribe to Premium"
2. Frontend → `POST /api/subscriptions` with `plan_id=premium`
3. Backend:
   - Creates Subscription record (status=pending)
   - Calls Lava API to create invoice
   - Returns checkout URL to frontend
4. Frontend redirects user to Lava checkout
5. User pays on Lava
6. Lava → Webhook to `/webhooks/lava`
7. Backend:
   - Verifies webhook signature
   - Updates subscription status=active
   - Creates transaction record
8. User redirected to success_url

### Subscription renewal (automatic):
1. Lava auto-charges user
2. Lava → Webhook `payment.succeeded`
3. Backend:
   - Extends subscription.end_date
   - Creates new transaction

### User cancels:
1. User clicks "Cancel subscription"
2. Frontend → `DELETE /api/subscriptions/me`
3. Backend:
   - Calls Lava API to cancel
   - Updates subscription.cancelled_at
   - Status remains "active" until end_date

## Testing Strategy

### Unit Tests
- Provider implementations
- Service business logic
- Webhook parsing

### Integration Tests
- Database operations
- Full subscription flow with mock provider

### Manual Testing
- Use Lava test mode
- Test webhook with `ngrok` for local dev

## Future Enhancements

### Phase 2: Multi-provider support
- Implement 2Checkout adapter
- Provider selection logic

### Phase 3: Mobile IAP
- Apple StoreKit integration
- Google Play Billing integration
- Receipt validation

### Phase 4: Advanced features
- Proration for plan changes
- Discount codes / coupons
- Annual billing
- Pay-as-you-go credits

## Migration Plan

### From Lava to 2Checkout (example):

1. Implement `twocheckout/twocheckout.go` following Provider interface
2. Update config with 2Checkout credentials
3. Add provider factory logic
4. New subscriptions use 2Checkout
5. Existing Lava subscriptions continue until renewal
6. Gradually migrate users

**No business logic changes required** - this is the power of abstraction!
