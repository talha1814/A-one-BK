import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, salesAPI } from '../api/client';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { 
  ShoppingBag, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  ChevronUp
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Play audio beep on order confirmation
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productsAPI.getAll();
      if (res.success && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast(err.message || 'Could not load products.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product) => {
    const prodId = product._id || product.id;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === prodId);
      if (existing) {
        return prevCart.map((item) =>
          item.id === prodId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          id: prodId,
          productId: prodId,
          name: product.name,
          price: product.price,
          qty: 1,
        },
      ];
    });
  };

  const handleRemoveFromCart = (product) => {
    const prodId = product._id || product.id;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === prodId);
      if (!existing) return prevCart;
      if (existing.qty <= 1) {
        return prevCart.filter((item) => item.id !== prodId);
      }
      return prevCart.map((item) =>
        item.id === prodId ? { ...item, qty: item.qty - 1 } : item
      );
    });
  };

  const handleUpdateQty = (itemId, newQty) => {
    if (newQty <= 0) {
      handleDeleteCartItem(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, qty: newQty } : item
      )
    );
  };

  const handleDeleteCartItem = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleFinalizeSale = async (orderPayload) => {
    setIsSubmitting(true);
    try {
      const res = await salesAPI.create(orderPayload);
      if (res.success) {
        playBeep();
        setCart([]);
        setMobileCartOpen(false); // Close mobile sheet if open
        showToast(
          `✅ Sale ${res.sale?.orderNumber || ''} recorded! Total: Rs ${res.sale?.total?.toLocaleString()}`,
          'success'
        );
      }
    } catch (err) {
      console.error('Finalize Sale error:', err);
      showToast(err.message || 'Failed to save sale to database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemQtyInCart = (product) => {
    const prodId = product._id || product.id;
    const found = cart.find((item) => item.id === prodId);
    return found ? found.qty : 0;
  };

  const totalCartItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalCartAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 pb-24 md:pb-8">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-16 sm:top-20 right-3 sm:right-4 left-3 sm:left-auto z-50 p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-in ${
            toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-emerald-900 text-emerald-100 border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={20} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Sound Toggle */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-rose-900/20">
            POS
          </div>
          <div>
            <h2 className="text-xs sm:text-base font-black text-stone-900 leading-tight">
              A-One Counter
            </h2>
            <p className="text-[10px] sm:text-xs text-stone-400 font-bold hidden sm:block">
              Tap cards to add Bun Kababs • Real-time cloud sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors touch-target"
            title={soundEnabled ? 'Mute beep' : 'Enable beep'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-emerald-600" /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Beep On' : 'Beep Off'}</span>
          </button>

          <button
            onClick={fetchProducts}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors touch-target"
            title="Refresh Products"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Products on Left, Cart on Right (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Products Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] sm:text-xs uppercase font-black text-stone-400 tracking-wider">
              Menu Items ({products.length})
            </h3>
            <span className="text-[11px] text-stone-400 font-semibold hidden sm:inline">
              Fast Touch Counter
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-stone-200/80 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  inCartQty={getItemQtyInCart(product)}
                  onAdd={handleAddToCart}
                  onRemove={handleRemoveFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Cart Column */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20">
            <Cart
              cart={cart}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleDeleteCartItem}
              onClearCart={handleClearCart}
              onFinalizeSale={handleFinalizeSale}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

      </div>

      {/* MOBILE STICKY FLOATING CART BAR (Displays when items are in cart on mobile) */}
      {cart.length > 0 && !mobileCartOpen && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-40 animate-slide-up">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full bg-stone-900 text-white p-3.5 rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between touch-manipulation active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-black text-xs">
                {totalCartItems}
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-white">
                  View Current Order
                </div>
                <div className="text-[11px] text-amber-400 font-mono font-bold">
                  Total: Rs {totalCartAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-rose-400 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700">
              <span>Checkout</span>
              <ChevronUp size={16} />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE FULL CART BOTTOM DRAWER / SHEET */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="w-full max-h-[92vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Cart
              cart={cart}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleDeleteCartItem}
              onClearCart={handleClearCart}
              onFinalizeSale={handleFinalizeSale}
              isSubmitting={isSubmitting}
              onCloseMobile={() => setMobileCartOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
