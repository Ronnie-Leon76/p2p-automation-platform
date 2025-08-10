import { ensureTestUserAndTeam } from '@/lib/auth/supabase-auth-helper';
import { serviceFactory } from '@/lib/services/service-factory';

export async function testSupabaseCRUD() {
  console.log('🧪 Testing Supabase CRUD operations...');
  
  try {
    // Ensure we have an authenticated user and team
    console.log('🔐 Setting up authentication...');
    const { user, team } = await ensureTestUserAndTeam();
    
    // Switch to live data
    await serviceFactory.switchToLiveData();
    
    const adService = serviceFactory.getAdService();
    const teamService = serviceFactory.getTeamService();
    
    // Test team operations first
    console.log('🏢 Testing team operations...');
    const teams = await teamService.getAllTeams();
    console.log(`✅ Found ${teams.length} teams`);
    
    // Test reading all ads
    console.log('📖 Testing getAllAds...');
    const ads = await adService.getAllAds();
    console.log(`✅ Found ${ads.length} ads`);
    
    if (ads.length > 0) {
      console.log('📄 Sample ad:', ads[0]);
      
      // Test reading specific ad
      console.log('🔍 Testing getAdById...');
      const specificAd = await adService.getAdById(ads[0].id);
      console.log('✅ Found specific ad:', specificAd?.id);
      
      // Test updating ad
      console.log('✏️ Testing updateAd...');
      const updatedAd = await adService.updateAd(ads[0].id, {
        status: ads[0].status === 'active' ? 'paused' : 'active'
      });
      console.log('✅ Updated ad status:', updatedAd?.status);
    }
    
    // Test creating new ad
    console.log('➕ Testing createAd...');
    const newAd = await adService.createAd({
      exchange: 'okx',
      side: 'buy',
      cryptocurrency: 'USDT',
      fiatCurrency: 'KES',
      unitPrice: '130.00',
      availableAmount: '500.00',
      minOrderSize: '50.00',
      maxOrderSize: '500.00',
      status: 'active',
      isHidden: false,
      paymentMethods: ['M-Pesa'],
      autoReply: true,
      priceMargin: 0.02,
      requirements: {
        minKycLevel: 1,
        minCompletionRate: 0.9,
        remarks: 'Test ad created via CRUD test'
      }
    }, user.id, team.id);
    
    console.log('✅ Created new ad:', newAd.id);
    
    // Test creating a new team
    console.log('🏗️ Testing createTeam...');
    const newTeamData = {
      name: 'Test Team ' + Date.now(),
      description: 'Team created via CRUD test',
      owner_id: user.id,
    };
    
    const createdTeam = await teamService.createTeam(newTeamData);
    console.log('✅ Created new team:', createdTeam.id);
    
    // Test deleting the test ad
    console.log('🗑️ Testing deleteAd...');
    const deleted = await adService.deleteAd(newAd.id);
    console.log('✅ Deleted ad:', deleted);
    
    // Test deleting the test team
    console.log('🗑️ Testing deleteTeam...');
    const teamDeleted = await teamService.deleteTeam(createdTeam.id);
    console.log('✅ Deleted team:', teamDeleted);
    
    console.log('🎉 All CRUD operations completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ CRUD test failed:', error);
    return false;
  }
}

// Health check function
export async function testSupabaseConnection() {
  try {
    const healthCheck = await serviceFactory.healthCheck();
    console.log('🏥 Health check result:', healthCheck);
    return healthCheck;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return null;
  }
}
