# AudioLearn Frontend Integration - Progress Tracker

**Last Updated:** 2025-10-29
**Current Focus:** Integrating payment system and auth with frontend

---

## 🎯 Overall Strategy

### Scope for MVP:
- ✅ **Backend:** Payment system (Lava), subscriptions, translation API with limits - DONE
- 🔄 **Frontend:** Shared services + Web UI - IN PROGRESS
- 🔮 **Mobile:** Redirect to web for payments (Phase 2)

### Mobile Payment Strategy:
Instead of implementing native payments (IAP), we'll use a simpler approach:
- Mobile app shows "Upgrade to Premium" button
- Button opens web version in browser: `https://audiolearn.com/subscription/plans`
- User completes payment in web
- Mobile app polls `GET /api/v1/subscriptions/me` to detect active subscription
- **Benefits:** Avoid 30% Apple/Google fees, single payment flow, faster MVP

---

## 📦 Phase 1: Supabase & Auth Infrastructure (Shared)

### Files to Create:
- [ ] `shared/config/supabase.ts` - Supabase client setup
- [ ] `shared/services/auth.ts` - Auth service (signUp, signIn, signOut, getSession)
- [ ] `shared/services/api-client.ts` - HTTP client with JWT auto-inject
- [ ] `shared/types/auth.ts` - Auth types (User, Session, AuthError)
- [ ] `shared/utils/storage.ts` - Abstract storage interface (localStorage/AsyncStorage)

### Features:
- Supabase client with credentials from API.md
- Auth methods: signUp(), signIn(), signOut(), getSession(), onAuthStateChange()
- Automatic token refresh
- API client that auto-adds `Authorization: Bearer <token>` header
- Error handling for 401 (unauthorized) and 402 (payment required)

### Dependencies:
```bash
cd shared
npm install @supabase/supabase-js
```

---

## 📦 Phase 2: Core Services (Shared)

### 2.1 User Service
**Files:**
- [ ] `shared/services/user.ts`
- [ ] `shared/types/user.ts`

**API Integration:**
- `getUserProfile()` → GET `/api/auth/me`
- Returns: `{ user_id, email, plan, usage: { used, limit } }`

**Types:**
```typescript
interface UserProfile {
  user_id: string;
  email: string;
  plan: 'free' | 'premium';
  usage: {
    used: number;
    limit: number; // -1 for unlimited
  };
}
```

### 2.2 Subscription Service
**Files:**
- [ ] `shared/services/subscription.ts`
- [ ] `shared/types/subscription.ts`

**API Integration:**
- `getPlans()` → GET `/api/v1/subscriptions/plans`
- `createSubscription(planId, currency, email)` → POST `/api/v1/subscriptions`
- `getUserSubscription()` → GET `/api/v1/subscriptions/me`
- `cancelSubscription()` → DELETE `/api/v1/subscriptions/me`

**Types:**
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  periodicity: string;
  features: PlanFeatures;
  displayPriceHint: string;
  provider: string;
}

interface PlanFeatures {
  maxBooks: number;
  paragraphsPerDay: number; // -1 = unlimited
  wordsPerTranslation: number; // -1 = unlimited
  hasAds: boolean;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'failed';
  provider: string;
  providerSubId: string;
  startDate: string;
  endDate: string | null;
  cancelledAt: string | null;
}

interface CreateSubscriptionResponse {
  subscriptionId: string;
  paymentUrl: string;
  status: string;
}
```

### 2.3 Update Translation Service
**Files:**
- [ ] `shared/services/translation.ts` (update existing)
- [ ] `shared/types/translation.ts`

**Changes:**
- Add `type: 'word' | 'paragraph'` parameter
- Handle 402 error (limits exceeded)
- Throw specific error types: `TranslationLimitError`, `TranslationError`

**Updated API:**
```typescript
interface TranslateRequest {
  text: string;
  type: 'word' | 'paragraph';
  sourceLang: string;
  targetLang: string;
}

class TranslationLimitError extends Error {
  constructor(
    public message: string,
    public used: number,
    public limit: number
  ) {
    super(message);
  }
}
```

### 2.4 Update API Config
**Files:**
- [ ] `shared/config/api.ts` (update existing)

**Changes:**
- Add Supabase config (URL, anon key)
- Add auth endpoints: `/api/auth/me`
- Add subscription endpoints: `/api/v1/subscriptions/*`
- Update translation endpoint to match new backend

---

## 🌐 Phase 3: Web Auth UI

### Files to Create:
- [ ] `web/app/auth/sign-in/page.tsx`
- [ ] `web/app/auth/sign-up/page.tsx`
- [ ] `web/components/AuthForm.tsx`
- [ ] `web/components/AuthLayout.tsx`

### Features:
- Sign in form (email, password)
- Sign up form (email, password, confirm password)
- Form validation
- Error handling (invalid credentials, email already exists, etc.)
- Loading states
- Redirect to `/` after successful auth
- "Forgot password?" link (Supabase reset password)

### Styling:
- Use Tailwind CSS (already configured)
- Clean, modern design
- Mobile-responsive

---

## 🌐 Phase 4: Web Profile & Subscription UI

### 4.1 Profile Page
**Files:**
- [ ] `web/app/profile/page.tsx`
- [ ] `web/components/UsageWidget.tsx`
- [ ] `web/components/PlanBadge.tsx`

**Features:**
- Show user email
- Current plan badge (Free / Premium)
- Usage stats: "X/20 paragraphs used today" or "Unlimited"
- "Upgrade to Premium" button (if free)
- "Manage Subscription" button (if premium)
- Sign out button

### 4.2 Subscription Plans Page
**Files:**
- [ ] `web/app/subscription/plans/page.tsx`
- [ ] `web/components/PlanCard.tsx`
- [ ] `web/components/FeatureComparison.tsx`

**Features:**
- Display all available plans (Free vs Premium)
- Feature comparison table
- "Subscribe" button → creates subscription → redirects to Lava payment page
- Highlight current plan
- Loading state while creating subscription

### 4.3 Subscription Success Page
**Files:**
- [ ] `web/app/subscription/success/page.tsx`

**Features:**
- Thank you message
- Poll subscription status until active (GET `/api/v1/subscriptions/me`)
- Show loading spinner while polling
- Redirect to profile after activation
- Handle failure case (payment failed)

### 4.4 Paywall Modal
**Files:**
- [ ] `web/components/PaywallModal.tsx`

**Features:**
- Show when translation returns 402 error
- Display limit exceeded message
- Show current usage stats
- "Upgrade to Premium" button → redirect to `/subscription/plans`
- Close button (cancel translation)

---

## 🔧 Phase 5: State Management (Web)

### Files to Create:
- [ ] `web/contexts/AuthContext.tsx`
- [ ] `web/contexts/SubscriptionContext.tsx`
- [ ] `web/hooks/useAuth.ts`
- [ ] `web/hooks/useSubscription.ts`

### AuthContext Features:
- Global auth state: `{ user, session, loading, error }`
- Actions: `signIn()`, `signUp()`, `signOut()`
- Auto-restore session on page load (from Supabase)
- Persist session in localStorage
- Hook: `useAuth()` for components

### SubscriptionContext Features:
- Global subscription state: `{ subscription, plans, loading }`
- Actions: `loadPlans()`, `subscribe()`, `cancel()`, `refresh()`
- Auto-load user subscription on mount
- Hook: `useSubscription()` for components

### Implementation:
- Wrap entire app in `<AuthProvider>` and `<SubscriptionProvider>` in `web/app/layout.tsx`
- Use React Context API (no external state library needed for MVP)

---

## 🛡️ Phase 6: Protected Routes & Error Handling

### 6.1 Protected Routes
**Files:**
- [ ] `web/middleware.ts` - Next.js middleware for auth check

**Features:**
- Check if user has valid session
- Protected routes: `/profile`, `/subscription/*`, `/player/*`
- Redirect to `/auth/sign-in` if not authenticated
- Redirect from `/auth/*` to `/` if already authenticated

### 6.2 Error Handling
**Files:**
- [ ] `web/components/ErrorBoundary.tsx`
- [ ] `shared/utils/error-handler.ts`

**Features:**
- Centralized error handling
- 401 → auto-logout + redirect to login
- 402 → show paywall modal
- 500 → show error message
- Network errors → show retry button

### 6.3 Toast Notifications
**Files:**
- [ ] `web/components/Toast.tsx`
- [ ] `web/hooks/useToast.ts`

**Features:**
- Success: "Subscription activated!"
- Error: "Translation limit exceeded"
- Info: "Processing payment..."
- Auto-dismiss after 3 seconds

---

## 🧪 Phase 7: Testing & Polish

### 7.1 Environment Variables
**Files:**
- [ ] `web/.env.local` (create from example)

**Required vars:**
```
NEXT_PUBLIC_SUPABASE_URL=https://aficcialnnzezvartjph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 7.2 Update Existing Components
**Files to Update:**
- [ ] `web/app/page.tsx` - Add auth check, show user profile link
- [ ] `web/app/player/[id]/page.tsx` - Use updated translation service
- [ ] `web/components/ClickableSubtitles.tsx` - Handle 402 errors

### 7.3 Manual Testing Checklist
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] View profile (shows free plan, usage stats)
- [ ] Translate word (free plan - should work)
- [ ] Translate paragraph 20 times (free plan - should hit limit on 21st)
- [ ] See paywall modal when limit exceeded
- [ ] Click "Upgrade" → redirects to plans page
- [ ] Subscribe to premium → redirects to Lava
- [ ] Complete payment → success page → polls until active
- [ ] Return to profile → shows premium plan
- [ ] Translate paragraph (premium - unlimited, should work)
- [ ] Cancel subscription
- [ ] Sign out

### 7.4 Code Quality
- [ ] Run TypeScript type check: `npm run build`
- [ ] Format code: `npx prettier --write .`
- [ ] Check for console errors
- [ ] Remove debug logs

---

## 📱 Phase 8: Mobile Integration (Future)

**Note:** We'll do this after web is working!

### Strategy:
Mobile app will redirect to web for payment:

1. **Update mobile UI:**
   - Add "Upgrade to Premium" button in profile
   - Button opens: `https://audiolearn.com/subscription/plans?utm_source=mobile&user_id=<user_id>`

2. **Use expo-web-browser:**
   ```typescript
   import * as WebBrowser from 'expo-web-browser';

   const handleUpgrade = async () => {
     await WebBrowser.openBrowserAsync(
       'https://audiolearn.com/subscription/plans'
     );
     // After user returns, poll subscription status
     await pollSubscriptionStatus();
   };
   ```

3. **Poll subscription status:**
   ```typescript
   const pollSubscriptionStatus = async () => {
     const interval = setInterval(async () => {
       const sub = await subscriptionService.getUserSubscription();
       if (sub.status === 'active') {
         clearInterval(interval);
         // Show success message
       }
     }, 2000); // poll every 2 seconds
   };
   ```

4. **Update mobile contexts:**
   - Reuse `shared` services (auth, user, subscription)
   - Create `mobile/contexts/AuthContext.tsx` (similar to web)
   - Create `mobile/contexts/SubscriptionContext.tsx` (similar to web)

5. **Handle limits in mobile:**
   - Catch 402 errors in translation
   - Show paywall modal (same as web)
   - "Upgrade" button opens web browser

---

## 📊 Progress Summary

### ✅ Completed:
- [x] Backend API (auth, translation, subscriptions, webhooks)
- [x] Database schema (Supabase)
- [x] Lava payment integration
- [x] API documentation (API.md)
- [x] **Phase 1: Supabase & Auth Infrastructure (Shared)** - DONE
  - Created `shared/config/supabase.ts` with factory function
  - Created `shared/services/auth.ts` with DI pattern
  - Created `shared/services/api-client.ts` with JWT auto-inject
  - Created `shared/types/auth.ts`, `user.ts`, `subscription.ts`, `translation.ts`
- [x] **Phase 2: Core Services (Shared)** - DONE
  - Created `shared/services/user.ts` with getUserProfile()
  - Created `shared/services/subscription.ts` with full CRUD
  - Updated `shared/services/translation.ts` with type parameter
  - Created `shared/services/factory.ts` for DI (Go-style architecture)
- [x] **Phase 3: Web Auth UI** - DONE
  - Created `web/app/auth/sign-in/page.tsx`
  - Created `web/app/auth/sign-up/page.tsx` with email confirmation
  - Created `web/contexts/ServicesContext.tsx` for dependency injection
  - Created `web/app/providers.tsx` for service initialization
  - Protected routes: redirect to sign-in if not authenticated
  - Auto-redirect from auth pages if already logged in
- [x] **Phase 4.1: Profile Page** - DONE
  - Created `web/app/profile/page.tsx`
  - Shows user email, plan (FREE/PREMIUM), usage stats
  - Shows subscription details if exists (status, dates)
  - "Back to Home" and "Upgrade to Premium" buttons
  - Added "Profile" link to home page header

### 🔄 In Progress:
- [ ] **Phase 4.2: Subscription Plans Page**
  - Need to create `/plans` page
  - Display available plans (Free vs Premium)
  - Feature comparison table
  - Subscribe button → create subscription → redirect to Lava
- [ ] Phase 4.3: Subscription Success Page
- [ ] Phase 4.4: Paywall Modal
- [ ] Phase 5: State Management (already using Context, might skip)
- [ ] Phase 6: Protected Routes & Error Handling
- [ ] Phase 7: Testing & Polish

### 🔮 Planned:
- [ ] Mobile payment redirect (Phase 8)
- [ ] Production deployment
- [ ] Monitoring & analytics

---

## 🚀 Next Steps

**Current Priority:** Phase 4.2 - Subscription Plans Page

Next session tasks:
1. Create `web/app/plans/page.tsx`
2. Fetch plans from API: `subscriptionService.getPlans()`
3. Display plan cards (Free vs Premium)
4. Feature comparison table
5. Subscribe button → `subscriptionService.createSubscription()` → redirect to Lava payment URL
6. Handle payment redirect & success page

**After Phase 4.2:** Create subscription success page with status polling

---

## 📝 Notes

- Backend is running on `http://localhost:8080`
- Supabase URL: `https://aficcialnnzezvartjph.supabase.co`
- Free plan limits: 12 words/translation, 20 paragraphs/day
- Premium plan: Unlimited translations
- Payment provider: Lava (Russian market)
- Currency: RUB (Russian Ruble)

---

**Ready to start coding!** 🎉