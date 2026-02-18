# Frontend State Management Analysis & Optimization

## Current Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Auth** | AuthContext + localStorage | user, isAuthenticated, loading, login, logout |
| **Theme** | ThemeContext + localStorage | theme (dark/light) |
| **Server state** | React Query | API data, caching, refetch |
| **Local UI state** | useState (per page) | selectedSchoolId, filters, modals |

---

## Issues Identified

### 1. **AuthContext: Login doesn't persist user to localStorage**

**Location:** `AuthContext.jsx` – `login()` sets `user` in state but never calls `localStorage.setItem('user', ...)`.

**Impact:** The `authService.login()` does persist to localStorage, so this works today. But AuthContext and authService duplicate logic and can drift. If authService changes, AuthContext may not stay in sync.

**Recommendation:** AuthContext should be the single source of truth. Either:
- Have AuthContext call `localStorage.setItem('user', ...)` after successful login, or
- Remove persistence from authService and centralize it in AuthContext.

---

### 2. **AuthContext: Stale user after API refresh fails**

**Location:** `AuthContext.jsx` – `initAuth()`.

**Behavior:** If `getCurrentUser()` fails with 404/network error (not 401), the stored user is kept. The user object can become stale (e.g. role or school changed).

**Recommendation:** Add a periodic refresh of user data, or invalidate user when critical API calls fail. Consider `staleTime`-style logic for user data.

---

### 3. **Inconsistent role checks across the app**

**Examples:**
- `user?.role === 'Admin'` (case-sensitive)
- `(user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'admin'`
- `['Admin', 'Principal'].includes(user?.role ?? '')`

**Impact:** API may return `role` or `Role` in different cases. Strict checks can fail for some users.

**Recommendation:** Use `getUserRole(user)` from `safeUtils.js` everywhere and compare with `.toLowerCase()`.

---

### 4. **School selection state duplicated on every page**

**Location:** 15+ pages (Assignments, Students, Classes, CATests, Reports, Parents, FeeStructures, etc.)

**Behavior:**
- Each page has `useState` for `selectedSchoolId`
- Each page fetches `school-switching` with `useQuery(['dashboard', 'school-switching'], ...)`
- Selection is lost on navigation
- No shared state when Admin switches school

**Recommendation:** Introduce a `SchoolContext` (or similar) that:
- Holds `selectedSchoolId` and `setSelectedSchoolId`
- Fetches school-switching once
- Persists selection in sessionStorage for the session
- Exposes `effectiveSchoolId` based on role

---

### 5. **School-switching fetched for roles that don't have access**

**Location:** `Parents.jsx` – `enabled: !isAdmin`

**Behavior:** For Parent role, `!isAdmin` is true, so the app fetches school-switching. The API is `[Authorize(Roles = "Admin,SuperAdmin,Principal,Teacher")]`, so Parent gets 403.

**Recommendation:** Restrict `enabled` to roles that can call the endpoint:
```js
enabled: ['Admin', 'Principal', 'Teacher', 'SuperAdmin'].includes(user?.role ?? '')
```

---

### 6. **AuthContext value object recreated every render**

**Location:** `AuthContext.jsx` – `const value = { user, loading, ... }`

**Impact:** New object reference each render causes all `useAuth()` consumers to re-render.

**Recommendation:** Memoize the value:
```js
const value = React.useMemo(() => ({
  user, loading, isAuthenticated, login, logout, updateUser
}), [user, loading, isAuthenticated])
```

---

### 7. **No invalidation of school-switching after switch**

**Behavior:** When Admin switches school via `switchSchool` API, the school-switching query cache is not invalidated. Other pages keep using the old `currentSchoolId` until they refetch.

**Recommendation:** After a successful `switchSchool` mutation, call:
```js
queryClient.invalidateQueries(['dashboard', 'school-switching'])
```
and update AuthContext/user if the API returns updated user data.

---

### 8. **ThemeContext value recreated every render**

**Location:** `ThemeContext.jsx`

**Recommendation:** Memoize the context value to avoid unnecessary re-renders.

---

## Optimization Priorities

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | Fix Parents.jsx school-switching `enabled` (403 for Parent) | Low | High |
| **P0** | Standardize role checks with `getUserRole()` | Medium | High |
| **P1** | Add SchoolContext for shared school selection | Medium | High |
| **P1** | Memoize AuthContext and ThemeContext values | Low | Medium |
| **P2** | Invalidate school-switching after switch mutation | Low | Medium |
| **P2** | Centralize auth persistence in AuthContext | Low | Medium |

---

## Quick Wins (Immediate Fixes) – DONE

1. **Parents.jsx:** Changed `enabled: !isAdmin` to `enabled: isPrincipal` (Parents page is Admin/Principal only; Parent role was triggering 403)
2. **CreatePayment, CreateSubject, CreateTeacher, CreateBook, CreateStudent, CreateClass:** Changed `enabled: !isAdmin` to `enabled: isPrincipal || isTeacher` for school-switching (avoids 403 for Parent/Student)
3. **Memoized context values** in AuthContext and ThemeContext with `useMemo` to reduce unnecessary re-renders
4. **Standardized role checks** in updated files: use `roleLower` and `isAdmin/isPrincipal/isTeacher` consistently
