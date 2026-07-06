# Graph Report - Precious-Shop-Test  (2026-07-07)

## Corpus Check
- 126 files · ~119,157 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1611 nodes · 3190 edges · 83 communities (72 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e60ece90`
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
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 48 edges
2. `Customer` - 41 edges
3. `StockItem` - 30 edges
4. `StockItem` - 27 edges
5. `RentalStatus` - 24 edges
6. `getErrorMessage()` - 20 edges
7. `FlatStockItem` - 19 edges
8. `รายละเอียดสิ่งที่ทำเสร็จแล้ว (Completed Work)` - 17 edges
9. `saveShopSettings()` - 16 edges
10. `StrategyHandler` - 15 edges

## Surprising Connections (you probably didn't know these)
- `handleSubmit()` --calls--> `onEditRentalFields`  [INFERRED]
  src/features/rentals/RentalsPage.tsx → src/features/rentals/RentalsPage.test.tsx
- `hasConnectedGoogleDrive()` --calls--> `Boolean()`  [INFERRED]
  src/features/customers/customerRemote.ts → src/App.tsx
- `getGoogleOAuthSetupState()` --calls--> `Boolean()`  [INFERRED]
  src/features/google/googleOAuth.ts → src/App.tsx
- `handleSaveStockItem()` --calls--> `parseOptionalNumber()`  [INFERRED]
  src/App.tsx → src/features/customers/customerRemote.ts
- `updateRentalStatuses()` --calls--> `onUpdateRentalStatus`  [INFERRED]
  src/features/rentals/RentalsPage.tsx → src/features/rentals/RentalsPage.test.tsx

## Communities (83 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (132): activeCustomers, activeSettingsSubTab, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail], [authUserId, setAuthUserId], authUserIdRef (+124 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (67): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+59 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (48): buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, toUtcDay(), [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview] (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (45): allCostumesHaveSelectedTier, [basePriceFromTier, setBasePriceFromTier], closeDeliveryMethodModal(), disc, [editFormError, setEditFormError], [editingRentalId, setEditingRentalId], [editMode, setEditMode], [extraFineAmount, setExtraFineAmount] (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (41): {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  }, availability, availabilityCounts, [availabilityFilter, setAvailabilityFilter], [brandFilter, setBrandFilter], brands, canEditHeroBackground, CatalogAvailabilityFilter (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (38): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (42): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+34 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (41): createSignedUrl, createSignedUrlByBucket, deletedIds, deleteFilterQuery, deleteFilters, deleteQuery, eq, file (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (36): activeDateRange, [activeSubTab, setActiveSubTab], [brandFilter, setBrandFilter], brandsList, categoriesList, categoryChartColors, [categoryFilter, setCategoryFilter], categoryPieBackground (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (34): allocateForfeitedDeposit(), DepositAllocation, DepositAllocationInput, DepositResolutionDraft, FineAllocation, FineAllocationInput, fromCents(), normalizeCurrencyAmount() (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (33): baseClient, headers, response, url, headers, response, availableSortOrders, customerId (+25 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (31): buildReportValues(), calculateNetRevenue(), countBy(), CustomerRow, IntegrationRow, numberValue(), quoteSheetName(), quoteSheetRange() (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (25): TextField(), canAddMoreDocuments(), canCreateRentalForCustomer(), findPhoneDuplicate(), formatMeasurements(), normalizeThaiPhone(), profileStatusLabel, profileStatusTone (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (33): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createFunctionError(), createGoogleDrivePreviewUrl(), createRemoteCustomer(), CUSTOMER_SUMMARY_SELECT, CustomerDocumentRow, CustomerRow (+25 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (28): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (30): loadAccessibleShops(), loadCustomerSummaries(), body, calls, createObjectURL, customer, eq, fetchSpy (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (25): [activeStatusDropdownId, setActiveStatusDropdownId], baseSku, count, [currentPage, setCurrentPage], currentProducts, fileInputRef, filteredItems, InventoryControllerPageProps (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (25): RentalTier, calculateReturnDate(), findConflictingRentalForStockItemId(), findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalConflictByStockItemIds(), findOpenRentalForStockSku(), fullRentalEditFields (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (29): deleteShopHeroImage(), removeShopAssetPaths(), updateShopSettings(), uploadShopHeroImage(), archiveSelectedCustomer(), cloneRentalPriceTiers(), ensureCustomerDocumentPreview(), ensureExistingDocumentPreview() (+21 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (24): [activeTab, setActiveTab], [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], comingSoonTabs (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (25): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalDepositResolutionUpdate, RentalFineUpdate, RentalRow (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (20): allStockIds, bookedSkus, bookedStockIds, catalogKey, corsHeaders, isRented, PRODUCT_IMAGE_BUCKETS, ProductRow (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.1
Nodes (14): InventoryPageProps, countRemoteRentalsForStockItem(), loadProductsWithStock(), updateRemoteProductPublicVisibility(), updateRemoteStockItemStatus(), emptyProductDraft, emptyStockDraft, NormalizedStockDraft (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (22): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (23): addStockToVariant(), cleanupDeletedProductImagePaths(), cleanupDeletedProductImageRefs(), cleanupUploadedProductImagePaths(), countRemoteRentalsForProduct(), createProductImageDisplayUrl(), createProductWithVariants(), DEFAULT_SHOP_RENTAL_PRICES (+15 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (19): ShopSummary, handleLogout(), buildGoogleOAuthStartUrl(), getGoogleOAuthCallbackUrl(), getGoogleOAuthClientId(), getGoogleOAuthReturnUrl(), getGoogleOAuthSetupState(), readEnv() (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (18): addMonths(), buildGeneralStoreMetrics(), buildMonthlyDepositSummary(), buildMonthlyRevenueTrends(), buildMonthRange(), buildReportsDateRange(), buildRevenueByCategory(), CategoryRevenueSlice (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (15): buildCatalogSizeSummary(), CatalogSizeSummary, customer, stockItems, summary, customer, rental, stockItem (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.23
Nodes (19): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadStockItems() (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (8): getFriendlyURL(), getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 30 - "Community 30"
Cohesion: 0.2
Nodes (5): executeQuotaErrorCallbacks(), Strategy, StrategyHandler, timeout(), toRequest()

### Community 31 - "Community 31"
Cohesion: 0.1
Nodes (17): allocateFineAmount(), saveExtraFine(), { client }, { client, from, eq, order }, customer, deleteQuery, eq, filters (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (17): InventoryPageContainer(), [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], stockItems, user, createSignedStorageUrl(), loadShopSettings(), InventoryControllerOptions (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (17): authUrl, url, base64UrlDecode(), base64UrlEncode(), buildGoogleConsentUrl(), buildState(), createRedirectResponse(), createSignedState() (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (12): disconnectedStatus(), GoogleIntegrationRow, GoogleSheetsReportStatus, loadGoogleSheetsReportStatus(), syncGoogleSheetsReport(), SyncResponse, invoke, query (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (14): buildDressReportsData(), accessoryRental, accessoryStock, activeDateRange, customer, [dressReport], metrics, rentals (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (11): calculateCustomerInsights(), calculateCustomerStarRating(), clamp(), CustomerInsights, formatStarRating(), roundToHalf(), customer, insights (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.2
Nodes (14): code:bash (KEEPALIVE_TOKEN=replace-with-a-long-random-token), code:bash (SUPABASE_KEEPALIVE_TOKEN=replace-with-the-same-token), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy health --no-verify-jwt), code:text (https://<project-ref>.supabase.co/functions/v1/health), code:text (x-keepalive-token: <KEEPALIVE_TOKEN>), code:bash (supabase functions serve --env-file supabase/.env), Deploy (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (15): 1. Database & Migrations, 1. Interactive KPI Dashboard (ส่วนบน), 2. Hybrid Table / Mini-Card List (แผงด้านซ้าย), 2. TypeScript Types & Core APIs, 2. TypeScript Types & Core Rules, 3. API & Controller, 3. Smart Search (รองรับ Barcode), 3. User Interface (UI Redesign) (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.26
Nodes (12): getInventoryDisplayStatus(), item, itemRepair, itemWash, makeRental(), makeStockItem(), rentals, rentalsActive (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (13): 🎨 1. ฟีเจอร์ใหม่: Accordion Submenu ใน Sidebar, 🌟 1. ฟีเจอร์ใหม่: ตั้งค่าระบบราคาและค่าปรับเริ่มต้นส่วนกลาง (Global Rental Defaults), 🎨 1. ฟีเจอร์ใหม่: Settings Page Redesign (Vertical Tabs Architecture), 🌟 2. สิ่งที่หน้า Settings นี้ยังเชื่อมกับของเดิมในระบบ, Application State & Data Access, Database & Schema, Handoff: สรุปฟีเจอร์ล่าสุด (Global Rental Defaults, Auto-Pass และ Extra Fine), Handoff: Settings Navigation Refactor (Accordion Submenu) (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (10): ProductWithStockSummary, StockItemStatus, displayStatusLabels, { primaryStatus }, SIZES, StockManagementDrawer(), StockManagementDrawerProps, customer (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (12): depositsCard, draft, field, item, onTogglePublicVisibility, pricedCard, product, productNameInput (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.27
Nodes (9): customer, makeRental(), metrics, stockItem, demoFlatStockItemsForRentals, demoRentals, demoStockItemsForRentals, RentalOrder (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (10): alertSpy, {
  loadAccessibleShops,
  loadCustomers,
  loadProductsWithStock,
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
}, {
  loadAccessibleShops,
  loadCustomerSummaries,
  loadCustomers,
  loadStockItemsForRentalMapping,
  loadProductsWithStock,
  loadShopSettings,
  loadRentals,
  loadAuditLogs,
  loadPublicCatalog,
  authStateChange,
  supabase,
}, {
  loadAccessibleShops,
  loadCustomerSummaries,
  loadCustomers,
  loadStockItemsForRentalMapping,
  loadProductsWithStock,
  loadShopSettings,
  loadRentals,
  loadAuditLogs,
  loadPublicCatalog,
  updateShopSettings,
  authStateChange,
  supabase,
}, storageSetItem (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.2
Nodes (11): 📂 1. Database & Schema, 📡 2. Data Access Layer (Remote), 🖥️ 3. Application State & Business Logic, 🎨 4. User Interface (UI / UX), Handoff: ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow, Handoff Report: Order Tracking & Explicit Shipping Actions, Handoff Report: Rental Tier Pricing Redesign, Handoff Report: Rentals Page Hybrid Table & UI Redesign (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.24
Nodes (7): canReuseExistingToken, error, refreshToken, supabase, url, appendResult(), resolveGoogleRefreshToken()

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (6): getGroupOverdueSummary(), getOverdueDays(), getOverduePenaltySummary(), OverduePenaltyRental, OverduePenaltySummary, toLocalNoon()

### Community 50 - "Community 50"
Cohesion: 0.2
Nodes (9): หมายเหตุ, 1. สร้าง Google Cloud Project, 2. ตั้งค่า OAuth consent screen, 3. สร้าง OAuth client, 4. ใส่ค่าในแอป, 5. ค่า secret สำหรับ Edge Functions, code:bash (VITE_SUPABASE_URL=https://your-project-ref.supabase.co), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog) (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.42
Nodes (7): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, stockItem, user

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (7): createSpreadsheet(), ensureReportSheets(), getOrCreateReportSpreadsheet(), getSpreadsheet(), deleteFileFromDrive(), uploadFileToDrive(), fetchGoogleUserInfo()

### Community 53 - "Community 53"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (8): Current Worktree Signals, Handoff: Shop Roles / Permission Guards / Staff UI Polish, Known Follow-ups, Recommended Next Session, Suggested Skills, Summary, User Intent, Verification Already Run

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (6): loadPublicCatalog(), [error, setError], [items, setItems], PublicCatalogRouteProps, [shopName, setShopName], [status, setStatus]

### Community 56 - "Community 56"
Cohesion: 0.43
Nodes (5): getShopPermissions(), normalizeShopRole(), ShopPermissions, ShopRole, permissions

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (7): Dashboard / layout behavior, Database migration, Permission model and shared helpers, Rentals / money-sensitive actions, RLS / data access follow-through, Settings placeholder, What Changed

### Community 58 - "Community 58"
Cohesion: 0.48
Nodes (4): PublicCatalogResponse, hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 59 - "Community 59"
Cohesion: 0.4
Nodes (4): expectedToken, getRequiredEnv(), pingSupabaseDatabase(), responseHeaders

### Community 61 - "Community 61"
Cohesion: 0.47
Nodes (5): getErrorMessage(), getUserFacingErrorMessage(), isPermissionDeniedError(), toMessageParts(), getErrorMessage()

### Community 62 - "Community 62"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 63 - "Community 63"
Cohesion: 0.4
Nodes (5): getLastSelectedShopKey(), getLocalArray(), getLocalString(), getPreferredShopId(), safeLocalStorageGet()

### Community 64 - "Community 64"
Cohesion: 0.4
Nodes (5): canAccessTab(), handleEnterShop(), handleShopChange(), handleTabChange(), resetDocumentScroll()

### Community 65 - "Community 65"
Cohesion: 0.4
Nodes (5): buildCustomerDraftFromCustomer(), closeCustomerForm(), openEditCustomerForm(), resetCustomerForm(), resetCustomerFormDraft()

### Community 66 - "Community 66"
Cohesion: 0.4
Nodes (5): getStatusBadge(), getTodayString(), handleSubmit(), setIsFormOpen(), splitAmountByWeights()

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (5): 💰 2. ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow, Application State & Business Logic, Data Access Layer (Remote), Database & Schema, User Interface (UI / UX)

### Community 70 - "Community 70"
Cohesion: 0.5
Nodes (3): CatalogDisplayItem, catalogItems, user

## Knowledge Gaps
- **628 isolated node(s):** `url`, `baseClient`, `response`, `headers`, `response` (+623 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `uploadProductImages()` connect `Community 24` to `Community 52`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `uploadGoogleDriveCustomerDocuments()` connect `Community 13` to `Community 52`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `createGoogleDrivePreviewUrl()` connect `Community 13` to `Community 52`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `url`, `baseClient`, `response` to the rest of the system?**
  _628 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._