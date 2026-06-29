# Graph Report - Precious-Shop-Test  (2026-06-29)

## Corpus Check
- 92 files · ~96,475 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1188 nodes · 2465 edges · 61 communities (55 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69934a47`
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
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 40 edges
2. `Customer` - 35 edges
3. `StockItem` - 30 edges
4. `StockItem` - 24 edges
5. `RentalStatus` - 23 edges
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

## Communities (61 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (110): activeCustomers, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail], [authUserId, setAuthUserId], authUserIdRef, [availableShops, setAvailableShops] (+102 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (79): TextField(), archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createFunctionError(), createGoogleDrivePreviewUrl(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow (+71 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (68): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+60 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (50): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+42 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (43): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (36): activeDateRange, [activeSubTab, setActiveSubTab], [brandFilter, setBrandFilter], brandsList, categoriesList, categoryChartColors, [categoryFilter, setCategoryFilter], categoryPieBackground (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (30): buildReportValues(), calculateNetRevenue(), countBy(), CustomerRow, IntegrationRow, numberValue(), quoteSheetName(), quoteSheetRange() (+22 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (29): availability, availabilityCounts, [availabilityFilter, setAvailabilityFilter], [brandFilter, setBrandFilter], brands, CatalogAvailabilityFilter, CatalogAvailabilityStatus, categories (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (27): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (21): baseClient, headers, response, url, headers, response, createCorsHeaders(), createDriveFolder() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (22): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (14): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, user, getInventoryDisplayStatus(), StockItem (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (19): getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, toUtcDay(), aggregatedMetrics, allRentals, failedShopsData (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (20): [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview], BankSlip, dynamicRevenue, [extraRevenue, setExtraRevenue], handleApproveSlip(), handleMarkPickedUp(), handleMarkReturned() (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.21
Nodes (8): PrecacheStrategy, StrategyHandler, toRequest(), createSpreadsheet(), ensureReportSheets(), getOrCreateReportSpreadsheet(), getSpreadsheet(), writeReportSheets()

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (20): deletedIds, deleteFilterQuery, deleteFilters, deleteQuery, eq, filters, firstInsertResult, insertPayloads (+12 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (18): addMonths(), buildGeneralStoreMetrics(), buildMonthlyDepositSummary(), buildMonthlyRevenueTrends(), buildMonthRange(), buildReportsDateRange(), buildRevenueByCategory(), CategoryRevenueSlice (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (17): ShopSummary, buildGoogleOAuthStartUrl(), getGoogleOAuthCallbackUrl(), getGoogleOAuthClientId(), getGoogleOAuthReturnUrl(), getGoogleOAuthSetupState(), readEnv(), trimTrailingSlash() (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.3
Nodes (18): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadShopSettings() (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (18): authUrl, url, base64UrlDecode(), base64UrlEncode(), buildGoogleConsentUrl(), buildState(), createJsonResponse(), createRedirectResponse() (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (8): getFriendlyURL(), getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 21 - "Community 21"
Cohesion: 0.26
Nodes (15): findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalForStockSku(), hasRentalConflict(), isDateOverlap(), isOpenRental(), isOpenRentalStatus(), openRentalStatuses (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (17): loadCustomerDocumentPreview(), updateShopSettings(), archiveSelectedCustomer(), ensureCustomerDocumentPreview(), ensureExistingDocumentPreview(), getErrorMessage(), handleAddBrand(), handleAddCategory() (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (13): [activeStatusDropdownId, setActiveStatusDropdownId], baseSku, count, fileInputRef, filteredItems, InventorySummary, match, { primaryStatus, nextBookedRental } (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (14): InventoryPageContainer(), [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], stockItems, user, InventoryControllerOptions, [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving] (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (12): disconnectedStatus(), GoogleIntegrationRow, GoogleSheetsReportStatus, loadGoogleSheetsReportStatus(), syncGoogleSheetsReport(), SyncResponse, invoke, query (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (14): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalRow, toRentalInsert(), updateRemoteRentalStatus() (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.24
Nodes (14): availableCostume, CreateRentalsHandler, customer, existingRental, heading, image, makeRental(), makeStockItem() (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (12): bookedSkus, catalogKey, corsHeaders, RentalRow, rows, shopQuery, ShopRow, skus (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (13): buildDressReportsData(), accessoryRental, accessoryStock, activeDateRange, customer, [dressReport], rentals, [report] (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (14): code:bash (KEEPALIVE_TOKEN=replace-with-a-long-random-token), code:bash (SUPABASE_KEEPALIVE_TOKEN=replace-with-the-same-token), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy health --no-verify-jwt), code:text (https://<project-ref>.supabase.co/functions/v1/health), code:text (x-keepalive-token: <KEEPALIVE_TOKEN>), code:bash (supabase functions serve --env-file supabase/.env), Deploy (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (13): availableSortOrders, customerId, files, headers, response, rows, safeName, shopId (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (11): item, itemRepair, itemWash, makeRental(), makeStockItem(), rentals, rentalsActive, rentalsOverdue (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (8): InventoryControllerPageProps, InventoryPageProps, updateRemoteStockItemPublicVisibility(), updateRemoteStockItemStatus(), emptyStockDraft, NormalizedStockDraft, normalizeStockDraft(), parseOptionalNumber()

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (11): depositsCard, draft, field, item, onTogglePublicVisibility, pricedCard, productNameInput, setsCard (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (8): canReuseExistingToken, error, refreshToken, supabase, url, appendResult(), fetchGoogleUserInfo(), resolveGoogleRefreshToken()

### Community 38 - "Community 38"
Cohesion: 0.2
Nodes (9): หมายเหตุ, 1. สร้าง Google Cloud Project, 2. ตั้งค่า OAuth consent screen, 3. สร้าง OAuth client, 4. ใส่ค่าในแอป, 5. ค่า secret สำหรับ Edge Functions, code:bash (VITE_SUPABASE_URL=https://your-project-ref.supabase.co), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog) (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (7): OverviewShopData, costume, makeCustomer(), makeRental(), onEnterShop, onLogout, shopsData

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (6): loadPublicCatalog(), [error, setError], [items, setItems], PublicCatalogRouteProps, [shopName, setShopName], [status, setStatus]

### Community 42 - "Community 42"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (7): customer, eq, filters, order, select, stockItem, supabase

### Community 44 - "Community 44"
Cohesion: 0.43
Nodes (6): buildDashboardMetrics(), customer, makeRental(), metrics, stockItem, RentalStatus

### Community 45 - "Community 45"
Cohesion: 0.48
Nodes (4): PublicCatalogResponse, hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (4): expectedToken, getRequiredEnv(), pingSupabaseDatabase(), responseHeaders

### Community 47 - "Community 47"
Cohesion: 0.4
Nodes (4): {
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
  loadPublicCatalog,
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

### Community 48 - "Community 48"
Cohesion: 0.4
Nodes (5): buildCustomerDraftFromCustomer(), closeCustomerForm(), openEditCustomerForm(), resetCustomerForm(), resetCustomerFormDraft()

### Community 50 - "Community 50"
Cohesion: 0.5
Nodes (3): CatalogDisplayItem, catalogItems, user

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (3): closeStockForm(), closeStockPreview(), handleDeleteStockItem()

## Knowledge Gaps
- **389 isolated node(s):** `url`, `baseClient`, `response`, `headers`, `response` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createGoogleDrivePreviewUrl()` connect `Community 1` to `Community 14`, `Community 23`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `uploadGoogleDriveCustomerDocuments()` connect `Community 1` to `Community 14`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `deleteGoogleDriveCustomerDocuments()` connect `Community 1` to `Community 14`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `url`, `baseClient`, `response` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._