// test-auth.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAuth() {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';
  
  console.log(`Attempting to sign up ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  
  if (signUpError) {
    console.error('Sign up error:', signUpError.message);
    return;
  }
  
  console.log('Sign up successful:', signUpData.user ? signUpData.user.id : 'No user returned');
  
  console.log(`Attempting to sign in ${testEmail}...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (signInError) {
    console.error('Sign in error:', signInError.message);
  } else {
    console.log('Sign in successful! Session token:', signInData.session ? 'Exists' : 'Missing');
  }
}

testAuth();
