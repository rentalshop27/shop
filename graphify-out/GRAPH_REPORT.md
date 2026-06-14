# Graph Report - Precious-Shop-Test  (2026-06-14)

## Corpus Check
- 43 files · ~74,019 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 625 nodes · 1225 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d63436af`
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

## God Nodes (most connected - your core abstractions)
1. `Customer` - 22 edges
2. `RentalOrder` - 20 edges
3. `getErrorMessage()` - 18 edges
4. `StockItem` - 17 edges
5. `StrategyHandler` - 15 edges
6. `PrecacheController` - 14 edges
7. `handleSaveCustomer()` - 14 edges
8. `RentalStatus` - 13 edges
9. `Router` - 12 edges
10. `handleSaveStockItem()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `refreshAuditLogs()` --calls--> `loadAuditLogs()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/audit/auditRemote.ts
- `handleCreateRentals()` --calls--> `canCreateRentalForCustomer()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts
- `handleUpdateRentalStatus()` --calls--> `updateRemoteRentalStatus()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/rentals/rentalRemote.ts
- `handleDeleteRental()` --calls--> `deleteRemoteRental()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/rentals/rentalRemote.ts
- `handleSubmit()` --calls--> `canCreateRentalForCustomer()`  [EXTRACTED]
  src/features/rentals/RentalsPage.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRules.ts

## Communities (27 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (72): activeCustomers, [activeTab, setActiveTab], [auditLogs, setAuditLogs], baseSku, [brands, setBrands], [categories, setCategories], [colors, setColors], count (+64 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (52): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+44 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (62): customer, getTodayString(), makeRental(), makeStockItem(), onUpdateRentalStatus, user, buildDashboardMetrics(), getDaysOverdue() (+54 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (47): calendarDays, CalendarPageProps, categories, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, DayRentalCategory (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (51): [collectedAmount, setCollectedAmount], costumeContainerRef, costumeImageUrl, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount] (+43 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (42): archiveRemoteCustomer(), cleanupUploadedCustomerDocumentPaths(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadCustomers(), loadOwnerShopId() (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (8): executeQuotaErrorCallbacks(), getFriendlyURL(), isInstance(), PrecacheStrategy, Strategy, StrategyHandler, toRequest(), waitUntil()

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (28): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), createRemoteStockItems(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadShopSettings() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (22): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (14): findConflictingRentalForStockSku(), findOpenRentalConflict(), findOpenRentalForStockSku(), hasRentalConflict(), isDateOverlap(), isOpenRental(), isOpenRentalStatus(), openRentalStatuses (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (14): availableCostume, CreateRentalsHandler, customer, existingRental, heading, image, makeRental(), makeStockItem() (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.27
Nodes (11): updateShopSettings(), archiveSelectedCustomer(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor(), handleDeleteBrand(), handleDeleteCategory() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (8): closeStockForm(), closeStockPreview(), handleDeleteRental(), handleDeleteStockItem(), handleLoadAuditLogs(), handleUpdateRentalStatus(), handleUpdateStockStatus(), refreshAuditLogs()

### Community 15 - "Community 15"
Cohesion: 0.52
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 16 - "Community 16"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

## Knowledge Gaps
- **180 isolated node(s):** `emptyDraft`, `ViewKey`, `StockDraft`, `emptyStockDraft`, `statusOptions` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RentalOrder` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Customer` connect `Community 5` to `Community 0`, `Community 2`, `Community 4`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `RentalStatus` connect `Community 2` to `Community 0`, `Community 10`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `emptyDraft`, `ViewKey`, `StockDraft` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._