# Graph Report - Precious-Shop-Test  (2026-06-20)

## Corpus Check
- 67 files · ~84,384 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 916 nodes · 2006 edges · 45 communities (39 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30abdaae`
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

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 38 edges
2. `Customer` - 33 edges
3. `StockItem` - 30 edges
4. `RentalStatus` - 22 edges
5. `StockItem` - 22 edges
6. `getErrorMessage()` - 18 edges
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

## Communities (45 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (91): activeCustomers, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail], [authUserId, setAuthUserId], authUserIdRef, [availableShops, setAvailableShops] (+83 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (68): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+60 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (51): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadAccessibleShops(), loadCustomers() (+43 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (52): buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, customer, makeRental(), metrics (+44 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (50): InventoryPageContainer(), [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], stockItems, user, cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem() (+42 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (46): buildDressReportsData(), buildGeneralStoreMetrics(), buildReportsDateRange(), DateRange, DateRangeMode, DressReportItem, GeneralStoreMetrics, getDaysBetween() (+38 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (51): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+43 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (38): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (27): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (24): error, supabase, url, authUrl, url, appendResult(), base64UrlDecode(), base64UrlEncode() (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (17): ShopSummary, buildGoogleOAuthStartUrl(), getGoogleOAuthCallbackUrl(), getGoogleOAuthClientId(), getGoogleOAuthReturnUrl(), getGoogleOAuthSetupState(), readEnv(), trimTrailingSlash() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (19): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.26
Nodes (15): findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalForStockSku(), hasRentalConflict(), isDateOverlap(), isOpenRental(), isOpenRentalStatus(), openRentalStatuses (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (19): updateShopSettings(), archiveSelectedCustomer(), closeStockForm(), closeStockPreview(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor() (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (14): [activeStatusDropdownId, setActiveStatusDropdownId], baseSku, count, fileInputRef, filteredItems, InventoryPageProps, InventorySummary, match (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.28
Nodes (4): PrecacheStrategy, StrategyHandler, timeout(), toRequest()

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (14): availableCostume, CreateRentalsHandler, customer, existingRental, heading, image, makeRental(), makeStockItem() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 19 - "Community 19"
Cohesion: 0.27
Nodes (12): getInventoryDisplayStatus(), item, itemRepair, itemWash, makeRental(), makeStockItem(), rentals, rentalsActive (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (7): StockItem, StockItemStatus, demoRentals, demoStockItemsForRentals, RentalOrder, StockItem, StockItemStatus

### Community 21 - "Community 21"
Cohesion: 0.35
Nodes (9): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalRow, toRentalInsert(), updateRemoteRentalStatus() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (4): getFriendlyURL(), getOrCreateDefaultRouter(), registerRoute(), Router

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (9): depositsCard, draft, field, item, pricedCard, productNameInput, setsCard, totalCard (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.2
Nodes (9): หมายเหตุ, 1. สร้าง Google Cloud Project, 2. ตั้งค่า OAuth consent screen, 3. สร้าง OAuth client, 4. ใส่ค่าในแอป, 5. ค่า secret สำหรับ Edge Functions, code:bash (VITE_SUPABASE_URL=https://your-project-ref.supabase.co), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog) (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.27
Nodes (5): hasMethod(), isOneOf(), isType(), normalizeHandler(), Route

### Community 26 - "Community 26"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (6): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, user

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): customer, eq, filters, order, select, stockItem, supabase

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (7): code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy google-oauth-start --no-verify-jwt), code:bash (supabase functions serve --env-file supabase/.env), Deploy, Local serve, Required secrets, Supabase Edge Functions for Google OAuth

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], { pageProps }, [shopId, setShopId], stockItems, user

### Community 32 - "Community 32"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 34 - "Community 34"
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

## Knowledge Gaps
- **242 isolated node(s):** `url`, `authUrl`, `url`, `error`, `supabase` (+237 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RentalOrder` connect `Community 20` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 12`, `Community 15`, `Community 17`, `Community 19`, `Community 21`, `Community 27`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Customer` connect `Community 2` to `Community 0`, `Community 3`, `Community 5`, `Community 6`, `Community 12`, `Community 17`, `Community 20`, `Community 21`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `StockItem` connect `Community 20` to `Community 0`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 12`, `Community 17`, `Community 19`, `Community 21`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `url`, `authUrl`, `url` to the rest of the system?**
  _242 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._