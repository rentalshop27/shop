# Graph Report - Precious-Shop-Test  (2026-06-18)

## Corpus Check
- 55 files · ~81,134 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 799 nodes · 1765 edges · 34 communities (28 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f595c2c`
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

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 36 edges
2. `Customer` - 33 edges
3. `StockItem` - 30 edges
4. `RentalStatus` - 22 edges
5. `getErrorMessage()` - 18 edges
6. `StrategyHandler` - 15 edges
7. `PrecacheController` - 14 edges
8. `handleSaveCustomer()` - 14 edges
9. `normalizeThaiPhone()` - 14 edges
10. `Router` - 12 edges

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

## Communities (34 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (90): activeCustomers, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserEmail, setAuthUserEmail], [authUserId, setAuthUserId], authUserIdRef, [availableShops, setAvailableShops] (+82 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (74): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, user, buildDashboardMetrics(), getDaysOverdue() (+66 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (68): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+60 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (51): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadAccessibleShops(), loadCustomers() (+43 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (46): buildDressReportsData(), buildGeneralStoreMetrics(), buildReportsDateRange(), DateRange, DateRangeMode, DressReportItem, GeneralStoreMetrics, getDaysBetween() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (51): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+43 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (39): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (35): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadShopSettings() (+27 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (27): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.1
Nodes (18): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.26
Nodes (16): findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalForStockSku(), hasRentalConflict(), isDateOverlap(), isOpenRental(), isOpenRentalStatus(), openRentalStatuses (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (16): createRemoteRental(), createRemoteRentals(), deleteRemoteRental(), loadRentals(), mapRentalRow(), RentalRow, customer, eq (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (19): updateShopSettings(), archiveSelectedCustomer(), closeStockForm(), closeStockPreview(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor() (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (4): PrecacheStrategy, StrategyHandler, timeout(), toRequest()

### Community 14 - "Community 14"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (7): getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (14): availableCostume, CreateRentalsHandler, customer, existingRental, heading, image, makeRental(), makeStockItem() (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): ShopSummary, handleLogout(), [isLoggingOut, setIsLoggingOut], [logoutError, setLogoutError], ProfilePageProps, onLogout, onShopChange, shops

### Community 20 - "Community 20"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 22 - "Community 22"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

### Community 24 - "Community 24"
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
- **185 isolated node(s):** `emptyDraft`, `ViewKey`, `StockDraft`, `emptyStockDraft`, `DEFAULT_BRANDS` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RentalOrder` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 10`, `Community 11`, `Community 17`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Customer` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 5`, `Community 10`, `Community 11`, `Community 17`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `StockItem` connect `Community 1` to `Community 0`, `Community 4`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 17`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `emptyDraft`, `ViewKey`, `StockDraft` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._