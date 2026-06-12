# Graph Report - Precious Shop  (2026-06-12)

## Corpus Check
- 30 files · ~65,419 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 451 nodes · 706 edges · 32 communities (22 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b5ca5059`
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

## God Nodes (most connected - your core abstractions)
1. `getErrorMessage()` - 17 edges
2. `StrategyHandler` - 14 edges
3. `PrecacheController` - 13 edges
4. `handleSaveCustomer()` - 13 edges
5. `Router` - 11 edges
6. `handleSaveStockItem()` - 9 edges
7. `normalizeThaiPhone()` - 9 edges
8. `Customer` - 9 edges
9. `updateShopSettings()` - 8 edges
10. `normalizeHandler()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleCreateRentals()` --calls--> `createRemoteRental()`  [EXTRACTED]
  src/App.tsx → src/features/rentals/rentalRemote.ts
- `handleSaveCustomer()` --calls--> `setIsFormOpen()`  [EXTRACTED]
  src/App.tsx → src/features/rentals/RentalsPage.tsx
- `handleSaveStockItem()` --calls--> `updateRemoteStockItem()`  [EXTRACTED]
  src/App.tsx → src/features/inventory/stockRemote.ts
- `handleSaveStockItem()` --calls--> `createRemoteStockItem()`  [EXTRACTED]
  src/App.tsx → src/features/inventory/stockRemote.ts
- `refreshCustomerDocumentUrls()` --calls--> `loadCustomers()`  [EXTRACTED]
  src/App.tsx → src/features/customers/customerRemote.ts

## Communities (32 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (59): activeCustomers, [activeTab, setActiveTab], [auditLogs, setAuditLogs], baseSku, [brands, setBrands], [categories, setCategories], [colors, setColors], count (+51 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (39): [collectedAmount, setCollectedAmount], costumeContainerRef, [costumeSearch, setCostumeSearch], [currentPage, setCurrentPage], customerContainerRef, [customerSearch, setCustomerSearch], [depositAmount, setDepositAmount], [discountAmount, setDiscountAmount] (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (32): createRemoteCustomer(), CustomerDocumentRow, CustomerRow, deleteRemoteCustomerDocuments(), loadCustomers(), loadOwnerShopId(), mapCustomerRow(), parseOptionalNumber() (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (21): [activeContactUser, setActiveContactUser], [activeSlipToReview, setActiveSlipToReview], BankSlip, dynamicRevenue, [extraRevenue, setExtraRevenue], OverdueRental, overdues, pickups (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (25): calendarDays, CalendarPageProps, [currentDate, setCurrentDate], currentWeekDays, filteredOngoing, filteredPickups, filteredReturns, filteredTimelineRentals (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (7): executeQuotaErrorCallbacks(), getFriendlyURL(), PrecacheStrategy, Strategy, StrategyHandler, timeout(), toRequest()

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (21): additionalURLs, cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanURL, copyResponse() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (19): [actionFilter, setActionFilter], actionTranslations, allKeys, AuditLogPageProps, [currentPage, setCurrentPage], fieldTranslations, filteredLogs, ignoredKeys (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (10): [brandError, setBrandError], [brandSuccess, setBrandSuccess], [categoryError, setCategoryError], [categorySuccess, setCategorySuccess], [colorError, setColorError], [colorSuccess, setColorSuccess], [newBrand, setNewBrand], [newCategory, setNewCategory] (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (14): archiveRemoteCustomer(), updateRemoteCustomerRisk(), updateRemoteCustomerStatus(), updateShopSettings(), archiveSelectedCustomer(), getErrorMessage(), handleAddBrand(), handleAddCategory() (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (5): hasMethod(), isOneOf(), isType(), normalizeHandler(), Route

### Community 12 - "Community 12"
Cohesion: 0.36
Nodes (9): cleanupUnusedImages(), createRemoteStockItem(), dataURLtoFile(), getPathFromUrl(), loadShopSettings(), mapStockItemRow(), StockItemRow, updateRemoteStockItem() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (9): Cloudflare Pages, code:bash (npm install), code:bash (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run test), Development, Features, Precious Shop, Supabase (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (9): loadAuditLogs(), createRemoteRentals(), deleteRemoteRental(), updateRemoteRentalStatus(), handleCreateRentals(), handleDeleteRental(), handleLoadAuditLogs(), handleUpdateRentalStatus() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (9): countRemoteRentalsForStockSku(), deleteRemoteStockItem(), loadStockItems(), closeStockForm(), closeStockPreview(), handleDeleteStockItem(), handleSaveStockItem(), match (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (6): addRoute(), createHandlerBoundToURL(), getOrCreatePrecacheController(), precache(), precacheAndRoute(), registerRoute()

### Community 18 - "Community 18"
Cohesion: 0.4
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (3): hasSupabaseConfig, supabaseAnonKey, supabaseUrl

## Knowledge Gaps
- **182 isolated node(s):** `logger`, `messages`, `finalAssertExports`, `validMethods`, `_cacheNameDetails` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PrecacheController` connect `Community 9` to `Community 6`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `StrategyHandler` connect `Community 5` to `Community 9`, `Community 20`, `Community 6`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `RentalOrder` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `logger`, `messages`, `finalAssertExports` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._