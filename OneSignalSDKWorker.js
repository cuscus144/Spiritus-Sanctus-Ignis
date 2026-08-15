/* ==========================================================================
   Combined Service Worker for Divine Increase Business Network
   Handles BOTH: OneSignal push notifications AND offline PWA caching.
   This single file controls the site's root scope (only one worker can).
   ========================================================================== */

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
importScripts('/service-worker.js');
