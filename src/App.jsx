import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import PosScreen from './components/PosScreen';
import DashboardScreen from './components/DashboardScreen';
import HistoryScreen from './components/HistoryScreen';
import ThermalReceipt from './components/ThermalReceipt';
import ThermalReceiptModal from './components/ThermalReceiptModal';
import { loadPosData, saveOrder, markOrderPrinted } from './utils/storage';
import { triggerPrintReceipt } from './utils/thermalPrinter';

export default function App() {
  const [posData, setPosData] = useState(() => loadPosData());
  const [activeTab, setActiveTab] = useState('pos');
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Load and refresh orders
  const refreshOrders = () => {
    const fresh = loadPosData();
    setPosData(fresh);
  };

  // Register PWA service worker and listen to beforeinstallprompt
  useEffect(() => {
    // Check if app is launched in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('ServiceWorker registered with scope:', reg.scope))
          .catch((err) => console.log('ServiceWorker registration failed:', err));
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle Install button click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for iOS or already triggered
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert('To install on iPhone/iPad: Tap the Share button (square with arrow) and tap "Add to Home Screen".');
      } else {
        alert('To install A-one POS: Click the 3 dots in your browser menu and choose "Install App" or "Add to Home Screen".');
      }
    }
  };

  // Save order handler
  const handleSaveOrder = async ({ customerType, qty, printed }) => {
    const { newOrder, updatedData } = saveOrder({ customerType, qty, printed });
    setPosData(updatedData);

    if (printed) {
      setActivePrintOrder(newOrder);
      // Trigger print
      await triggerPrintReceipt(newOrder);
      // Mark as printed
      markOrderPrinted(newOrder.id);
    }

    return newOrder;
  };

  // Re-print or open modal from History / Dashboard
  const handleReprintOrder = (order) => {
    setActivePrintOrder(order);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Header / Navbar */}
      <Navbar
        deferredPrompt={deferredPrompt}
        onInstallClick={handleInstallClick}
        isInstalled={isInstalled}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-6">
        {activeTab === 'pos' && (
          <PosScreen
            onSaveOrder={handleSaveOrder}
            currentOrderNumber={posData.orderCounter || 1}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardScreen
            orders={posData.orders || []}
            onReprintOrder={handleReprintOrder}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            orders={posData.orders || []}
            onReprintOrder={handleReprintOrder}
            onRefreshOrders={refreshOrders}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Hidden print element that gets activated when window.print() is called */}
      {activePrintOrder && (
        <div className="print-only">
          <ThermalReceipt order={activePrintOrder} />
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      <ThermalReceiptModal
        order={activePrintOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}
