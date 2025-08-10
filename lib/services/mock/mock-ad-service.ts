import type { Ad } from '@/lib/auth/mock-ad-storage';
import { MockAdStorage } from '@/lib/auth/mock-ad-storage';
import type { AdServiceInterface } from '../interfaces/ad-service';

export class MockAdService implements AdServiceInterface {
  private storage: MockAdStorage;

  constructor() {
    this.storage = MockAdStorage.getInstance();
  }

  async getAllAds(): Promise<Ad[]> {
    return this.storage.getAllAds();
  }

  async getAdById(id: string): Promise<Ad | null> {
    const ads = this.storage.getAllAds();
    return ads.find(ad => ad.id === id) || null;
  }

  async getAdsByTeam(teamId: string): Promise<Ad[]> {
    return this.storage.getFilteredAds({ teamId });
  }

  async getAdsByUser(userId: string): Promise<Ad[]> {
    const ads = this.storage.getAllAds();
    return ads.filter(ad => ad.createdBy === userId);
  }

  async getFilteredAds(filters: {
    teamId?: string;
    userId?: string;
    status?: string;
    exchange?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<Ad[]> {
    let ads = this.storage.getFilteredAds(filters);
    
    if (filters.userId) {
      ads = ads.filter(ad => ad.createdBy === filters.userId);
    }
    
    if (filters.limit) {
      const offset = filters.offset || 0;
      ads = ads.slice(offset, offset + filters.limit);
    }
    
    return ads;
  }

  async createAd(adData: Partial<Ad>, userId: string, teamId: string): Promise<Ad> {
    return this.storage.addAd(adData, userId, teamId);
  }

  async updateAd(id: string, adData: Partial<Ad>): Promise<Ad | null> {
    return this.storage.updateAd(id, adData);
  }

  async deleteAd(id: string): Promise<boolean> {
    return this.storage.deleteAd(id);
  }

  async toggleAdStatus(id: string): Promise<Ad | null> {
    return this.storage.toggleAdStatus(id);
  }

  async getTeamAdStats(teamId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    completed: number;
    totalVolume: number;
    avgPrice: number;
  }> {
    const ads = await this.getAdsByTeam(teamId);
    
    const stats = {
      total: ads.length,
      active: ads.filter(ad => ad.status === 'active').length,
      paused: ads.filter(ad => ad.status === 'paused').length,
      completed: ads.filter(ad => ad.status === 'inactive').length, // Using 'inactive' as completed
      totalVolume: ads.reduce((sum, ad) => sum + parseFloat(ad.availableAmount || '0'), 0),
      avgPrice: 0,
    };

    const totalAmount = stats.totalVolume;
    if (totalAmount > 0) {
      const totalValue = ads.reduce((sum, ad) => {
        const amount = parseFloat(ad.availableAmount || '0');
        const price = parseFloat(ad.unitPrice || '0');
        return sum + (amount * price);
      }, 0);
      stats.avgPrice = totalValue / totalAmount;
    }

    return stats;
  }
}
