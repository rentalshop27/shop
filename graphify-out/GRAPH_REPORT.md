# Graph Report - Precious-Shop-Test  (2026-06-18)

## Corpus Check
- 51 files · ~78,542 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 755 nodes · 1697 edges · 32 communities (25 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91f2a504`
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

## God Nodes (most connected - your core abstractions)
1. `RentalOrder` - 34 edges
2. `Customer` - 31 edges
3. `StockItem` - 29 edges
4. `RentalStatus` - 21 edges
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
- `openEditCustomerForm()` --calls--> `setIsFormOpen()`  [EXTRACTED]
  src/App.tsx → src/features/rentals/RentalsPage.tsx
- `handleSaveCustomer()` --calls--> `validateThaiPhone()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts
- `handleSaveCustomer()` --calls--> `findPhoneDuplicate()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts

## Communities (32 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (84): activeCustomers, [activeStatusDropdownId, setActiveStatusDropdownId], [activeTab, setActiveTab], [auditLogs, setAuditLogs], [authUserId, setAuthUserId], [availableShops, setAvailableShops], baseSku, [brands, setBrands] (+76 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (53): customer, makeRental(), metrics, stockItem, getInventoryDisplayStatus(), item, itemRepair, itemWash (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (68): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+60 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (52): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadAccessibleShops(), loadCustomers() (+44 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (46): buildDressReportsData(), buildGeneralStoreMetrics(), buildReportsDateRange(), DateRange, DateRangeMode, DressReportItem, GeneralStoreMetrics, getDaysBetween() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (50): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+42 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (40): buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, toUtcDay(), [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview] (+32 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (39): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (35): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadShopSettings() (+27 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (27): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (18): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (19): updateShopSettings(), archiveSelectedCustomer(), closeStockForm(), closeStockPreview(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor() (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.28
Nodes (4): PrecacheStrategy, StrategyHandler, timeout(), toRequest()

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (7): getOrCreateDefaultRouter(), hasMethod(), isOneOf(), isType(), normalizeHandler(), Route, Router

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 17 - "Community 17"
Cohesion: 0.57
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (6): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, user

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 20 - "Community 20"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

## Knowledge Gaps
- **155 isolated node(s):** `emptyDraft`, `ViewKey`, `StockDraft`, `emptyStockDraft`, `DEFAULT_BRANDS` (+150 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RentalOrder` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 18`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `StockItem` connect `Community 1` to `Community 0`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 18`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Customer` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 18`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `emptyDraft`, `ViewKey`, `StockDraft` to the rest of the system?**
  _155 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._