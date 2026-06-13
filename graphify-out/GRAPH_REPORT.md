# Graph Report - Precious-Shop-Test  (2026-06-13)

## Corpus Check
- 38 files · ~68,387 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 555 nodes · 1112 edges · 26 communities (21 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2bd47907`
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

## God Nodes (most connected - your core abstractions)
1. `Customer` - 20 edges
2. `getErrorMessage()` - 17 edges
3. `RentalOrder` - 17 edges
4. `StrategyHandler` - 15 edges
5. `PrecacheController` - 14 edges
6. `StockItem` - 14 edges
7. `handleSaveCustomer()` - 13 edges
8. `RentalStatus` - 13 edges
9. `Router` - 12 edges
10. `normalizeThaiPhone()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `refreshAuditLogs()` --calls--> `loadAuditLogs()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/audit/auditRemote.ts
- `handleCreateRentals()` --calls--> `createRemoteRental()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/rentals/rentalRemote.ts
- `updateSelectedStatus()` --calls--> `updateRemoteCustomerStatus()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRemote.ts
- `updateSelectedRisk()` --calls--> `updateRemoteCustomerRisk()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRemote.ts
- `archiveSelectedCustomer()` --calls--> `archiveRemoteCustomer()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRemote.ts

## Communities (26 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (63): activeCustomers, [activeTab, setActiveTab], [auditLogs, setAuditLogs], baseSku, [brands, setBrands], [categories, setCategories], [colors, setColors], count (+55 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (52): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+44 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (54): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+46 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (37): calendarDays, CalendarPageProps, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory, emptyDayRentals (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (38): buildDashboardMetrics(), getDaysOverdue(), getLocalDateString(), OverdueRental, RentalSchedule, customer, metrics, stockItem (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (36): archiveRemoteCustomer(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadCustomers(), loadOwnerShopId(), mapCustomerRow() (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (8): getFriendlyURL(), isInstance(), PrecacheStrategy, Strategy, StrategyHandler, timeout(), toRequest(), waitUntil()

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (22): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (21): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadShopSettings(), loadStockItems() (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (14): findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalForStockSku(), hasRentalConflict(), isDateOverlap(), isOpenRental(), isOpenRentalStatus(), openRentalStatuses (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (11): updateShopSettings(), archiveSelectedCustomer(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor(), handleDeleteBrand(), handleDeleteCategory() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (11): createRemoteRentals(), deleteRemoteRental(), updateRemoteRentalStatus(), closeStockForm(), closeStockPreview(), handleCreateRentals(), handleDeleteRental(), handleDeleteStockItem() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.52
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 15 - "Community 15"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

## Knowledge Gaps
- **130 isolated node(s):** `emptyDraft`, `ViewKey`, `StockItemStatus`, `StockDraft`, `emptyStockDraft` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RentalOrder` connect `Community 4` to `Community 0`, `Community 3`, `Community 2`, `Community 10`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `RentalStatus` connect `Community 4` to `Community 0`, `Community 3`, `Community 10`, `Community 2`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Customer` connect `Community 5` to `Community 0`, `Community 2`, `Community 10`, `Community 4`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `emptyDraft`, `ViewKey`, `StockItemStatus` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._