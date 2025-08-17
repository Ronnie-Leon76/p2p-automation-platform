/**
 * Mock Ad Storage Service for Development
 * Provides localStorage-based ad persistence for development and testing
 * 
 * ✅ INTEGRATION STATUS: 
 * - Successfully integrated with AdManagement component
 * - Provides complete CRUD operations for P2P ads
 * - Stores ad data persistently across browser sessions
 * - Includes filtering, search, and team-based organization
 * - Auto-loads default ads for development convenience
 * 
 * 🔗 CONNECTED COMPONENTS:
 * - components/ad-management.tsx (main UI)
 * - Team-based ad organization via MockTeamStorage
 * - User authentication via MockAuth system
 */

export interface Ad {
  id: string;
  exchange: "okx" | "binance" | "bybit";
  side: "buy" | "sell";
  cryptocurrency: string;
  fiatCurrency: string;
  unitPrice: string;
  availableAmount: string;
  minOrderSize: string;
  maxOrderSize: string;
  status: "active" | "paused" | "inactive";
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  completedOrders: number;
  totalVolume: string;
  successRate: number;
  currentOrders: number;
  teamId: string;
  createdBy: string;
  paymentMethods: string[];
  autoReply: boolean;
  priceMargin: number;
  requirements: {
    minKycLevel: number;
    minCompletionRate: number;
    remarks: string;
  };
}

export class MockAdStorage {
  private static instance: MockAdStorage;
  private storageKey = 'mock_ads_data';

  static getInstance(): MockAdStorage {
    if (!MockAdStorage.instance) {
      MockAdStorage.instance = new MockAdStorage();
    }
    return MockAdStorage.instance;
  }

  /**
   * Default mock ads for initial state
   */
  private defaultAds: Ad[] = [
    {
      id: "ad-1",
      exchange: "okx",
      side: "buy",
      cryptocurrency: "USDT",
      fiatCurrency: "USD",
      unitPrice: "1.00",
      availableAmount: "10000",
      minOrderSize: "50",
      maxOrderSize: "2000",
      status: "active",
      isHidden: false,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      completedOrders: 45,
      totalVolume: "125000",
      successRate: 98,
      currentOrders: 3,
      teamId: "team-1",
      createdBy: "mock-user-1",
      paymentMethods: ["Bank Transfer", "PayPal"],
      autoReply: true,
      priceMargin: 0.5,
      requirements: {
        minKycLevel: 2,
        minCompletionRate: 90,
        remarks: "Fast transactions preferred"
      }
    },
    {
      id: "ad-2", 
      exchange: "binance",
      side: "sell",
      cryptocurrency: "BTC",
      fiatCurrency: "USD",
      unitPrice: "45000",
      availableAmount: "0.5",
      minOrderSize: "500",
      maxOrderSize: "10000",
      status: "active",
      isHidden: false,
      createdAt: "2024-01-14T15:30:00Z",
      updatedAt: "2024-01-15T09:15:00Z",
      completedOrders: 12,
      totalVolume: "180000",
      successRate: 95,
      currentOrders: 1,
      teamId: "team-2",
      createdBy: "mock-user-2",
      paymentMethods: ["Bank Transfer", "Zelle"],
      autoReply: false,
      priceMargin: -0.2,
      requirements: {
        minKycLevel: 3,
        minCompletionRate: 95,
        remarks: "Premium traders only"
      }
    }
  ];

  /**
   * Get all ads from localStorage or return defaults
   */
  getAllAds(): Ad[] {
    if (typeof window === 'undefined') {
      return this.defaultAds;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load ads from localStorage:', error);
    }

    // Return defaults and save them
    this.saveAds(this.defaultAds);
    return this.defaultAds;
  }

  /**
   * Save ads to localStorage
   */
  saveAds(ads: Ad[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(ads));
    } catch (error) {
      console.error('Failed to save ads to localStorage:', error);
    }
  }

  /**
   * Add a new ad
   */
  addAd(adData: Partial<Ad>, userId: string, teamId: string): Ad {
    const ads = this.getAllAds();
    
    const newAd: Ad = {
      id: `ad-${Date.now()}`,
      exchange: adData.exchange || "okx",
      side: adData.side || "buy",
      cryptocurrency: adData.cryptocurrency || "",
      fiatCurrency: adData.fiatCurrency || "",
      unitPrice: adData.unitPrice || "",
      availableAmount: adData.availableAmount || "",
      minOrderSize: adData.minOrderSize || "",
      maxOrderSize: adData.maxOrderSize || "",
      status: "active",
      isHidden: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedOrders: 0,
      totalVolume: "0",
      successRate: 0,
      currentOrders: 0,
      teamId: teamId,
      createdBy: userId,
      paymentMethods: adData.paymentMethods || [],
      autoReply: adData.autoReply || false,
      priceMargin: adData.priceMargin || 0,
      requirements: adData.requirements || {
        minKycLevel: 1,
        minCompletionRate: 80,
        remarks: "",
      },
    };

    const updatedAds = [...ads, newAd];
    this.saveAds(updatedAds);
    
    return newAd;
  }

  /**
   * Update an existing ad
   */
  updateAd(adId: string, updates: Partial<Ad>): Ad | null {
    const ads = this.getAllAds();
    const adIndex = ads.findIndex(a => a.id === adId);
    
    if (adIndex === -1) {
      console.error(`Ad with ID ${adId} not found`);
      return null;
    }

    const updatedAd = { 
      ...ads[adIndex], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    ads[adIndex] = updatedAd;
    
    this.saveAds(ads);
    return updatedAd;
  }

  /**
   * Delete an ad
   */
  deleteAd(adId: string): boolean {
    const ads = this.getAllAds();
    const filteredAds = ads.filter(a => a.id !== adId);
    
    if (filteredAds.length === ads.length) {
      return false;
    }

    this.saveAds(filteredAds);
    return true;
  }

  /**
   * Get ads by team ID
   */
  getAdsByTeam(teamId: string): Ad[] {
    const ads = this.getAllAds();
    return ads.filter(ad => ad.teamId === teamId);
  }

  /**
   * Get ads by user ID (creator)
   */
  getAdsByUser(userId: string): Ad[] {
    const ads = this.getAllAds();
    return ads.filter(ad => ad.createdBy === userId);
  }

  /**
   * Toggle ad status (active/paused)
   */
  toggleAdStatus(adId: string): Ad | null {
    const ads = this.getAllAds();
    const ad = ads.find(a => a.id === adId);
    
    if (!ad) {
      return null;
    }

    const newStatus = ad.status === "active" ? "paused" : "active";
    return this.updateAd(adId, { status: newStatus });
  }

  /**
   * Clear all ads (for testing purposes)
   */
  clearAllAds(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Get ads with filtering options
   */
  getFilteredAds(filters: {
    teamId?: string;
    status?: string;
    exchange?: string;
    side?: string;
    searchTerm?: string;
  }): Ad[] {
    let ads = this.getAllAds();

    if (filters.teamId) {
      ads = ads.filter(ad => ad.teamId === filters.teamId);
    }

    if (filters.status && filters.status !== 'all') {
      ads = ads.filter(ad => ad.status === filters.status);
    }

    if (filters.exchange && filters.exchange !== 'all') {
      ads = ads.filter(ad => ad.exchange === filters.exchange);
    }

    if (filters.side && filters.side !== 'all') {
      ads = ads.filter(ad => ad.side === filters.side);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      ads = ads.filter(ad => 
        ad.cryptocurrency.toLowerCase().includes(term) ||
        ad.fiatCurrency.toLowerCase().includes(term)
      );
    }

    return ads;
  }
}
