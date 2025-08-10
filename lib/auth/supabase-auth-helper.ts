import { supabase } from '../services/supabase/supabase-client';

export async function ensureTestUser() {
  try {
    // Check if we already have a signed-in user
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (currentUser.user) {
      console.log('✅ Already authenticated as:', currentUser.user.email);
      return currentUser.user;
    }

    // Try to sign in with test user
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    console.log('🔐 Attempting to sign in with test user...');
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      console.log('👤 Test user not found, creating...');
      
      // Create test user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
          }
        }
      });

      if (signUpError) {
        console.error('❌ Failed to create test user:', signUpError);
        throw signUpError;
      }

      console.log('✅ Test user created successfully');
      
      // Try signing in again
      const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (retryError) {
        console.error('❌ Failed to sign in after creating user:', retryError);
        throw retryError;
      }

      signInData = retrySignIn;
    } else if (signInError) {
      console.error('❌ Failed to sign in:', signInError);
      throw signInError;
    }

    console.log('✅ Successfully authenticated as:', signInData.user?.email);
    return signInData.user;

  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

export async function ensureTestUserAndTeam() {
  try {
    const user = await ensureTestUser();
    if (!user) throw new Error('Failed to authenticate user');

    // Check if user has a team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (teamsError) {
      console.error('❌ Error checking teams:', teamsError);
      throw teamsError;
    }

    if (teams && teams.length > 0) {
      console.log('✅ Team found:', teams[0].name);
      return { user, team: teams[0] };
    }

    console.log('🏗️ Creating default team...');
    
    // Create a default team
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert([{
        name: 'Default Team',
        description: 'Default team for testing',
        owner_id: user.id,
      }])
      .select()
      .single();

    if (teamError) {
      console.error('❌ Failed to create team:', teamError);
      throw teamError;
    }

    // Add user as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{
        team_id: newTeam.id,
        user_id: user.id,
        role: 'owner',
        permissions: {},
      }]);

    if (memberError) {
      console.error('❌ Failed to add team member:', memberError);
      throw memberError;
    }

    console.log('✅ Default team created:', newTeam.name);
    return { user, team: newTeam };

  } catch (error) {
    console.error('❌ Failed to ensure user and team:', error);
    throw error;
  }
}
