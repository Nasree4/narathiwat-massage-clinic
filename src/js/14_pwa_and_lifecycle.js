/**
 * Module 14: 14_pwa_and_lifecycle.js
 * Description: PWA Service Worker, Auto-Update & Online Status
 * Generated from lines 23208 to 23488 of original index.html
 */

    /* =========================================================================
       INSTANT SERVICE WORKER & MULTI-DEVICE AUTO-UPDATE ENGINE (v5.3.0)
       ========================================================================= */
    function initServiceWorker() {
      if (!('serviceWorker' in navigator)) return;

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] New ServiceWorker activated! Reloading page with latest updates...');
          window.location.reload();
        }
      });

      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('[PWA] TTM Clinic ServiceWorker registered successfully:', reg.scope);
          reg.update().catch(() => {});

          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version ready, commanding SKIP_WAITING...');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });

          // Check for code updates every 15s in background
          setInterval(() => {
            if (navigator.onLine && document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          }, 15000);

          // Check for code updates on tab focus / visibility
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
              if (typeof loadAllDataFromSupabase === 'function') {
                loadAllDataFromSupabase(true);
              }
            }
          });
        })
        .catch(err => console.warn('[PWA] ServiceWorker registration error:', err));
    }

    // Global listener to keep dropdowns open until user finishes selecting
    document.addEventListener('pointerdown', (e) => {
      if (e.target && (e.target.tagName === 'SELECT' || e.target.closest('select'))) {
        isUserInteractingWithDropdown = true;
        lastDropdownInteractionTime = Date.now();
      }
    }, true);

    document.addEventListener('focusin', (e) => {
      if (e.target && e.target.tagName === 'SELECT') {
        isUserInteractingWithDropdown = true;
        lastDropdownInteractionTime = Date.now();
      }
    }, true);

    document.addEventListener('focusout', (e) => {
      if (e.target && e.target.tagName === 'SELECT') {
        setTimeout(() => {
          const active = document.activeElement;
          if (!active || (active.tagName !== 'SELECT' && active.tagName !== 'INPUT')) {
            isUserInteractingWithDropdown = false;
            if (pendingDeskQueueRender) {
              pendingDeskQueueRender = false;
              renderDeskQueue(true);
            }
            if (pendingStatsRender) {
              pendingStatsRender = false;
              renderStatsAndShare(true);
            }
          }
        }, 350);
      }
    }, true);

    // Initialize Service Worker immediately!
    initServiceWorker();

    window.onload = function () {
      initTheme();
      applyLanguage(currentLang);

      document.getElementById("new-book-date").value = todayStr;
      updateSelectedSlotButtonUI('new', "");
      if (document.getElementById("desk-filter-date-start")) document.getElementById("desk-filter-date-start").value = todayStr;
      if (document.getElementById("desk-filter-date-end")) document.getElementById("desk-filter-date-end").value = todayStr;
      document.getElementById("stats-date-input").value = todayStr;
      document.getElementById("manage-selected-date").value = todayStr;

      const ym = todayStr.substring(0, 7);
      document.getElementById("stats-month-input").value = ym;

      const deskSlotFilter = document.getElementById("desk-filter-slot");
      if (deskSlotFilter) {
        const allUniqueSlots = Array.from(new Set([...WEEKDAY_SLOTS, ...SATURDAY_SLOTS])).sort();
        allUniqueSlots.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s;
          const isSatOnly = SATURDAY_SLOTS.includes(s) && !WEEKDAY_SLOTS.includes(s);
          opt.textContent = isSatOnly ? `${formatTimeLabel(s)} (เฉพาะวันเสาร์)` : formatTimeLabel(s);
          deskSlotFilter.appendChild(opt);
        });
      }

      renderMainServicesOptions("main-services-booking-container");
      renderExtraServicesCheckboxes("new-extra-services-container");
      populateAssistantsDropdown("new-assistant-select");
      initReviewModalStars();

      if (document.getElementById("audit-filter-start")) document.getElementById("audit-filter-start").value = "";
      if (document.getElementById("audit-filter-end")) document.getElementById("audit-filter-end").value = "";

      updateAuthUI();
      updateHeroLiveClock();
      setInterval(updateHeroLiveClock, 1000);

      navigateDefaultTabForUser(currentUser);

      // Initialize Supabase Connection
      initSupabase();

      updateNotificationBadgeUI();

      // Continuous Realtime Sync Heartbeat (Every 5 seconds across all devices)
      setInterval(() => {
        if (supabaseClient && document.visibilityState === 'visible') {
          loadAllDataFromSupabase(true);
        }
      }, 5000);

      // Periodic Auto-refresh for live elapsed timers (every 30s)
      setInterval(() => {
        const deskTab = document.getElementById("view-desk");
        if (deskTab && !deskTab.classList.contains("hidden")) {
          renderDeskQueue();
        }
        if (currentTimingModalAptId) {
          const apt = appointments.find(a => a.id === currentTimingModalAptId);
          if (apt) renderPatientTimingModal(apt);
        }
      }, 30000);

      // Instant Resync when user unlocks phone/iPad or switches back to app tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log("App tab became active, performing instant Cloud sync...");
          if (supabaseClient) {
            subscribeToRealtime();
            loadAllDataFromSupabase(true);
          }
        }
      });

      window.addEventListener('focus', () => {
        if (supabaseClient) {
          loadAllDataFromSupabase(true);
        }
      });

      // Sync when online event triggers
      window.addEventListener('online', () => {
        console.log("Device is back online, syncing with Supabase Cloud...");
        if (supabaseClient) {
          loadAllDataFromSupabase(true);
        }
      });

      lucide.createIcons();
    };

    // PWA Install Prompt Handler
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
      }
    });

    async function installPWA() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('ติดตั้งแอปพลิเคชันลงบนอุปกรณ์เรียบร้อยแล้ว!', 'success');
        }
        deferredPrompt = null;
        const installBtn = document.getElementById('btn-pwa-install');
        if (installBtn) {
          installBtn.classList.add('hidden');
          installBtn.classList.remove('flex');
        }
      } else {
        showToast('สามารถติดตั้งแอปได้โดยกดปุ่มแชร์/เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)', 'info');
      }
    }

    // System Version & Force Update Check Handler (Multi-Device Auto-Sync)
    async function checkSystemUpdate(interactive = false) {
      if (interactive) {
        showToast(`กำลังตรวจสอบและซิงค์การอัปเดตทุกอุปกรณ์... (${APP_VERSION})`, 'info');
      }

      // Sync DOM version tags
      const headerTag = document.getElementById('app-header-version-tag');
      if (headerTag) headerTag.textContent = APP_VERSION;
      const footerTag = document.getElementById('app-footer-version-tag');
      if (footerTag) footerTag.textContent = APP_VERSION;
      const settingsTag = document.getElementById('app-settings-version-tag');
      if (settingsTag) settingsTag.textContent = APP_VERSION;
      const modalFooterTag = document.getElementById('app-modal-footer-version');
      if (modalFooterTag) modalFooterTag.textContent = APP_VERSION;
      const buildDateTag = document.getElementById('app-settings-build-date');
      if (buildDateTag) buildDateTag.textContent = APP_BUILD_DATE;

      // 1. Service Worker Update Check
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              showToast('พบเวอร์ชันใหม่! กำลังรีโหลดเพื่อใช้งานเวอร์ชันล่าสุด...', 'success');
              setTimeout(() => {
                window.location.reload();
              }, 600);
              return;
            }
          }
        } catch (e) {
          console.warn('SW update check error:', e);
        }
      }

      // 2. Refresh Supabase Data across all modules
      if (typeof loadAllDataFromSupabase === 'function') {
        try {
          await loadAllDataFromSupabase(false);
        } catch (err) {
          console.warn('Supabase sync during update check:', err);
        }
      }

      // 3. Broadcast Realtime App Update signal to other connected devices
      if (typeof supabaseClient !== 'undefined' && supabaseClient && realtimeChannel) {
        try {
          await realtimeChannel.send({
            type: "broadcast",
            event: "system_app_update",
            payload: { version: APP_VERSION, timestamp: new Date().toISOString() }
          });
        } catch(e) {}
      }

      if (interactive) {
        setTimeout(() => {
          showToast(`✅ อัปเดตและซิงค์ข้อมูลล่าสุดเรียบร้อยแล้ว (${APP_VERSION})`, 'success');
        }, 500);
      }
    }
  

