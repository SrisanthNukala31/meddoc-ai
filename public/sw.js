self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body || 'You have a new medicine reminder',
        icon: data.icon || '/vite.svg',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '2',
          url: data.url || '/'
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'Medicine Reminder', options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      event.waitUntil(
        self.registration.showNotification('Medicine Reminder', {
          body: event.data.text() || 'Time to take your medicine!',
          icon: '/vite.svg'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Decide what to do when clicked (e.g. open the app)
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
