import { supabase } from '../lib/supabase';

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported by this browser');
    return null;
  }
  if (!('PushManager' in window)) {
    console.warn('Push messaging is not supported by this browser');
    return null;
  }

  try {
    // Await ready so it registers if missing
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await saveSubscriptionToDatabase(existingSubscription);
      return existingSubscription;
    }

    // Use VAPID public key from env
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not defined in environment variables');
      return null;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    await saveSubscriptionToDatabase(subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe user:', error);
    return null;
  }
}

async function saveSubscriptionToDatabase(subscription) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Check if subscription exists by stringifying to avoid duplicates
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userData.user.id);
      
    // Remove old subscriptions to prevent duplicate pushes to same device?
    // Actually we will just insert, unless we want to uniquely identify device

    // Simply insert (assuming you want multiple device support, we insert new. 
    // To prevent spam deduplicate by checking the endpoint string)
    const subJSON = subscription.toJSON();
    const endpoint = subJSON.endpoint;
    
    // Attempt deleting previous same endpoint for this user
    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', userData.user.id)
      .contains('subscription', { endpoint });

    await supabase.from('push_subscriptions').insert({
      user_id: userData.user.id,
      subscription: subJSON
    });
    
    console.log('Push subscription saved to server.');
  } catch (err) {
    console.error('Could not save subscription to server:', err);
  }
}
