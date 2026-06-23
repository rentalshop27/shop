# Graph Report - Precious-Shop-Test  (2026-06-23)

## Corpus Check
- 82 files · ~90,541 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1057 nodes · 2264 edges · 48 communities (42 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `11aefd70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 38 edges
2. `Customer` - 33 edges
3. `StockItem` - 30 edges
4. `RentalStatus` - 22 edges
5. `StockItem` - 22 edges
6. `getErrorMessage()` - 20 edges
7. `StrategyHandler` - 15 edges
8. `PrecacheController` - 14 edges
9. `handleSaveCustomer()` - 14 edges
10. `normalizeThaiPhone()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `handleCreateRentals()` --calls--> `canCreateRentalForCustomer()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts
- `handleSubmit()` --calls--> `canCreateRentalForCustomer()`  [EXTRACTED]
  src/features/rentals/RentalsPage.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts
- `handleSaveCustomer()` --calls--> `validateThaiPhone()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts
- `handleSaveCustomer()` --calls--> `findPhoneDuplicate()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts
- `handleSaveCustomer()` --calls--> `normalizeThaiPhone()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts

## Communities (48 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (92): activeCustomers, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail], [authUserId, setAuthUserId], authUserIdRef, [availableShops, setAvailableShops] (+84 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (71): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createFunctionError(), createGoogleDrivePreviewUrl(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteGoogleDriveCustomerDocuments() (+63 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (61): buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, toUtcDay(), [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview] (+53 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (68): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+60 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (56): InventoryPageContainer(), [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], stockItems, user, StockItemStatus, cleanupUnusedImages(), countRemoteRentalsForStockSku() (+48 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (51): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+43 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (42): disconnectedStatus(), GoogleIntegrationRow, GoogleSheetsReportStatus, loadGoogleSheetsReportStatus(), syncGoogleSheetsReport(), SyncResponse, invoke, query (+34 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (38): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (35): buildReportValues(), calculateNetRevenue(), countBy(), createSpreadsheet(), CustomerRow, ensureReportSheets(), getOrCreateReportSpreadsheet(), getSpreadsheet() (+27 more)

### Community 9 - "Community 9"
Cohesion: 0.1
Nodes (33): baseClient, headers, response, url, headers, response, customerId, files (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (27): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (22): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): buildDressReportsData(), buildGeneralStoreMetrics(), buildReportsDateRange(), DateRange, DateRangeMode, DressReportItem, GeneralStoreMetrics, getDaysBetween() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (17): ShopSummary, buildGoogleOAuthStartUrl(), getGoogleOAuthCallbackUrl(), getGoogleOAuthClientId(), getGoogleOAuthReturnUrl(), getGoogleOAuthSetupState(), readEnv(), trimTrailingSlash() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (5): executeQuotaErrorCallbacks(), PrecacheStrategy, StrategyHandler, timeout(), toRequest()

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (8): getFriendlyURL(), getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (17): authUrl, url, base64UrlDecode(), base64UrlEncode(), buildGoogleConsentUrl(), buildState(), createRedirectResponse(), createSignedState() (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (19): updateShopSettings(), archiveSelectedCustomer(), closeStockForm(), closeStockPreview(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor() (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.26
Nodes (15): findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalForStockSku(), hasRentalConflict(), isDateOverlap(), isOpenRental(), isOpenRentalStatus(), openRentalStatuses (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (14): [activeStatusDropdownId, setActiveStatusDropdownId], baseSku, count, fileInputRef, filteredItems, InventoryPageProps, InventorySummary, match (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.23
Nodes (13): getInventoryDisplayStatus(), item, itemRepair, itemWash, makeRental(), makeStockItem(), rentals, rentalsActive (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (14): code:bash (KEEPALIVE_TOKEN=replace-with-a-long-random-token), code:bash (SUPABASE_KEEPALIVE_TOKEN=replace-with-the-same-token), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy health --no-verify-jwt), code:text (https://<project-ref>.supabase.co/functions/v1/health), code:text (x-keepalive-token: <KEEPALIVE_TOKEN>), code:bash (supabase functions serve --env-file supabase/.env), Deploy (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.3
Nodes (9): customer, makeRental(), metrics, stockItem, demoRentals, demoStockItemsForRentals, RentalOrder, RentalStatus (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.2
Nodes (10): depositsCard, draft, field, item, pricedCard, productNameInput, setsCard, totalCard (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (8): canReuseExistingToken, error, refreshToken, supabase, url, appendResult(), fetchGoogleUserInfo(), resolveGoogleRefreshToken()

### Community 27 - "Community 27"
Cohesion: 0.35
Nodes (9): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalRow, toRentalInsert(), updateRemoteRentalStatus() (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.2
Nodes (9): หมายเหตุ, 1. สร้าง Google Cloud Project, 2. ตั้งค่า OAuth consent screen, 3. สร้าง OAuth client, 4. ใส่ค่าในแอป, 5. ค่า secret สำหรับ Edge Functions, code:bash (VITE_SUPABASE_URL=https://your-project-ref.supabase.co), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog) (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (6): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, user

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (7): customer, eq, filters, order, select, stockItem, supabase

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (4): expectedToken, getRequiredEnv(), pingSupabaseDatabase(), responseHeaders

### Community 34 - "Community 34"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (3): {
  loadAccessibleShops,
  loadCustomers,
  loadStockItems,
  loadShopSettings,
  loadRentals,
  loadAuditLogs,
  authStateChange,
  supabase,
}, {
  loadAccessibleShops,
  loadCustomers,
  loadStockItems,
  loadShopSettings,
  loadRentals,
  loadAuditLogs,
  supabase,
}, user

### Community 37 - "Community 37"
Cohesion: 0.5
Nodes (4): loadCustomerDocumentPreview(), ensureCustomerDocumentPreview(), ensureExistingDocumentPreview(), loadDocumentPreview()

## Knowledge Gaps
- **297 isolated node(s):** `url`, `baseClient`, `response`, `headers`, `response` (+292 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `uploadGoogleDriveCustomerDocuments()` connect `Community 1` to `Community 14`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `createGoogleDrivePreviewUrl()` connect `Community 1` to `Community 37`, `Community 14`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `deleteGoogleDriveCustomerDocuments()` connect `Community 1` to `Community 14`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `url`, `baseClient`, `response` to the rest of the system?**
  _297 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._