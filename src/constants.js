export const PRODUCT = {
  id: 'bun-kabab',
  name: 'Bun Kabab',
  price: 80,
  currency: 'Rs',
  description: 'Authentic Daal & Shami patty with fluffy spiced egg, crisp onions, tangy tamarind & mint chutney in toasted golden buns.',
};

export const CUSTOMER_TYPES = {
  WALKIN: 'walkin',
  FOODPANDA: 'foodpanda',
};

export const CUSTOMER_TYPE_CONFIG = {
  [CUSTOMER_TYPES.WALKIN]: {
    id: 'walkin',
    label: 'WALK-IN CUSTOMER',
    shortLabel: 'Walk-in',
    subtext: 'Dine-in / Takeaway counter',
    color: '#16a34a', // emerald-600
    themeBg: 'bg-emerald-600',
    themeBgLight: 'bg-emerald-50',
    themeBorder: 'border-emerald-600',
    themeText: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    chartColor: '#10b981',
  },
  [CUSTOMER_TYPES.FOODPANDA]: {
    id: 'foodpanda',
    label: 'FOOD PANDA ORDER',
    shortLabel: 'Food Panda',
    subtext: 'Rider delivery pickup',
    color: '#d70f64', // Foodpanda magenta/pink
    themeBg: 'bg-[#d70f64]',
    themeBgLight: 'bg-pink-50',
    themeBorder: 'border-[#d70f64]',
    themeText: 'text-[#d70f64]',
    badgeClass: 'bg-pink-100 text-[#d70f64] border-pink-300',
    chartColor: '#d70f64',
  },
};

export const SHOP_INFO = {
  name: 'A-one Bun Kabab',
  tagline: 'Authentic Street Flavor Since 1998',
  address: 'Burns Road Food Street, Karachi',
  phone: '0300-1234567 / 021-32210000',
};

export const STORAGE_KEY = 'aone_bun_kabab_pos_v1';
