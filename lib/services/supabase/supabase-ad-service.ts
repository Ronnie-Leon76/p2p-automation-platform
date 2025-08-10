import type { Ad } from '@/lib/auth/mock-ad-storage';
import type { AdServiceInterface } from '../interfaces/ad-service';
import { supabase } from './supabase-client';

// Database to TypeScript mapping
interface DbAd {
  id: string;
  team_id: string;
  exchange_name: string;
  external_ad_id?: string;
  side: 'buy' | 'sell';
  crypto_currency: string;
  fiat_currency: string;
  crypto_amount?: number;
  unit_price?: number;
  min_order_limit?: number;
  max_order_limit?: number;
  price_type?: string;
  price_margin?: number;
  status: string;
  is_hidden: boolean;
  payment_methods: string[];
  target_group?: string;
  min_kyc_level?: number;
  min_completed_orders?: number;
  min_completion_rate?: number;
  remark?: string;
  automated_message?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseAdService implements AdServiceInterface {
  
  // Convert database record to TypeScript interface
  private dbToAd(dbAd: DbAd): Ad {
    return {
      id: dbAd.id,
      exchange: dbAd.exchange_name as "okx" | "binance" | "bybit",
      side: dbAd.side,
      cryptocurrency: dbAd.crypto_currency,
      fiatCurrency: dbAd.fiat_currency,
      unitPrice: dbAd.unit_price?.toString() || '0',
      availableAmount: dbAd.crypto_amount?.toString() || '0',
      minOrderSize: dbAd.min_order_limit?.toString() || '0',
      maxOrderSize: dbAd.max_order_limit?.toString() || '0',
      status: dbAd.status as "active" | "paused" | "inactive",
      isHidden: dbAd.is_hidden,
      createdAt: dbAd.created_at,
      updatedAt: dbAd.updated_at,
      completedOrders: 0, // Will be calculated from orders table
      totalVolume: '0', // Will be calculated
      successRate: 100, // Will be calculated
      currentOrders: 0, // Will be calculated
      teamId: dbAd.team_id,
      createdBy: dbAd.created_by || '',
      paymentMethods: dbAd.payment_methods || [],
      autoReply: Boolean(dbAd.automated_message),
      priceMargin: dbAd.price_margin || 0,
      requirements: {
        minKycLevel: dbAd.min_kyc_level || 0,
        minCompletionRate: dbAd.min_completion_rate || 0,
        remarks: dbAd.remark || '',
      },
    };
  }

  // Convert TypeScript interface to database record
  private adToDb(ad: Partial<Ad>, userId?: string, teamId?: string): Partial<DbAd> {
    return {
      team_id: teamId || ad.teamId,
      exchange_name: ad.exchange,
      side: ad.side,
      crypto_currency: ad.cryptocurrency,
      fiat_currency: ad.fiatCurrency,
      unit_price: ad.unitPrice ? parseFloat(ad.unitPrice) : undefined,
      crypto_amount: ad.availableAmount ? parseFloat(ad.availableAmount) : undefined,
      min_order_limit: ad.minOrderSize ? parseFloat(ad.minOrderSize) : undefined,
      max_order_limit: ad.maxOrderSize ? parseFloat(ad.maxOrderSize) : undefined,
      status: ad.status,
      is_hidden: ad.isHidden,
      payment_methods: ad.paymentMethods,
      price_margin: ad.priceMargin,
      min_kyc_level: ad.requirements?.minKycLevel,
      min_completion_rate: ad.requirements?.minCompletionRate,
      remark: ad.requirements?.remarks,
      automated_message: ad.autoReply ? 'Auto-reply enabled' : undefined,
      created_by: userId || ad.createdBy,
      updated_at: new Date().toISOString(),
    };
  }
  
  async getAllAds(): Promise<Ad[]> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads:', error);
        return [];
      }

      return (data || []).map(this.dbToAd);
    } catch (error) {
      console.error('Unexpected error in getAllAds:', error);
      return [];
    }
  }

  async getAdById(id: string): Promise<Ad | null> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ad by ID:', error);
        return null;
      }

      return data ? this.dbToAd(data) : null;
    } catch (error) {
      console.error('Unexpected error in getAdById:', error);
      return null;
    }
  }

  async getAdsByTeam(teamId: string): Promise<Ad[]> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads by team:', error);
        return [];
      }

      return (data || []).map(this.dbToAd);
    } catch (error) {
      console.error('Unexpected error in getAdsByTeam:', error);
      return [];
    }
  }

  async getAdsByUser(userId: string): Promise<Ad[]> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads by user:', error);
        return [];
      }

      return (data || []).map(this.dbToAd);
    } catch (error) {
      console.error('Unexpected error in getAdsByUser:', error);
      return [];
    }
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
    try {
      let query = supabase.from('ads').select('*');

      // Apply filters
      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId);
      }
      if (filters.userId) {
        query = query.eq('created_by', filters.userId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.exchange) {
        query = query.eq('exchange', filters.exchange);
      }
      if (filters.searchTerm) {
        query = query.or(`cryptocurrency.ilike.%${filters.searchTerm}%,fiat_currency.ilike.%${filters.searchTerm}%`);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered ads:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getFilteredAds:', error);
      return [];
    }
  }

  async createAd(adData: Partial<Ad>, userId: string, teamId: string): Promise<Ad> {
    try {
      const dbData = this.adToDb(adData, userId, teamId);
      dbData.created_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('ads')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error creating ad:', error);
        throw new Error(`Failed to create ad: ${error.message}`);
      }

      return this.dbToAd(data);
    } catch (error) {
      console.error('Unexpected error in createAd:', error);
      throw error;
    }
  }

  async updateAd(id: string, adData: Partial<Ad>): Promise<Ad | null> {
    try {
      const dbData = this.adToDb(adData);

      const { data, error } = await supabase
        .from('ads')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ad:', error);
        return null;
      }

      return data ? this.dbToAd(data) : null;
    } catch (error) {
      console.error('Unexpected error in updateAd:', error);
      return null;
    }
  }

  async deleteAd(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting ad:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in deleteAd:', error);
      return false;
    }
  }

  async toggleAdStatus(id: string): Promise<Ad | null> {
    try {
      // First get the current ad
      const currentAd = await this.getAdById(id);
      if (!currentAd) return null;

      // Toggle status
      const newStatus = currentAd.status === 'active' ? 'paused' : 'active';
      
      return await this.updateAd(id, { status: newStatus });
    } catch (error) {
      console.error('Unexpected error in toggleAdStatus:', error);
      return null;
    }
  }

  async getTeamAdStats(teamId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    completed: number;
    totalVolume: number;
    avgPrice: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('status, unit_price')
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team ad stats:', error);
        return { total: 0, active: 0, paused: 0, completed: 0, totalVolume: 0, avgPrice: 0 };
      }

      const total = data.length;
      const active = data.filter(ad => ad.status === 'active').length;
      const paused = data.filter(ad => ad.status === 'paused').length;
      const completed = 0; // Would need orders table to calculate
      const totalVolume = 0; // Would need orders table to calculate
      
      // Calculate average price
      const prices = data.map(ad => ad.unit_price).filter(price => price > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

      return {
        total,
        active,
        paused,
        completed,
        totalVolume,
        avgPrice,
      };
    } catch (error) {
      console.error('Unexpected error in getTeamAdStats:', error);
      return { total: 0, active: 0, paused: 0, completed: 0, totalVolume: 0, avgPrice: 0 };
    }
  }
}
