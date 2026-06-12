# Graph Report - Precious-Shop-Test  (2026-06-12)

## Corpus Check
- 30 files · ~65,899 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 481 nodes · 985 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f0f1ad3`
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

## God Nodes (most connected - your core abstractions)
1. `getErrorMessage()` - 17 edges
2. `Customer` - 17 edges
3. `StrategyHandler` - 15 edges
4. `PrecacheController` - 14 edges
5. `handleSaveCustomer()` - 13 edges
6. `Router` - 12 edges
7. `normalizeThaiPhone()` - 12 edges
8. `RentalOrder` - 12 edges
9. `StockItem` - 11 edges
10. `RentalStatus` - 10 edges

## Surprising Connections (you probably didn't know these)
- `refreshCustomerDocumentUrls()` --calls--> `loadCustomers()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/customers/customerRemote.ts
- `refreshAuditLogs()` --calls--> `loadAuditLogs()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/audit/auditRemote.ts
- `handleUpdateRentalStatus()` --calls--> `updateRemoteRentalStatus()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/rentals/rentalRemote.ts
- `handleDeleteRental()` --calls--> `deleteRemoteRental()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/rentals/rentalRemote.ts
- `handleDeleteStockItem()` --calls--> `countRemoteRentalsForStockSku()`  [EXTRACTED]
  src/App.tsx → /Users/bhusitt./Downloads/Precious Shop/src/features/inventory/stockRemote.ts

## Communities (24 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (61): activeCustomers, [activeTab, setActiveTab], [auditLogs, setAuditLogs], baseSku, [brands, setBrands], [categories, setCategories], [colors, setColors], count (+53 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (50): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanupOutdatedCaches() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (45): [collectedAmount, setCollectedAmount], costumeContainerRef, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount], [discountAmount, setDiscountAmount] (+37 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (34): archiveRemoteCustomer(), createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadCustomers(), loadOwnerShopId(), mapCustomerRow() (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (32): [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview], BankSlip, dynamicRevenue, [extraRevenue, setExtraRevenue], handleApproveSlip(), handleMarkPickedUp(), handleMarkReturned() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (29): calendarDays, CalendarPageProps, [currentDate, setCurrentDate], currentWeekDays, dayEvents, DayRentalBuckets, emptyDayRentals, filteredOngoing (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (8): executeQuotaErrorCallbacks(), getFriendlyURL(), PrecacheStrategy, Strategy, StrategyHandler, timeout(), toRequest(), waitUntil()

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (22): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, formatDateTime() (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (16): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], handleAddBrandSubmit(), handleAddCategorySubmit() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.34
Nodes (12): cleanupUnusedImages(), countRemoteRentalsForStockSku(), createRemoteStockItem(), dataURLtoFile(), deleteRemoteStockItem(), getPathFromUrl(), loadShopSettings(), loadStockItems() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (11): updateShopSettings(), archiveSelectedCustomer(), getErrorMessage(), handleAddBrand(), handleAddCategory(), handleAddColor(), handleDeleteBrand(), handleDeleteCategory() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (9): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (10): closeStockForm(), closeStockPreview(), handleDeleteRental(), handleDeleteStockItem(), handleLoadAuditLogs(), handleSaveStockItem(), handleUpdateRentalStatus(), match (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.52
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 15 - "Community 15"
Cohesion: 0.6
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

## Knowledge Gaps
- **93 isolated node(s):** `emptyDraft`, `ViewKey`, `StockDraft`, `emptyStockDraft`, `statusOptions` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RentalOrder` connect `Community 4` to `Community 0`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `RentalStatus` connect `Community 4` to `Community 0`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `PrecacheController` connect `Community 9` to `Community 1`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `emptyDraft`, `ViewKey`, `StockDraft` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._