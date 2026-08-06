# Graph Report - Precious-Shop-Test  (2026-08-06)

## Corpus Check
- 142 files · ~127,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1986 nodes · 3891 edges · 92 communities (84 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `742696b9`
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

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 51 edges
2. `Customer` - 42 edges
3. `getErrorMessage()` - 30 edges
4. `StockItem` - 30 edges
5. `StockItem` - 27 edges
6. `What Changed` - 25 edges
7. `RentalStatus` - 24 edges
8. `FlatStockItem` - 21 edges
9. `getErrorMessage()` - 20 edges
10. `รายละเอียดสิ่งที่ทำเสร็จแล้ว (Completed Work)` - 17 edges

## Surprising Connections (you probably didn't know these)
- `handleSubmit()` --calls--> `onEditRentalFields`  [INFERRED]
  src/features/rentals/RentalsPage.tsx → src/features/rentals/RentalsPage.test.tsx
- `jsonResponse()` --calls--> `createCorsHeaders()`  [EXTRACTED]
  supabase/functions/r2-images/index.ts → supabase/functions/_shared/googleDrive.ts
- `getGoogleOAuthSetupState()` --calls--> `Boolean()`  [INFERRED]
  src/features/google/googleOAuth.ts → src/App.tsx
- `useInventoryController()` --calls--> `Boolean()`  [INFERRED]
  src/features/inventory/useInventoryController.ts → src/App.tsx
- `hasConnectedGoogleDrive()` --calls--> `Boolean()`  [INFERRED]
  src/features/customers/customerRemote.ts → src/App.tsx

## Communities (92 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (142): bulkUpdateRemoteDisplayOrder(), updateRemoteProductFeatured(), activeCustomers, activeSettingsSubTab, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail] (+134 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (67): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+59 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (51): activeIsFeatured, {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  }, availability, availabilityCounts, [availabilityFilter, setAvailabilityFilter], [brandFilter, setBrandFilter], brands, canEditHeroBackground (+43 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (51): getUserFacingErrorMessage(), isPermissionDeniedError(), toMessageParts(), getErrorMessage(), [activeTab, setActiveTab], [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError] (+43 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (47): activeDateRange, [activeSubTab, setActiveSubTab], [brandFilter, setBrandFilter], brandsList, categoriesList, categoryChartColors, [categoryFilter, setCategoryFilter], categoryPieBackground (+39 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (42): allCostumesHaveSelectedTier, [basePriceFromTier, setBasePriceFromTier], customerToPrefill, disc, [editFormError, setEditFormError], [editingRentalId, setEditingRentalId], [editMode, setEditMode], [extraFineAmount, setExtraFineAmount] (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (40): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+32 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (39): TextField(), handleLogout(), buildGoogleOAuthStartUrl(), getGoogleOAuthCallbackUrl(), getGoogleOAuthClientId(), getGoogleOAuthReturnUrl(), getGoogleOAuthSetupState(), getStartFunctionUrl() (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (32): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanURL (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (42): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+34 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (41): createSignedUrl, createSignedUrlByBucket, deletedIds, deleteFilterQuery, deleteFilters, deleteQuery, eq, file (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (36): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalDepositResolutionUpdate, RentalFineUpdate, RentalRow (+28 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (35): buildReportValues(), calculateNetRevenue(), countBy(), createSpreadsheet(), CustomerRow, ensureReportSheets(), getOrCreateReportSpreadsheet(), getSpreadsheet() (+27 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (29): [activeStatusDropdownId, setActiveStatusDropdownId], baseSku, count, current, [currentPage, setCurrentPage], currentProducts, dropdownRef, fileInputRef (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (34): CategoryMultiSelectDropdown(), cleanupDeletedProductImagePaths(), cleanupDeletedProductImageRefs(), cleanupUploadedProductImagePaths(), createProductImageDisplayUrl(), createProductWithVariants(), createSignedStorageUrl(), DEFAULT_SHOP_RENTAL_PRICES (+26 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (33): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createFunctionError(), createGoogleDrivePreviewUrl(), createRemoteCustomer(), CUSTOMER_SUMMARY_SELECT, CustomerDocumentRow, CustomerRow (+25 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (24): buildCatalogSizeSummary(), CatalogSizeSummary, customer, stockItems, summary, getInventoryDisplayStatus(), item, itemRepair (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (28): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+20 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (30): loadAccessibleShops(), loadCustomerSummaries(), body, calls, createObjectURL, customer, eq, fetchSpy (+22 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (27): depositsCard, draft, [draft, setDraft], field, item, onTogglePublicVisibility, pricedCard, product (+19 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (32): deleteShopHeroImage(), removeShopAssetPaths(), updateShopSettings(), uploadShopHeroImage(), getErrorMessage(), archiveSelectedCustomer(), cloneRentalPriceTiers(), ensureCustomerDocumentPreview() (+24 more)

### Community 21 - "Community 21"
Cohesion: 0.1
Nodes (26): ShopSummary, buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, customer, makeRental() (+18 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (25): RentalTier, calculateReturnDate(), canDeleteRentalGroup(), findConflictingRentalForStockItemId(), findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalConflictByStockItemIds(), findOpenRentalForStockSku() (+17 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (18): InventoryControllerPageProps, InventoryPageProps, addStockToVariant(), countRemoteRentalsForProduct(), countRemoteRentalsForStockItem(), loadProductsWithStock(), updateRemoteProductPublicVisibility(), updateRemoteStockItemPublicVisibility() (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (24): availableSortOrders, customerId, files, headers, response, rows, safeName, shopId (+16 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (20): allStockIds, bookedSkus, bookedStockIds, catalogKey, corsHeaders, isRented, PRODUCT_IMAGE_BUCKETS, ProductRow (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (20): demoCustomers, [activeTab, setActiveTab], customerInsights, CustomersPageProps, DraftCustomerDocument, rentalGuard, StatusFilter, customer (+12 more)

### Community 27 - "Community 27"
Cohesion: 0.1
Nodes (22): [completedCrop, setCompletedCrop], [crop, setCrop], [croppedAreaPixels, setCroppedAreaPixels], getCroppedImage(), handleSave(), ImageCropperModalProps, imgRef, [imgSrc, setImgSrc] (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.08
Nodes (24): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+16 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (21): [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview], BankSlip, dynamicRevenue, [extraRevenue, setExtraRevenue], handleApproveSlip(), handleMarkPickedUp(), handleMarkReturned() (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (21): alertSpy, availableCostume, CreateRentalsHandler, customer, existingRental, heading, image, makeRental() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (20): compressImageAsDataUrl(), compressImageAsFile(), compressImageInternal(), dataUrlToBlob(), dataUrlToFile(), estimateDataUrlBytes(), ImageCompressionOptions, ImageCompressionPreset (+12 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (23): 🎨 1. ฟีเจอร์ใหม่: Accordion Submenu ใน Sidebar, 📂 1. Database & Schema, 🌟 1. ฟีเจอร์ใหม่: ตั้งค่าระบบราคาและค่าปรับเริ่มต้นส่วนกลาง (Global Rental Defaults), 🎨 1. ฟีเจอร์ใหม่: Settings Page Redesign (Vertical Tabs Architecture), 💰 2. ระบบ Auto-Pass สรุปเคสไร้มัดจำ และ Extra Fine Workflow, 📡 2. Data Access Layer (Remote), 🌟 2. สิ่งที่หน้า Settings นี้ยังเชื่อมกับของเดิมในระบบ, 🖥️ 3. Application State & Business Logic (+15 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (21): code:bash (supabase migration up), Current Status, Current Worktree Signals, Dirty Worktree Notes, Handoff: เพิ่มจุดเปลี่ยนรหัสผ่านในหน้าโปรไฟล์พนักงาน, Handoff: ปรับปรุงหน้าตาแผงควบคุมข้อมูลลูกค้า (Customer Details Side Panel), Handoff: ปรับปรุงหน้ารายชื่อลูกค้า (Customer Profile & KYC Enhancements), Handoff: ถอดระบบซิงก์ Google Sheets และเพิ่มระบบ Export CSV สำหรับรายงาน (+13 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (20): addMonths(), buildDressReportsData(), buildGeneralStoreMetrics(), buildMonthlyDepositSummary(), buildMonthlyRevenueTrends(), buildMonthRange(), buildRevenueByCategory(), accessoryRental (+12 more)

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (16): DressReportItem, customer, exportDressReportsToCSVMock, rentals, stockItem, stockItems, supabase, downloadCsv() (+8 more)

### Community 36 - "Community 36"
Cohesion: 0.1
Nodes (21): 1. Database & Migrations, 1. Interactive KPI Dashboard (ส่วนบน), 2. Hybrid Table / Mini-Card List (แผงด้านซ้าย), 2. TypeScript Types & Core APIs, 2. TypeScript Types & Core Rules, 3. API & Controller, 3. Smart Search (รองรับ Barcode), 3. User Interface (UI Redesign) (+13 more)

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (3): PrecacheStrategy, StrategyHandler, toRequest()

### Community 38 - "Community 38"
Cohesion: 0.2
Nodes (18): authUrl, corsHeaders, url, base64UrlDecode(), base64UrlEncode(), buildGoogleConsentUrl(), buildState(), createRedirectResponse() (+10 more)

### Community 39 - "Community 39"
Cohesion: 0.26
Nodes (5): executeQuotaErrorCallbacks(), PrecacheStrategy, StrategyHandler, timeout(), toRequest()

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (7): getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (16): code:bash (KEEPALIVE_TOKEN=replace-with-a-long-random-token), code:bash (SUPABASE_KEEPALIVE_TOKEN=replace-with-the-same-token), code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy health --no-verify-jwt), code:text (https://<project-ref>.supabase.co/functions/v1/health), code:text (x-keepalive-token: <KEEPALIVE_TOKEN>), code:bash (supabase functions serve --env-file supabase/.env), Deploy (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.12
Nodes (17): 1. ระบบ Backend และความปลอดภัย (Edge Function & Migrations), 1. ระบบ Export Data และรองรับภาษาไทย (`src/utils/exportUtils.ts`), 1. ระบบ Tabs ประวัติการเช่าและสถิติ (Customer Insights), 2. Application Logic Layer, 2. โซนตรวจเอกสารยืนยันตัวตน (KYC/Document Verification), 2. ปรับปรุงหน้า UI รายงาน (`src/features/reports/ReportsPage.tsx`), 3. อัปเดตหน้าโปรไฟล์และ OAuth (`src/features/profile/ProfilePage.tsx`, `supabase/functions/google-oauth-start/index.ts`), 3. ปุ่มทางลัดเปิดบิลเช่าด่วน (Quick Rental Creation) (+9 more)

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (7): getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (14): InventoryPageContainer(), [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving], stockItems, user, InventoryControllerOptions, [currentStockItems, setCurrentStockItems], [isSaving, setIsSaving] (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (12): ErrorLike, getErrorMessage(), isDuplicateUserError(), toNonEmptyString(), adminClient, authHeader, corsHeaders, CreateShopMemberRequest (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (11): calculateCustomerInsights(), calculateCustomerStarRating(), clamp(), CustomerInsights, formatStarRating(), roundToHalf(), customer, insights (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.35
Nodes (12): canAddMoreDocuments(), canCreateRentalForCustomer(), findPhoneDuplicate(), formatMeasurements(), normalizeThaiPhone(), profileStatusLabel, profileStatusTone, resolveInitialProfileStatus() (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (14): buildDateRangeFromDates(), buildReportsDateRange(), calculateNetRentalRevenue(), CategoryRevenueSlice, DateRange, DateRangeMode, GeneralStoreMetrics, getDaysBetween() (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 51 - "Community 51"
Cohesion: 0.18
Nodes (13): baseClient, headers, response, url, headers, response, createCorsHeaders(), createOptionsResponse() (+5 more)

### Community 52 - "Community 52"
Cohesion: 0.13
Nodes (12): alertSpy, {
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
  loadGoogleOAuthConnection,
  startGoogleOAuth,
  updateShopSettings,
  updateRemoteProductPublicVisibility,
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
} (+4 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (12): ACCEPTED_IMAGE_TYPES, bucket, DeletePayload, files, getObjectKey(), getPublicBaseUrl(), headers, jsonResponse() (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.16
Nodes (11): customer, rental, stockItem, FlatStockItem, DepositAllocation, DepositAllocationInput, DepositResolutionDraft, FineAllocation (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.42
Nodes (11): cleanupUnusedImages(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), mapStockItemRow(), removeStockImagePaths() (+3 more)

### Community 56 - "Community 56"
Cohesion: 0.23
Nodes (4): getFriendlyURL(), isInstance(), RegExpRoute, Strategy

### Community 57 - "Community 57"
Cohesion: 0.23
Nodes (9): disconnectedStatus(), GoogleIntegrationRow, GoogleSheetsReportStatus, loadGoogleSheetsReportStatus(), syncGoogleSheetsReport(), SyncResponse, invoke, query (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (8): canReuseExistingToken, error, refreshToken, supabase, url, appendResult(), fetchGoogleUserInfo(), resolveGoogleRefreshToken()

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (10): ตั้งค่าครั้งเดียวสำหรับผู้ดูแลระบบ, 1. สร้าง Google Cloud Project, 2. ตั้งค่า OAuth consent screen, 3. สร้าง OAuth client, 4. ใส่ค่าในแอป, 5. ค่า secret สำหรับ Edge Functions, code:bash (GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.goog), code:bash (supabase functions deploy google-drive-customer-documents-up) (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (6): getGroupOverdueSummary(), getOverdueDays(), getOverduePenaltySummary(), OverduePenaltyRental, OverduePenaltySummary, toLocalNoon()

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (9): allocateFineAmount(), allocateForfeitedDeposit(), fromCents(), normalizeCurrencyAmount(), allocations, toCents(), saveExtraFine(), handleSubmitForfeitDeposit() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (7): OverviewShopData, costume, makeCustomer(), makeRental(), onEnterShop, onLogout, shopsData

### Community 65 - "Community 65"
Cohesion: 0.42
Nodes (7): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, stockItem, user

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (8): countRemoteRentalsForStockSku(), loadStockItems(), closeStockForm(), closeStockPreview(), handleDeleteStockItem(), handleSaveStockItem(), match, parseOptionalNumber()

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (6): loadPublicCatalog(), [error, setError], [items, setItems], PublicCatalogRouteProps, [shopName, setShopName], [status, setStatus]

### Community 68 - "Community 68"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 69 - "Community 69"
Cohesion: 0.43
Nodes (5): getShopPermissions(), normalizeShopRole(), ShopPermissions, ShopRole, permissions

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (6): CatalogDisplayItem, handleSaveCroppedImage(), catalogItems, items, onUploadHeroBackground, user

### Community 71 - "Community 71"
Cohesion: 0.48
Nodes (4): PublicCatalogResponse, hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 72 - "Community 72"
Cohesion: 0.4
Nodes (4): expectedToken, getRequiredEnv(), pingSupabaseDatabase(), responseHeaders

### Community 73 - "Community 73"
Cohesion: 0.47
Nodes (6): closeDeliveryMethodModal(), getTransitionableRentalIds(), handleConfirmEmsDelivery(), handleConfirmMessengerDelivery(), handleConfirmStorefrontPickup(), updateRentalStatuses()

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (6): Delivered state, Handoff: Central Google Drive for customer documents, Hosted deployment, Key files, Verification completed, Working tree / next steps

### Community 75 - "Community 75"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 76 - "Community 76"
Cohesion: 0.4
Nodes (5): getStatusBadge(), getTodayString(), handleSubmit(), setIsFormOpen(), splitAmountByWeights()

### Community 77 - "Community 77"
Cohesion: 0.4
Nodes (5): canAccessTab(), handleEnterShop(), handleShopChange(), handleTabChange(), resetDocumentScroll()

### Community 78 - "Community 78"
Cohesion: 0.4
Nodes (5): buildCustomerDraftFromCustomer(), closeCustomerForm(), openEditCustomerForm(), resetCustomerForm(), resetCustomerFormDraft()

### Community 79 - "Community 79"
Cohesion: 0.4
Nodes (5): getLastSelectedShopKey(), getLocalArray(), getLocalString(), getPreferredShopId(), safeLocalStorageGet()

### Community 80 - "Community 80"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

## Knowledge Gaps
- **769 isolated node(s):** `url`, `baseClient`, `response`, `headers`, `response` (+764 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `startGoogleOAuth()` connect `Community 7` to `Community 0`, `Community 37`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `StrategyHandler` connect `Community 37` to `Community 56`, `Community 45`, `Community 6`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `RentalOrder` connect `Community 16` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 9`, `Community 11`, `Community 13`, `Community 19`, `Community 21`, `Community 22`, `Community 23`, `Community 26`, `Community 29`, `Community 30`, `Community 34`, `Community 35`, `Community 47`, `Community 49`, `Community 54`, `Community 61`, `Community 64`, `Community 65`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `url`, `baseClient`, `response` to the rest of the system?**
  _769 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._