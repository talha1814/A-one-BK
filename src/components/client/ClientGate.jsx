import React, { useState, useEffect, useCallback } from 'react';
import { checkClientLicence, clientLogout } from '../../utils/licence';
import ClientLogin from './ClientLogin';
import ClientExpired from './ClientExpired';
import ClientBlocked from './ClientBlocked';
import ExpiryBanner from './ExpiryBanner';
import POS from './POS';
import Dashboard from './Dashboard';
import History from './History';
import BottomNav from './BottomNav';
import Receipt from './Receipt';
import InstallButton from './InstallButton';
import { loadPosData, saveOrder, markOrderPrinted } from '../../utils/storage';
import { triggerPrint, playBeepSound } from '../../utils/printer';
import { LogOut, Store, RefreshCw } from 'lucide-react';

export default function ClientGate() {
  const [licenceState, setLicenceState] = useState({
    status: 'LOADING', // 'LOADING' | 'NO_SESSION' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'
    client: null,
    daysLeft: 30,
    isWarning: false,
  });

  const [activeTab, setActiveTab] = useState('pos');
  const [posData, setPosData] = useState(() => loadPosData());
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Licence check function
  const runLicenceCheck = useCallback(async () => {
    const res = await checkClientLicence();
    if (res.status === 'NO_SESSION' || res.status === 'INVALID_CLIENT') {
      setLicenceState({ status: 'NO_SESSION', client: null, daysLeft: 0, isWarning: false });
    } else if (res.status === 'BLOCKED') {
      setLicenceState({ status: 'BLOCKED', client: res.client, daysLeft: 0, isWarning: false });
    } else if (res.status === 'EXPIRED') {
      setLicenceState({ status: 'EXPIRED', client: res.client, daysLeft: 0, isWarning: false });
    } else if (res.status === 'ACTIVE') {
      setLicenceState({
        status: 'ACTIVE',
        client: res.client,
        daysLeft: res.daysLeft,
        isWarning: res.isWarning,
      });
    }
  }, []);

  useEffect(() => {
    runLicenceCheck();

    // Re-check every 30 minutes
    const interval = setInterval(runLicenceCheck, 30 * 60 * 1000);

    // Re-check whenever tab becomes visible / PWA is reopened
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runLicenceCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [runLicenceCheck]);

  const clientId = licenceState.client?.id;

  useEffect(() => {
    if (clientId) {
      setPosData(loadPosData(clientId));
    }
  }, [clientId]);

  // Order save handler
  const handleSaveOrder = async ({ customerType, qty, printed }) => {
    const { newOrder, updatedData } = saveOrder({ customerType, qty, printed }, clientId);
    setPosData(updatedData);

    // Play POS confirmation beep
    playBeepSound();

    if (printed) {
      setActivePrintOrder(newOrder);
      await triggerPrint();
      markOrderPrinted(newOrder.id, clientId);
    }

    return newOrder;
  };

  const handleReprintOrder = (order) => {
    setActivePrintOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleRefreshOrders = () => {
    setPosData(loadPosData(clientId));
  };

  // State guards
  if (licenceState.status === 'LOADING') {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-3xl animate-bounce mb-4">
          🍔
        </div>
        <p className="text-sm font-extrabold text-stone-300">
          Loading A-one Bun Kabab POS...
        </p>
      </div>
    );
  }

  if (licenceState.status === 'NO_SESSION') {
    return <ClientLogin onLoginSuccess={runLicenceCheck} />;
  }

  if (licenceState.status === 'BLOCKED') {
    return <ClientBlocked client={licenceState.client} onRefresh={runLicenceCheck} />;
  }

  if (licenceState.status === 'EXPIRED') {
    return <ClientExpired client={licenceState.client} onRefresh={runLicenceCheck} />;
  }

  // ACTIVE Licence: Render POS App
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* 7-Day Expiry Warning Banner */}
      {licenceState.isWarning && <ExpiryBanner daysLeft={licenceState.daysLeft} />}

      {/* POS Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs no-print">
        <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Shop branding & client badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-xl shadow-md shadow-rose-200 text-white shrink-0">
              🍔
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-stone-900 tracking-tight leading-none">
                  {licenceState.client?.shopName || 'A-one Bun Kabab'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                  POS
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                <span className="font-semibold text-stone-600">Terminal: {licenceState.client?.username}</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">🟢 Active ({licenceState.daysLeft}d left)</span>
              </div>
            </div>
          </div>

          {/* Right Header: Desktop Nav + Install Button + Logout */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/60 mr-1">
              {[
                { id: 'pos', label: 'POS Counter' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'history', label: 'Order History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* PWA Install Button */}
            <InstallButton />

            {/* Terminal Logout */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Lock / Logout this terminal session?')) {
                  clientLogout();
                  runLicenceCheck();
                }
              }}
              title="Logout Terminal"
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 pb-16 md:pb-6">
        {activeTab === 'pos' && (
          <POS
            onSaveOrder={handleSaveOrder}
            currentOrderNumber={posData.orderCounter || 1}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            orders={posData.orders || []}
            onReprintOrder={handleReprintOrder}
          />
        )}

        {activeTab === 'history' && (
          <History
            orders={posData.orders || []}
            onReprintOrder={handleReprintOrder}
            onRefreshOrders={handleRefreshOrders}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hidden print container for window.print() */}
      {activePrintOrder && (
        <div className="print-only">
          <Receipt order={activePrintOrder} />
        </div>
      )}

      {/* Receipt Preview & Modal */}
      {isReceiptModalOpen && activePrintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-stone-100 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]">
            <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-stone-900">Thermal Receipt Preview</h3>
                <p className="text-xs text-stone-500">Order {activePrintOrder.id} • Rs {activePrintOrder.total}</p>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-stone-200/50">
              <Receipt order={activePrintOrder} isPreview={true} />
            </div>
            <div className="p-4 bg-white border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => triggerPrint()}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
