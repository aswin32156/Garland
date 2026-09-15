'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Star, TrendingUp, Package, Settings, Upload, Image as ImageIcon, X, Loader2,
  Bell, CreditCard, ShoppingBag, Check, Volume2, VolumeX, ExternalLink, Clock, CheckCircle2,
  Phone, Search, ChevronRight, ChevronDown, User, Calendar, Mail, MessageCircle, AlertCircle, RefreshCw, Zap
} from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_OCCASIONS } from '@/lib/mock-data';
import { formatPrice, formatDate, formatTimeSlot } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Garland } from '@/types';
import { useGarlandStore } from '@/store/garlandStore';
import { useOrderStore } from '@/store/orderStore';

type AdminTab = 'garlands' | 'orders' | 'categories' | 'occasions' | 'slots' | 'payments';

interface AdminDashboardViewProps {
  initialGarlands: Garland[];
}

export function AdminDashboardView({ initialGarlands }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('garlands');
  const {
    garlands,
    setGarlands,
    fetchGarlands,
    deleteGarland,
    addGarland,
    updateGarland,
    toggleAvailability,
    toggleFeatured,
    resetCatalog,
  } = useGarlandStore();

  useEffect(() => {
    if (initialGarlands && initialGarlands.length > 0) {
      setGarlands(initialGarlands);
    } else {
      fetchGarlands();
    }
  }, [initialGarlands, setGarlands, fetchGarlands]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  // Add form fields
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState(MOCK_CATEGORIES[0]?.name || 'Wedding');
  const [newOccasion, setNewOccasion] = useState(MOCK_OCCASIONS[0]?.name || 'Wedding');
  const [newFlowerType, setNewFlowerType] = useState('Fresh Flowers');
  const [newFeatured, setNewFeatured] = useState(false);
  const [newPopular, setNewPopular] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit form states
  const [editingGarland, setEditingGarland] = useState<Garland | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState(MOCK_CATEGORIES[0]?.name || 'Wedding');
  const [editOccasion, setEditOccasion] = useState(MOCK_OCCASIONS[0]?.name || 'Wedding');
  const [editFlowerType, setEditFlowerType] = useState('Fresh Blooms');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editPopular, setEditPopular] = useState(false);
  const [editAvailable, setEditAvailable] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Customer Purchases & Orders state for Admin
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('ALL');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  async function handleUpdateOrderStatus(orderNumber: string, newStatus: string) {
    try {
      // 1. Update in Supabase API
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber, status: newStatus }),
      });

      // 2. Update in local order store
      useOrderStore.getState().updateOrderStatus(orderNumber, newStatus as any);

      // 3. Update local component state
      setAdminOrders((prev) =>
        prev.map((o) => (o.order_number === orderNumber ? { ...o, status: newStatus } : o))
      );

      toast.success(`Order #${orderNumber} marked as ${newStatus.replace(/_/g, ' ')}! 🎉`);
    } catch (err: any) {
      toast.error('Could not update order status');
    }
  }

  async function loadAdminOrders() {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAdminOrders(data.data);
      } else {
        const local = useOrderStore.getState().orders;
        if (local && local.length > 0) {
          setAdminOrders(local);
        }
      }
    } catch (e) {
      const local = useOrderStore.getState().orders;
      if (local && local.length > 0) {
        setAdminOrders(local);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }

  useEffect(() => {
    loadAdminOrders();

    // Listen to local store additions
    let prevCount = useOrderStore.getState().orders.length;
    const unsub = useOrderStore.subscribe((state) => {
      if (state.orders.length > prevCount) {
        prevCount = state.orders.length;
        setAdminOrders((prev) => {
          const newOnes = state.orders.filter((o) => !prev.some((p) => p.order_number === o.order_number));
          return [...newOnes, ...prev];
        });
      }
    });

    return () => unsub();
  }, []);

  // Real-time listener for orders to keep data fresh silently
  useEffect(() => {
    let supabaseClient: any;
    let realtimeChannel: any;

    import('@/lib/supabase/client')
      .then(({ createClient }) => {
        supabaseClient = createClient();
        const chName = `admin-orders-${Math.random().toString(36).slice(2, 8)}`;
        realtimeChannel = supabaseClient
          .channel(chName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              loadAdminOrders();
            }
          )
          .subscribe();
      })
      .catch(() => {});

    return () => {
      if (supabaseClient && realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const currentGarlands = garlands.length > 0 ? garlands : initialGarlands;

  const stats = {
    total: currentGarlands.length,
    available: currentGarlands.filter((g) => g.is_available).length,
    featured: currentGarlands.filter((g) => g.is_featured).length,
    popular: currentGarlands.filter((g) => g.is_popular).length,
  };

  const filtered = currentGarlands.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function handlePublishGarland() {
    if (!newName.trim() || !newPrice) {
      toast.error('Please enter garland name and price');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = '/images/garland-rose.jpg';

    // Upload to Supabase Storage if an image file was selected
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await res.json();
        if (uploadData.success && uploadData.url) {
          finalImageUrl = uploadData.url;
        } else {
          toast.error('Image upload failed, using default garland photo');
        }
      } catch (err) {
        console.error('Error during image upload:', err);
        toast.error('Image upload failed, using default garland photo');
      }
    }

    const cat = MOCK_CATEGORIES.find((c) => c.name === newCategory) || MOCK_CATEGORIES[0];
    const occ = MOCK_OCCASIONS.find((o) => o.name === newOccasion) || MOCK_OCCASIONS[0];
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await addGarland({
      id: `gar_${Date.now()}`,
      name: newName.trim(),
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      description: newDesc.trim() || 'Handcrafted fresh flower garland made for your special occasion.',
      price: Number(newPrice),
      category_name: newCategory,
      occasion_name: newOccasion,
      category: cat,
      occasion: occ,
      flower_type: newFlowerType || 'Fresh Blooms',
      images: [finalImageUrl],
      is_available: true,
      is_featured: newFeatured,
      is_popular: newPopular,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    await fetchGarlands();

    setIsUploading(false);
    setShowAddForm(false);
    setNewName('');
    setNewPrice('');
    setNewDesc('');
    setImageFile(null);
    setImagePreview(null);
    toast.success(`"${newName}" published with image to catalog! 🌸`);
  }

  function handleOpenEdit(garland: Garland) {
    setEditingGarland(garland);
    setEditName(garland.name);
    setEditPrice(String(garland.price));
    setEditDesc(garland.description || '');
    setEditCategory(garland.category?.name || (garland as any).category_name || MOCK_CATEGORIES[0]?.name || 'Wedding');
    setEditOccasion(garland.occasion?.name || (garland as any).occasion_name || MOCK_OCCASIONS[0]?.name || 'Wedding');
    setEditFlowerType(garland.flower_type || 'Fresh Blooms');
    setEditFeatured(!!garland.is_featured);
    setEditPopular(!!garland.is_popular);
    setEditAvailable(!!garland.is_available);
    setEditImageFile(null);
    setEditImagePreview(garland.images?.[0] || null);
  }

  function handleCloseEdit() {
    setEditingGarland(null);
    setEditImageFile(null);
    setEditImagePreview(null);
  }

  function handleEditImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveEditImage() {
    setEditImageFile(null);
    setEditImagePreview(null);
  }

  async function handleSaveEdit() {
    if (!editingGarland) return;
    if (!editName.trim() || !editPrice) {
      toast.error('Please enter garland name and price');
      return;
    }

    setIsSavingEdit(true);
    let finalImageUrl = editImagePreview;

    // Upload to Supabase Storage if a new file was chosen
    if (editImageFile) {
      try {
        const formData = new FormData();
        formData.append('file', editImageFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await res.json();
        if (uploadData.success && uploadData.url) {
          finalImageUrl = uploadData.url;
        } else {
          toast.error('Image upload failed, keeping existing photo');
        }
      } catch (err) {
        console.error('Error during image upload:', err);
        toast.error('Image upload failed, keeping existing photo');
      }
    }

    const cat = MOCK_CATEGORIES.find((c) => c.name === editCategory) || MOCK_CATEGORIES[0];
    const occ = MOCK_OCCASIONS.find((o) => o.name === editOccasion) || MOCK_OCCASIONS[0];

    await updateGarland(editingGarland.id, {
      name: editName.trim(),
      price: Number(editPrice),
      description: editDesc.trim(),
      flower_type: editFlowerType || 'Fresh Blooms',
      category_name: editCategory,
      occasion_name: editOccasion,
      category: cat,
      occasion: occ,
      category_id: cat.id,
      occasion_id: occ.id,
      is_available: editAvailable,
      is_featured: editFeatured,
      is_popular: editPopular,
      images: finalImageUrl ? [finalImageUrl] : (editingGarland.images || []),
    } as any);

    await fetchGarlands();

    setIsSavingEdit(false);
    handleCloseEdit();
    toast.success(`"${editName}" updated successfully! 🌸`);
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3.5 sm:py-4 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Manage catalog & real-time customer payments</p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'garlands' && (
              <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
                <Plus className="w-4 h-4" /> Add Garland
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Garlands', value: stats.total, icon: Package, color: 'text-blue-600 bg-blue-50' },
            { label: 'Available', value: stats.available, icon: Eye, color: 'text-jade-600 bg-jade-50' },
            { label: 'Featured', value: stats.featured, icon: Star, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Popular', value: stats.popular, icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap">
          {([
            { key: 'garlands', label: '🌸 Garlands' },
            {
              key: 'orders',
              label: `🛍️ Customer Purchases ${adminOrders.length > 0 ? `(${adminOrders.length})` : ''}`,
            },
            { key: 'payments', label: '💳 Payment Gateway (Razorpay)' },
            { key: 'categories', label: '📁 Categories' },
            { key: 'occasions', label: '🎉 Occasions' },
            { key: 'slots', label: '📅 Pickup Slots' },
          ] as { key: AdminTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0',
                activeTab === tab.key
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Garland Form */}
        {showAddForm && activeTab === 'garlands' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 mb-6"
          >
            <h3 className="font-display text-lg font-bold text-gray-900 mb-4">Add New Garland</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Garland Name"
                placeholder="Rose Wedding Garland"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                label="Price (₹)"
                type="number"
                placeholder="650"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
                  rows={3}
                  placeholder="Describe the garland..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  {MOCK_CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Occasion</label>
                <select
                  value={newOccasion}
                  onChange={(e) => setNewOccasion(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  {MOCK_OCCASIONS.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                </select>
              </div>
              <Input
                label="Flower Type"
                placeholder="Rose, Jasmine, Mixed…"
                value={newFlowerType}
                onChange={(e) => setNewFlowerType(e.target.value)}
              />

              {/* ── Garland Image Upload (Supabase Storage) ── */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Garland Image <span className="text-rose-500 font-normal text-xs">(Uploaded directly to Supabase Storage)</span>
                </label>

                {imagePreview ? (
                  <div className="relative inline-block rounded-2xl border-2 border-rose-200 overflow-hidden group shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Garland preview"
                      className="w-40 h-40 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[11px] font-medium text-center py-1">
                      Ready to upload
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-rose-50/20 hover:bg-rose-50/60 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-rose-100/80 group-hover:bg-rose-200/80 flex items-center justify-center text-rose-600 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-rose-600 block">Click to upload garland photo</span>
                      <span className="text-xs text-gray-400 block mt-0.5">PNG, JPG, WebP up to 10MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-4 items-center pt-1 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-rose-500"
                    checked={newFeatured}
                    onChange={(e) => setNewFeatured(e.target.checked)}
                  /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-rose-500"
                    checked={newPopular}
                    onChange={(e) => setNewPopular(e.target.checked)}
                  /> Popular
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={handlePublishGarland} disabled={isUploading}>
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Publishing...
                  </span>
                ) : (
                  'Publish Garland'
                )}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* Garlands Tab */}
        {activeTab === 'garlands' && (
          <div>
            <div className="mb-4">
              <Input
                placeholder="Search garlands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Garland</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Price</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Badges</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((garland) => (
                      <tr key={garland.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {garland.images && garland.images[0] ? (
                              <img
                                src={garland.images[0]}
                                alt={garland.name}
                                className="w-10 h-10 rounded-lg object-cover border border-rose-100 shrink-0 shadow-xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-lg shrink-0">🌸</div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">{garland.name}</p>
                              <p className="text-xs text-gray-400">{garland.flower_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant="jade">{garland.category?.name}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatPrice(garland.price)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex gap-1 justify-center">
                            {garland.is_featured && <Badge variant="rose">⭐</Badge>}
                            {garland.is_popular && <Badge variant="gold">🔥</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleAvailability(garland.id)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
                              garland.is_available
                                ? 'bg-jade-100 text-jade-700 hover:bg-red-50 hover:text-red-600'
                                : 'bg-gray-100 text-gray-500 hover:bg-jade-50 hover:text-jade-700'
                            )}
                          >
                            {garland.is_available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {garland.is_available ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleFeatured(garland.id)}
                              className="w-8 h-8 rounded-lg hover:bg-yellow-50 flex items-center justify-center transition-colors"
                              title="Toggle featured"
                            >
                              <Star className={`w-4 h-4 ${garland.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(garland)}
                              className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit garland"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                deleteGarland(garland.id);
                                toast.success(`"${garland.name}" deleted permanently from catalog! 🗑️`);
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                              title="Delete garland"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Customer Purchases & Order Details Tab ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Header & Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
                    🛍️ Customer Purchases & Orders
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Live overview of customer purchases, garland items bought, quantities, pickup schedules, and contact details.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      loadAdminOrders();
                      toast.success('Orders refreshed!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-rose-300 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isLoadingOrders && 'animate-spin text-rose-500')} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Order Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
                  <p className="text-xs font-medium text-rose-700">Total Orders</p>
                  <p className="font-display text-2xl font-bold text-rose-900 mt-0.5">{adminOrders.length}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-700">Total Revenue</p>
                  <p className="font-display text-2xl font-bold text-emerald-900 mt-0.5">
                    {formatPrice(
                      adminOrders.reduce((sum, o) => sum + Number(o.total || o.total_amount || 0), 0)
                    )}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <p className="text-xs font-medium text-blue-700">Total Garlands Sold</p>
                  <p className="font-display text-2xl font-bold text-blue-900 mt-0.5">
                    {adminOrders.reduce(
                      (sum, o) =>
                        sum +
                        (o.items?.reduce((iSum: number, i: any) => iSum + Number(i.quantity || 1), 0) || 1),
                      0
                    )}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <p className="text-xs font-medium text-amber-700">Ready / In Progress</p>
                  <p className="font-display text-2xl font-bold text-amber-900 mt-0.5">
                    {
                      adminOrders.filter(
                        (o) => o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP' || o.status === 'ACCEPTED'
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer name, phone, order #, or garland bought..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'ALL', label: 'All Orders' },
                  { key: 'PAID', label: '💳 Paid' },
                  { key: 'READY_FOR_PICKUP', label: '🌸 Ready' },
                  { key: 'COMPLETED', label: '✅ Completed' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOrderFilterStatus(f.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                      orderFilterStatus === f.key
                        ? 'bg-rose-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Purchases List */}
            {(() => {
              const filteredOrders = adminOrders.filter((order) => {
                const q = orderSearch.toLowerCase().trim();
                const custName = (order.customer_name || order.customer?.full_name || '').toLowerCase();
                const custPhone = order.customer_phone || order.customer?.phone || '';
                const custEmail = (order.customer_email || order.customer?.email || '').toLowerCase();
                const orderNum = (order.order_number || '').toLowerCase();
                const itemsMatch = order.items?.some((i: any) =>
                  (i.garland_name || i.garland?.name || '').toLowerCase().includes(q)
                );

                const matchesSearch =
                  !q ||
                  orderNum.includes(q) ||
                  custName.includes(q) ||
                  custPhone.includes(q) ||
                  custEmail.includes(q) ||
                  itemsMatch;

                const matchesStatus =
                  orderFilterStatus === 'ALL' ||
                  order.status === orderFilterStatus ||
                  (orderFilterStatus === 'PAID' && order.payment_status === 'PAID');

                return matchesSearch && matchesStatus;
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3 text-2xl">
                      🛍️
                    </div>
                    <h4 className="font-display font-bold text-gray-900 text-base">No Customer Purchases Found</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      {orderSearch || orderFilterStatus !== 'ALL'
                        ? 'No orders match your search or filter criteria. Try clearing the filter.'
                        : 'Customer orders placed on the store will show full details of what they bought here.'}
                    </p>
                    {(orderSearch || orderFilterStatus !== 'ALL') && (
                      <button
                        onClick={() => {
                          setOrderSearch('');
                          setOrderFilterStatus('ALL');
                        }}
                        className="mt-4 px-4 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const custName = order.customer_name || order.customer?.full_name || 'Customer';
                    const custPhone = order.customer_phone || order.customer?.phone || '';
                    const custEmail = order.customer_email || order.customer?.email || '';
                    const orderTotal = Number(order.total || order.total_amount || 0);
                    const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];

                    return (
                      <div
                        key={order.id || order.order_number}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:border-rose-200 transition-all"
                      >
                        {/* Order Header */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/40 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {custName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-base">{custName}</span>
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                                  #{order.order_number}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> PAID
                                </span>
                                <span
                                  className={cn(
                                    'text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
                                    order.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'READY_FOR_PICKUP'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  )}
                                >
                                  {order.status?.replace(/_/g, ' ') || 'CONFIRMED'}
                                </span>
                              </div>

                              {/* Customer Contacts */}
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                                {custPhone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <a
                                      href={`tel:+91${custPhone.replace(/\D/g, '')}`}
                                      className="hover:text-emerald-700 font-mono font-medium hover:underline"
                                      title="Call customer"
                                    >
                                      +91 {custPhone}
                                    </a>
                                    <a
                                      href={`https://wa.me/91${custPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                        `Hello ${custName}, this is regarding your Malligai Garlands order #${order.order_number}!`
                                      )}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                                      title="WhatsApp message"
                                    >
                                      WhatsApp
                                    </a>
                                  </div>
                                )}
                                {custEmail && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <a href={`mailto:${custEmail}`} className="hover:underline text-gray-600">
                                      {custEmail}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Pickup Slot & Total */}
                          <div className="flex items-end sm:items-center sm:text-right gap-4 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                <span>Pickup: {order.pickup_date ? formatDate(order.pickup_date) : 'Today'}</span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                {order.pickup_start_time
                                  ? `${order.pickup_start_time} - ${order.pickup_end_time}`
                                  : order.pickup_time_slot || 'All-Day Pickup'}
                              </p>
                            </div>
                            <div className="pl-4 border-l border-gray-200">
                              <p className="text-[11px] font-medium text-gray-400">Total Paid</p>
                              <p className="font-display text-xl font-bold text-emerald-700 font-mono">
                                {formatPrice(orderTotal)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ── What They Bought (Garland Item Details) ── */}
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                              <ShoppingBag className="w-4 h-4 text-rose-500" />
                              What They Bought ({items.length} {items.length === 1 ? 'Garland' : 'Garlands'})
                            </h4>
                            {order.payment_id && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                Payment Ref: {order.payment_id}
                              </span>
                            )}
                          </div>

                          {items.length === 0 ? (
                            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                              No item details recorded for this order.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {items.map((item: any, idx: number) => {
                                const itemImg =
                                  item.garland_image ||
                                  item.garland?.images?.[0] ||
                                  item.image;
                                const itemTotal = Number(item.subtotal || item.unit_price * item.quantity);

                                return (
                                  <div
                                    key={item.id || idx}
                                    className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-rose-50/30 transition-colors"
                                  >
                                    {/* Garland Thumbnail */}
                                    {itemImg ? (
                                      <img
                                        src={itemImg}
                                        alt={item.garland_name}
                                        className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0 shadow-xs"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
                                        🌸
                                      </div>
                                    )}

                                    {/* Garland Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-900 text-sm line-clamp-1">
                                        {item.garland_name || item.garland?.name || 'Handcrafted Garland'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                        <span className="font-mono text-gray-700">
                                          {formatPrice(item.unit_price)} each
                                        </span>
                                        <span>•</span>
                                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
                                          Qty: {item.quantity}
                                        </span>
                                      </div>
                                      {item.customization_notes && (
                                        <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1">
                                          Note: {item.customization_notes}
                                        </p>
                                      )}
                                    </div>

                                    {/* Subtotal */}
                                    <div className="text-right shrink-0">
                                      <span className="font-bold font-mono text-sm text-gray-900">
                                        {formatPrice(itemTotal)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Action Bar / Status Controller */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500">Fulfillment Status:</span>
                              <select
                                value={order.status || 'CONFIRMED'}
                                onChange={(e) => handleUpdateOrderStatus(order.order_number, e.target.value)}
                                className="text-xs font-bold rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
                              >
                                <option value="ACCEPTED">Accepted / Confirmed</option>
                                <option value="PREPARING">Preparing Flowers</option>
                                <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                                <option value="COMPLETED">Completed / Picked Up</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                              {order.status !== 'READY_FOR_PICKUP' && order.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_number, 'READY_FOR_PICKUP')}
                                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  🌸 Mark Ready
                                </button>
                              )}
                              {order.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_number, 'COMPLETED')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ✅ Mark Completed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Manage Categories</h3>
              <Button size="sm"><Plus className="w-4 h-4" /> Add Category</Button>
            </div>
            <div className="flex flex-col gap-2">
              {MOCK_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-rose-50 transition-colors">
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occasions Tab */}
        {activeTab === 'occasions' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Manage Occasions</h3>
              <Button size="sm"><Plus className="w-4 h-4" /> Add Occasion</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MOCK_OCCASIONS.map((occ) => (
                <div key={occ.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-rose-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{occ.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm">{occ.name}</span>
                  </div>
                  <button className="text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pickup Slots Tab */}
        {activeTab === 'slots' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Pickup Slot Configuration</h3>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">Configure daily pickup time slots and maximum orders per slot.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { time: '09:00–10:00 AM', max: 5, active: true },
                { time: '10:00–11:00 AM', max: 5, active: true },
                { time: '11:00–12:00 PM', max: 5, active: true },
                { time: '04:00–05:00 PM', max: 5, active: true },
                { time: '05:00–06:00 PM', max: 5, active: true },
                { time: '06:00–07:00 PM', max: 3, active: true },
              ].map((slot) => (
                <div key={slot.time} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{slot.time}</p>
                    <p className="text-xs text-gray-500">Max {slot.max} orders/day</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={slot.max} className="w-16 text-center py-1 text-sm" />
                    <button
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors',
                        slot.active ? 'bg-jade-100 text-jade-700' : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {slot.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4">Save Slot Configuration</Button>
          </div>
        )}

        {/* ── Payment Gateway (Razorpay) Tab ── */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-gray-900">
                        Razorpay Real-Time Payment Gateway
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Automated bank-grade real-time payment processing for Malligai Garlands
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Bank Settlements Configured
                </div>
              </div>

              {/* Guarantees & Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Unpaid Orders
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    If a customer cancels payment or closes their browser, the order is <strong>never created</strong> in your database.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
                    <Zap className="w-4 h-4 text-blue-600" /> Automated Screen Sync
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    As soon as the customer inputs their 4-digit UPI PIN on GPay/PhonePe, the screen immediately confirms within 1 second.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-sm mb-1">
                    <Phone className="w-4 h-4 text-purple-600" /> Direct Customer Phone Call
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    When money clears, Owner and Admin dashboards display the customer's phone number with a 1-tap call button.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Connect Real Bank Account */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-900 text-base mb-2">
                🔗 How to Connect Your Real Bank Account (Takes 5 Minutes)
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                To receive actual real-world money straight into your bank account:
              </p>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 block mb-0.5">Create Free Razorpay Account</span>
                    Sign up at <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-rose-600 font-bold hover:underline">dashboard.razorpay.com</a> and enter your bank account details for direct settlements.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 block mb-0.5">Generate Your API Keys</span>
                    Go to <strong>Settings → API Keys</strong> and click <strong>Generate Key</strong> to get your <code className="bg-gray-200 px-1.5 py-0.5 rounded text-rose-700 font-mono">Key ID</code> and <code className="bg-gray-200 px-1.5 py-0.5 rounded text-rose-700 font-mono">Key Secret</code>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 block mb-0.5">Save in Your .env.local File</span>
                    Paste your credentials into <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-800">.env.local</code>:
                    <pre className="mt-2 p-3 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      RAZORPAY_KEY_ID=rzp_live_your_key_here{'\n'}
                      RAZORPAY_KEY_SECRET=your_secret_key_here{'\n'}
                      NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_here
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Garland Modal ── */}
      <AnimatePresence>
        {editingGarland && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">Edit Garland</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Editing: <span className="font-semibold text-rose-600">{editingGarland.name}</span></p>
                </div>
                <button
                  onClick={handleCloseEdit}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Garland Name"
                  placeholder="Rose Wedding Garland"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Input
                  label="Price (₹)"
                  type="number"
                  placeholder="650"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                  <textarea
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
                    rows={3}
                    placeholder="Describe the garland..."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                  >
                    {MOCK_CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Occasion</label>
                  <select
                    value={editOccasion}
                    onChange={(e) => setEditOccasion(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                  >
                    {MOCK_OCCASIONS.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
                <Input
                  label="Flower Type"
                  placeholder="Rose, Jasmine, Mixed…"
                  value={editFlowerType}
                  onChange={(e) => setEditFlowerType(e.target.value)}
                />

                {/* Status Toggles */}
                <div className="sm:col-span-2 flex flex-wrap gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAvailable}
                      onChange={(e) => setEditAvailable(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-400 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">In Stock / Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFeatured}
                      onChange={(e) => setEditFeatured(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-400 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Featured ⭐</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPopular}
                      onChange={(e) => setEditPopular(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-400 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Popular 🔥</span>
                  </label>
                </div>

                {/* Garland Image Edit */}
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Garland Photo
                  </label>
                  {editImagePreview ? (
                    <div className="flex items-center gap-4">
                      <div className="relative rounded-2xl border-2 border-rose-200 overflow-hidden shadow-xs shrink-0">
                        <img
                          src={editImagePreview}
                          alt="Garland"
                          className="w-28 h-28 object-cover rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors w-fit">
                          <Upload className="w-3.5 h-3.5" /> Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEditImageSelect}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveEditImage}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold text-left cursor-pointer"
                        >
                          Remove photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-rose-50/20 hover:bg-rose-50/50 transition-all">
                      <Upload className="w-5 h-5 text-rose-500" />
                      <span className="text-xs font-semibold text-rose-600">Upload new photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditImageSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handleCloseEdit}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
