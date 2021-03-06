var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
      .register('/service-worker.js')
      .then(function () {
        console.log('Service worker registered!');
      })
      .catch(function(err) {
        console.log(err);
      });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        var options = {
            body: 'You successfully subscribed to our Notification Service!',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/image/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US', // BCP 47
            vibrate: [100, 50, 200], // Vibration
            badge: '/src/images/icons/app-icon-96x96.png', // On Android
            // ADVANCE OPTIONS
            tag: 'confirm-notification',
            renotify: true, // Inform many times
            actions: [
                {
                    action: 'confirm',
                    title: 'Okay',
                    icon: '/src/images/icons/app-icon-96x96.png'
                },
                {
                    action: 'cancel',
                    title: 'Cancel',
                    icon: '/src/images/icons/app-icon-96x96.png'
                }
            ]
        };
        navigator.serviceWorker.ready
            .then(function (swreg) {
                swreg.showNotification('Successfully subscribed!', options);
            })
    }
}

function configurePushSub() {
    // Przypomnienie o sprawdzaniu dostępności SW w przeglądarce
    if (!('serviceWorker' in navigator)) {
        return
    }

    var reg;
    navigator.serviceWorker.ready
        .then(function (swreg) {
            reg = swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function (sub) {
            if (sub === null) {
                // Create a new subscription
                var vapidPublicKey = 'BLXBI1UPncvFYfKOfqlHc6upNhNLmOYnroAKRiYT5zg4u68Ah6el02P3Rd4o8MXp6CoyJlnb-fvilJLMDpZpytk';
                var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
                reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            } else {
                // We have already a sub
            }
        })
        .then(function (newSub) {
            fetch('https://pwacourse-e3e2b.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSub)
            })
        })
        .then(function (res) {
            if (res.ok) {
                displayConfirmNotification();
            }
        })
        .catch(function (err) {
            console.log(err);
        })
}

function askForNotificationPermission() {
    Notification.requestPermission(function (result) {
        console.log('User Choice', result);
        if (result !== 'granted') {
            console.log('No notification premission granted!');
        } else {
            configurePushSub();
            //displayConfirmNotification();
        }
    })
}

/* Sprawdzenie czy wyszukiwarka wspiera notification */
if ('Notification' in window && 'serviceWorker' in navigator) {
    for (var i=0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
    }
}