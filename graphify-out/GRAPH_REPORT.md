# Graph Report - Precious-Shop-Test  (2026-07-07)

## Corpus Check
- 135 files · ~122,286 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1818 nodes · 3577 edges · 93 communities (81 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38036be5`
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
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 50 edges
2. `Customer` - 42 edges
3. `getErrorMessage()` - 30 edges
4. `StockItem` - 30 edges
5. `StockItem` - 27 edges
6. `RentalStatus` - 24 edges
7. `FlatStockItem` - 21 edges
8. `getErrorMessage()` - 20 edges
9. `รายละเอียดสิ่งที่ทำเสร็จแล้ว (Completed Work)` - 17 edges
10. `saveShopSettings()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `getGoogleOAuthSetupState()` --calls--> `Boolean()`  [INFERRED]
  src/features/google/googleOAuth.ts → src/App.tsx
- `loadShopSettings()` --calls--> `Boolean()`  [INFERRED]
  src/features/inventory/stockRemote.ts → src/App.tsx
- `useInventoryController()` --calls--> `Boolean()`  [INFERRED]
  src/features/inventory/useInventoryController.ts → src/App.tsx
- `handleSaveStockItem()` --calls--> `parseOptionalNumber()`  [INFERRED]
  src/App.tsx → src/features/customers/customerRemote.ts
- `updateRentalStatuses()` --calls--> `onUpdateRentalStatus`  [INFERRED]
  src/features/rentals/RentalsPage.tsx → src/features/rentals/RentalsPage.test.tsx

## Communities (93 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (132): activeCustomers, activeSettingsSubTab, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail], [authUserId, setAuthUserId], authUserIdRef (+124 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (67): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+59 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (51): getUserFacingErrorMessage(), isPermissionDeniedError(), toMessageParts(), getErrorMessage(), [activeTab, setActiveTab], [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError] (+43 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (47): activeDateRange, [activeSubTab, setActiveSubTab], [brandFilter, setBrandFilter], brandsList, categoriesList, categoryChartColors, [categoryFilter, setCategoryFilter], categoryPieBackground (+39 more)

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
Nodes (39): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+31 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (39): allCostumesHaveSelectedTier, [basePriceFromTier, setBasePriceFromTier], disc, [editFormError, setEditFormError], [editingRentalId, setEditingRentalId], [editMode, setEditMode], [extraFineAmount, setExtraFineAmount], [extraFineError, setExtraFineError] (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (32): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanURL (+24 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (43): bulkUpdateRemoteDisplayOrder(), createSignedUrl, createSignedUrlByBucket, deletedIds, deleteFilterQuery, deleteFilters, deleteQuery, eq (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (42): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+34 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (35): buildReportValues(), calculateNetRevenue(), countBy(), createSpreadsheet(), CustomerRow, ensureReportSheets(), getOrCreateReportSpreadsheet(), getSpreadsheet() (+27 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (27): buildCatalogSizeSummary(), CatalogSizeSummary, customer, stockItems, summary, customer, rental, stockItem (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (29): [activeStatusDropdownId, setActiveStatusDropdownId], baseSku, count, current, [currentPage, setCurrentPage], currentProducts, dropdownRef, fileInputRef (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (25): TextField(), canAddMoreDocuments(), canCreateRentalForCustomer(), findPhoneDuplicate(), formatMeasurements(), normalizeThaiPhone(), profileStatusLabel, profileStatusTone (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (27): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (27): headers, response, availableSortOrders, customerId, files, headers, response, rows (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (28): body, calls, createObjectURL, customer, eq, fetchSpy, file, filters (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (25): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalDepositResolutionUpdate, RentalFineUpdate, RentalRow (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (25): RentalTier, calculateReturnDate(), canDeleteRentalGroup(), findConflictingRentalForStockItemId(), findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalConflictByStockItemIds(), findOpenRentalForStockSku() (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (24): buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, customer, makeRental(), metrics (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (28): updateShopSettings(), getErrorMessage(), addDocuments(), archiveSelectedCustomer(), cloneRentalPriceTiers(), ensureCustomerDocumentPreview(), ensureExistingDocumentPreview(), fileToDataUrl() (+20 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (27): cleanupDeletedProductImagePaths(), cleanupDeletedProductImageRefs(), cleanupUploadedProductImagePaths(), createProductImageDisplayUrl(), createProductWithVariants(), createSignedStorageUrl(), DEFAULT_SHOP_RENTAL_PRICES, deleteRemoteProduct() (+19 more)

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (16): InventoryControllerPageProps, InventoryPageProps, addStockToVariant(), countRemoteRentalsForProduct(), countRemoteRentalsForStockItem(), updateRemoteProductPublicVisibility(), updateRemoteStockItemStatus(), emptyProductDraft (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (20): allStockIds, bookedSkus, bookedStockIds, catalogKey, corsHeaders, isRented, PRODUCT_IMAGE_BUCKETS, ProductRow (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (22): [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview], BankSlip, dynamicRevenue, [extraRevenue, setExtraRevenue], handleApproveSlip(), handleMarkPickedUp(), handleMarkReturned() (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (20): ShopSummary, handleLogout(), buildGoogleOAuthStartUrl(), getGoogleOAuthCallbackUrl(), getGoogleOAuthClientId(), getGoogleOAuthReturnUrl(), getGoogleOAuthSetupState(), readEnv() (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (22): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+14 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (19): alertSpy, availableCostume, CreateRentalsHandler, customer, existingRental, heading, image, makeRental() (+11 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (20): addMonths(), buildDressReportsData(), buildGeneralStoreMetrics(), buildMonthlyDepositSummary(), buildMonthlyRevenueTrends(), buildMonthRange(), buildRevenueByCategory(), accessoryRental (+12 more)

### Community 29 - "Community 29"
Cohesion: 0.1
Nodes (21): 1. Database & Migrations, 1. Interactive KPI Dashboard (ส่วนบน), 2. Hybrid Table / Mini-Card List (แผงด้านซ้าย), 2. TypeScript Types & Core APIs, 2. TypeScript Types & Core Rules, 3. API & Controller, 3. Smart Search (รองรับ Barcode), 3. User Interface (UI Redesign) (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (18): archiveRemoteCustomer(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadCustomers(), loadOwnerShopId(), mapCustomerRow() (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (15): disconnectedStatus(), GoogleIntegrationRow, GoogleSheetsReportStatus, loadGoogleSheetsReportStatus(), syncGoogleSheetsReport(), SyncResponse, invoke, query (+7 more)

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (17): authUrl, url, base64UrlDecode(), base64UrlEncode(), buildGoogleConsentUrl(), buildState(), createRedirectResponse(), createSignedState() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (19): allocateFineAmount(), saveExtraFine(), updateRemoteRentalDeposit(), updateRemoteRentalDepositResolution(), updateRemoteRentalFields(), getAllowedRentalEditFields(), closeStockForm(), closeStockPreview() (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (18): cleanupUploadedCustomerDocumentPaths(), createFunctionError(), createGoogleDrivePreviewUrl(), CUSTOMER_SUMMARY_SELECT, deleteGoogleDriveCustomerDocuments(), getAuthAccessToken(), getAvailableDocumentSortOrders(), getFunctionUrl() (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.26
Nodes (5): executeQuotaErrorCallbacks(), PrecacheStrategy, StrategyHandler, timeout(), toRequest()

### Community 36 - "Community 36"
Cohesion: 0.28
Nodes (4): executeQuotaErrorCallbacks(), PrecacheStrategy, StrategyHandler, toRequest()

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (12): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, stockItem, user, demoFlatStockItemsForRentals (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (7): getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (7): getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (14): InventoryPageContainer(), [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], stockItems, user, InventoryControllerOptions, [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving] (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.31
Nodes (15): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), loadShopSettings(), loadStockItems() (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (12): ErrorLike, getErrorMessage(), isDuplicateUserError(), toNonEmptyString(), adminClient, authHeader, corsHeaders, CreateShopMemberRequest (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (14): allocateForfeitedDeposit(), DepositAllocation, DepositAllocationInput, DepositResolutionDraft, FineAllocation, FineAllocationInput, fromCents(), normalizeCurrencyAmount() (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (11): calculateCustomerInsights(), calculateCustomerStarRating(), clamp(), CustomerInsights, formatStarRating(), roundToHalf(), customer, insights (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (15): code:bash (KEEPALIVE_TOKEN=replace-with-a-long-random-token), code:bash (SUPABASE_KEEPALIVE_TOKEN=replace-with-the-same-token), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy health --no-verify-jwt), code:text (https://<project-ref>.supabase.co/functions/v1/health), code:text (x-keepalive-token: <KEEPALIVE_TOKEN>), code:bash (supabase functions serve --env-file supabase/.env), Deploy (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (11): calculateNetRentalRevenue(), DressReportItem, downloadCsv(), exportDressReportsToCSV(), exportRentalsToCSV(), clickSpy, { clickSpy, getExportedBlob }, customer (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.2
Nodes (13): buildDateRangeFromDates(), buildReportsDateRange(), CategoryRevenueSlice, DateRange, DateRangeMode, GeneralStoreMetrics, getDaysBetween(), getLocalDateString() (+5 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (14): 🎨 1. ฟีเจอร์ใหม่: Accordion Submenu ใน Sidebar, 📂 1. Database & Schema, 🎨 1. ฟีเจอร์ใหม่: Settings Page Redesign (Vertical Tabs Architecture), 📡 2. Data Access Layer (Remote), 🌟 2. สิ่งที่หน้า Settings นี้ยังเชื่อมกับของเดิมในระบบ, 🖥️ 3. Application State & Business Logic, 🎨 4. User Interface (UI / UX), Handoff: ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow (+6 more)

### Community 51 - "Community 51"
Cohesion: 0.14
Nodes (14): 1. ระบบ Backend และความปลอดภัย (Edge Function & Migrations), 1. ระบบ Export Data และรองรับภาษาไทย (`src/utils/exportUtils.ts`), 2. Application Logic Layer, 2. ปรับปรุงหน้า UI รายงาน (`src/features/reports/ReportsPage.tsx`), 3. อัปเดตหน้าโปรไฟล์และ OAuth (`src/features/profile/ProfilePage.tsx`, `supabase/functions/google-oauth-start/index.ts`), 3. ปรับปรุงหน้า UI ตั้งค่า (`src/features/settings/SettingsPage.tsx` & `App.tsx`), 4. ทำความสะอาดโปรเจกต์, Dashboard / layout behavior (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (11): item, itemRepair, itemWash, makeRental(), makeStockItem(), rentals, rentalsActive, rentalsOverdue (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (12): depositsCard, draft, field, item, onTogglePublicVisibility, pricedCard, product, productNameInput (+4 more)

### Community 54 - "Community 54"
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

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): canReuseExistingToken, error, refreshToken, supabase, url, appendResult(), fetchGoogleUserInfo(), resolveGoogleRefreshToken()

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (11): code:bash (supabase migration up), Current Worktree Signals, Handoff: ถอดระบบซิงก์ Google Sheets และเพิ่มระบบ Export CSV สำหรับรายงาน, Handoff: Shop Roles / Permission Guards / Staff UI Polish, Handoff: ระบบเพิ่มและจัดการพนักงาน (Staff Management), Known Follow-ups, Recommended Next Session, Suggested Skills (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (6): getGroupOverdueSummary(), getOverdueDays(), getOverduePenaltySummary(), OverduePenaltyRental, OverduePenaltySummary, toLocalNoon()

### Community 61 - "Community 61"
Cohesion: 0.2
Nodes (9): หมายเหตุ, 1. สร้าง Google Cloud Project, 2. ตั้งค่า OAuth consent screen, 3. สร้าง OAuth client, 4. ใส่ค่าในแอป, 5. ค่า secret สำหรับ Edge Functions, code:bash (VITE_SUPABASE_URL=https://your-project-ref.supabase.co), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog) (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (8): baseClient, headers, response, url, downloadDriveFile(), getBearerToken(), requireShopAccess(), createServiceClient()

### Community 63 - "Community 63"
Cohesion: 0.25
Nodes (7): OverviewShopData, costume, makeCustomer(), makeRental(), onEnterShop, onLogout, shopsData

### Community 64 - "Community 64"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (6): loadPublicCatalog(), [error, setError], [items, setItems], PublicCatalogRouteProps, [shopName, setShopName], [status, setStatus]

### Community 66 - "Community 66"
Cohesion: 0.43
Nodes (5): getShopPermissions(), normalizeShopRole(), ShopPermissions, ShopRole, permissions

### Community 67 - "Community 67"
Cohesion: 0.48
Nodes (4): PublicCatalogResponse, hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 68 - "Community 68"
Cohesion: 0.4
Nodes (4): expectedToken, getRequiredEnv(), pingSupabaseDatabase(), responseHeaders

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (6): getStatusBadge(), getTodayString(), handleSubmit(), setIsFormOpen(), splitAmountByWeights(), onEditRentalFields

### Community 70 - "Community 70"
Cohesion: 0.47
Nodes (6): closeDeliveryMethodModal(), getTransitionableRentalIds(), handleConfirmEmsDelivery(), handleConfirmMessengerDelivery(), handleConfirmStorefrontPickup(), updateRentalStatuses()

### Community 71 - "Community 71"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 72 - "Community 72"
Cohesion: 0.4
Nodes (5): buildCustomerDraftFromCustomer(), closeCustomerForm(), openEditCustomerForm(), resetCustomerForm(), resetCustomerFormDraft()

### Community 73 - "Community 73"
Cohesion: 0.4
Nodes (5): getLastSelectedShopKey(), getLocalArray(), getLocalString(), getPreferredShopId(), safeLocalStorageGet()

### Community 74 - "Community 74"
Cohesion: 0.4
Nodes (5): canAccessTab(), handleEnterShop(), handleShopChange(), handleTabChange(), resetDocumentScroll()

### Community 75 - "Community 75"
Cohesion: 0.4
Nodes (5): 💰 2. ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow, Application State & Business Logic, Data Access Layer (Remote), Database & Schema, User Interface (UI / UX)

### Community 76 - "Community 76"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 78 - "Community 78"
Cohesion: 0.5
Nodes (3): CatalogDisplayItem, catalogItems, user

### Community 79 - "Community 79"
Cohesion: 0.5
Nodes (4): 🌟 1. ฟีเจอร์ใหม่: ตั้งค่าระบบราคาและค่าปรับเริ่มต้นส่วนกลาง (Global Rental Defaults), Application State & Data Access, Database & Schema, User Interface (UI / UX)

## Knowledge Gaps
- **691 isolated node(s):** `url`, `baseClient`, `response`, `headers`, `response` (+686 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `uploadProductImages()` connect `Community 21` to `Community 36`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `uploadGoogleDriveCustomerDocuments()` connect `Community 34` to `Community 36`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `deleteGoogleDriveCustomerDocuments()` connect `Community 34` to `Community 36`, `Community 30`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `url`, `baseClient`, `response` to the rest of the system?**
  _691 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._