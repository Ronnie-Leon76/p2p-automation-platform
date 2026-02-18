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

export interface AdServiceInterface {
  // Basic CRUD operations
  getAllAds(): Promise<Ad[]>;
  getAdById(id: string): Promise<Ad | null>;
  getAdsByTeam(teamId: string): Promise<Ad[]>;
  getAdsByUser(userId: string): Promise<Ad[]>;
  
  // Filtered queries
  getFilteredAds(filters: {
    teamId?: string;
    userId?: string;
    status?: string;
    exchange?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<Ad[]>;
  
  // Mutations
  createAd(adData: Partial<Ad>, userId: string, teamId: string): Promise<Ad>;
  updateAd(id: string, adData: Partial<Ad>): Promise<Ad | null>;
  deleteAd(id: string): Promise<boolean>;
  toggleAdStatus(id: string): Promise<Ad | null>;
  
  // Statistics
  getTeamAdStats(teamId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    completed: number;
    totalVolume: number;
    avgPrice: number;
  }>;
  
  // Real-time subscriptions (for Supabase)
  subscribeToTeamAds?(teamId: string, callback: (ads: Ad[]) => void): () => void;
  subscribeToAdChanges?(adId: string, callback: (ad: Ad) => void): () => void;
}
