// ========================================
// SUPABASE AUTH INTEGRATION HELPER
// ========================================
// Add this to your AuthContext.jsx to properly integrate with Supabase

// Import these at the top:
// import { supabase } from '../lib/supabase';

// Add this function to create user profile after signup
const createUserProfile = async (userId, email) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    
    if (error) {
      console.error('Error creating user profile:', error);
      // Don't throw - user is already created, profile is just metadata
    } else {
      console.log('User profile created successfully');
    }
  } catch (err) {
    console.error('Failed to create user profile:', err);
  }
};

// Add this function to initialize user data
const initializeUserData = async (user) => {
  if (!user) return;
  
  try {
    // Create profile if it doesn't exist
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (profileError?.code === 'PGRST116') { // Not found
      await createUserProfile(user.id, user.email);
    } else if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
    }
  } catch (err) {
    console.error('Error initializing user data:', err);
  }
};

// Updated AuthProvider pattern (for reference):
/*
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        initializeUserData(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user && event === 'SIGNED_IN') {
          initializeUserData(session.user);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await createUserProfile(data.user.id, data.user.email);
      setUser(data.user);
    }
    return { error };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await initializeUserData(data.user);
      setUser(data.user);
    }
    return { error };
  };

  // ... other auth methods
}
*/

// Export for use in your app
export { createUserProfile, initializeUserData };
