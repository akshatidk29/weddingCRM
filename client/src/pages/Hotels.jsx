import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Building2, Plus, X, ChevronDown, Check, Star } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all duration-300";
const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2";

function Field({ label, children }) {
  return <div>{label && <label className={labelCls}>{label}</label>}{children}</div>;
}

/* ── Modal ── */
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const maxW = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size] || 'sm:max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#faf9f7] rounded-t-2xl sm:rounded-2xl shadow-sm border border-stone-200/60 w-full ${maxW} max-h-[92vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/60 flex-shrink-0">
          <h2 className="font-display text-xl font-medium text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200/50 text-stone-400 hover:text-stone-900 transition-all duration-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function Hotels() {
  const isAdminOrManager = useAuthStore(s => s.user?.role === 'admin' || s.user?.role === 'relationship_manager');
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [searchParams, setSearchParams] = useState({
    query: 'Hyderabad',
    checkIn: '',
    checkOut: '',
    adults: 2,
    rooms: 1
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [linkRooms, setLinkRooms] = useState(1);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (isAdminOrManager) {
      loadWeddings();
    }
  }, [isAdminOrManager]);

  const loadWeddings = async () => {
    try {
      const { data } = await api.get('/weddings');
      setWeddings(data.weddings || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadEventsForWedding = async (weddingId) => {
    try {
      if (!weddingId) {
        setEvents([]);
        return;
      }
      const { data } = await api.get(`/events/wedding/${weddingId}`);
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchParams.query) return;
    setLoading(true);
    try {
      let queryStr = `?query=${encodeURIComponent(searchParams.query)}&adults=${searchParams.adults}&rooms=${searchParams.rooms}`;
      if (searchParams.checkIn) queryStr += `&checkIn=${searchParams.checkIn}`;
      if (searchParams.checkOut) queryStr += `&checkOut=${searchParams.checkOut}`;

      const { data } = await api.get(`/hotels/search${queryStr}`);
      if (data.status && data.data && data.data.data) {
        setHotels(data.data.data);
      } else {
        setHotels([]);
      }
    } catch (error) {
      console.error('Failed to hunt for hotels', error);
      alert('Failed to find hotels. Please refine your search.');
    } finally {
      setLoading(false);
    }
  };

  const openLinkModal = (hotel) => {
    setSelectedHotel(hotel);
    setLinkRooms(searchParams.rooms);
    setSelectedWeddingId('');
    setSelectedEventId('');
    setEvents([]);
    setShowModal(true);
  };

  const closeLinkModal = () => {
    setShowModal(false);
    setSelectedHotel(null);
  };

  const handleLinkHotel = async () => {
    if (!selectedEventId || !selectedHotel) return;
    setLinking(true);
    try {
      const ev = events.find(e => e._id === selectedEventId);
      if (!ev) return;

      const photoUrl = selectedHotel.cardPhotos?.[0]?.sizes?.urlTemplate?.replace('{width}', '600').replace('{height}', '400') || '';
      
      const hotelDoc = {
        id: selectedHotel.id,
        title: selectedHotel.title,
        primaryInfo: selectedHotel.primaryInfo,
        secondaryInfo: selectedHotel.secondaryInfo,
        rating: selectedHotel.bubbleRating?.rating,
        reviewCount: selectedHotel.bubbleRating?.count,
        priceForDisplay: selectedHotel.priceForDisplay,
        priceDetails: selectedHotel.priceDetails,
        photoUrl: photoUrl,
        externalUrl: selectedHotel.commerceInfo?.externalUrl,
        roomsSelected: Number(linkRooms)
      };

      const res = await api.post(`/events/${selectedEventId}/hotels`, {
        hotel: hotelDoc
      });

      alert(res.data.message || 'Hotel linked successfully!');
      closeLinkModal();
    } catch (error) {
      console.error('Failed to link hotel', error);
      alert('Failed to link hotel. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>
      <div className="font-body min-h-screen bg-[#faf9f7] pb-12">
        
        {/* HERO HEADER */}
        <div className="bg-stone-900 py-16 px-6 sm:px-10">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Curated Stays</p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-white mb-4">Discover Extraordinary Hotels</h1>
            <p className="text-stone-400 max-w-2xl text-sm leading-relaxed">Search top-rated hotels, boutique accommodations, and luxury resorts globally, and seamlessly integrate them into your wedding events.</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200/50 p-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                  placeholder="Where are you looking?"
                  className="w-full pl-10 pr-4 py-3 bg-[#faf9f7] border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:border-stone-400 focus:bg-white transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="date" 
                  value={searchParams.checkIn}
                  onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#faf9f7] border border-stone-200/60 rounded-xl text-sm text-stone-600 focus:outline-none focus:border-stone-400 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="date" 
                  value={searchParams.checkOut}
                  onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#faf9f7] border border-stone-200/60 rounded-xl text-sm text-stone-600 focus:outline-none focus:border-stone-400 focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2 relative">
                   <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                   <input type="number" min="1" value={searchParams.adults} onChange={e => setSearchParams({...searchParams, adults: e.target.value})} className="w-full pl-9 pr-3 py-3 bg-[#faf9f7] border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:border-stone-400 focus:bg-white transition-all" placeholder="Adults" />
                </div>
                <div className="w-1/2 relative">
                   <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                   <input type="number" min="1" value={searchParams.rooms} onChange={e => setSearchParams({...searchParams, rooms: e.target.value})} className="w-full pl-9 pr-3 py-3 bg-[#faf9f7] border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:border-stone-400 focus:bg-white transition-all" placeholder="Rooms" />
                </div>
              </div>
              <div className="md:col-span-5 flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-all flex items-center justify-center min-w-[140px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Search Hotels'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 mt-10">
          {!loading && hotels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => {
                const photoUrlTemplate = hotel.cardPhotos?.[0]?.sizes?.urlTemplate;
                const photoUrl = photoUrlTemplate ? photoUrlTemplate.replace('{width}', '600').replace('{height}', '400') : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600';
                
                return (
                  <div key={hotel.id} className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col">
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                      <img src={photoUrl} alt={hotel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      {hotel.priceForDisplay && (
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                          <p className="text-sm font-bold text-stone-900">{hotel.priceForDisplay}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-display text-xl font-medium text-stone-900 leading-tight">{hotel.title}</h3>
                        {hotel.bubbleRating?.rating && (
                          <div className="flex items-center gap-1 bg-[#faf9f7] px-2 py-1 rounded-md text-stone-600 flex-shrink-0 border border-stone-100">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span className="text-xs font-bold">{hotel.bubbleRating.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-stone-500 text-xs mb-3 font-medium">{hotel.secondaryInfo}</p>
                      
                      {hotel.primaryInfo && (
                        <p className="text-sm text-stone-600 mb-2 truncate"><Check className="inline-block w-4 h-4 mr-1 text-teal-600" /> {hotel.primaryInfo}</p>
                      )}
                      {hotel.priceDetails && (
                        <p className="text-xs text-stone-400 italic mb-4">{hotel.priceDetails}</p>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                        {hotel.commerceInfo?.externalUrl ? (
                          <a href={hotel.commerceInfo.externalUrl}  className="text-xs font-medium text-[#b07d46] hover:text-[#8e6538] transition-colors">
                          </a>
                        ) : <div />}
                        
                        {isAdminOrManager && (
                          <button 
                            onClick={() => openLinkModal(hotel)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-900 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Link to Event
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && hotels.length === 0 && searchParams.query && (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/60">
              <Building2 className="w-12 h-12 text-stone-200 mx-auto mb-3" />
              <h3 className="font-display text-xl font-medium text-stone-900 mb-1">No hotels found</h3>
              <p className="text-stone-400 text-sm">Try modifying your search criteria.</p>
            </div>
          )}
        </div>

        {/* LINK MODAL */}
        <Modal isOpen={showModal} onClose={closeLinkModal} title="Link to Event">
          {selectedHotel && (
            <div className="space-y-6">
              <div className="bg-[#faf9f7] p-4 rounded-xl border border-stone-200/60 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden flex-shrink-0">
                  <img 
                    src={selectedHotel.cardPhotos?.[0]?.sizes?.urlTemplate?.replace('{width}', '100').replace('{height}', '100') || ''} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h4 className="font-medium text-stone-900 text-sm">{selectedHotel.title}</h4>
                  <p className="text-xs text-stone-500">{selectedHotel.secondaryInfo}</p>
                  <p className="text-xs font-bold text-[#b07d46] mt-1">{selectedHotel.priceForDisplay}</p>
                </div>
              </div>

              <Field label="Target Wedding">
                <div className="relative">
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <select 
                    value={selectedWeddingId}
                    onChange={(e) => {
                      setSelectedWeddingId(e.target.value);
                      setSelectedEventId('');
                      loadEventsForWedding(e.target.value);
                    }}
                    className={inputCls + " appearance-none cursor-pointer"}
                  >
                    <option value="" disabled>Select a wedding...</option>
                    {weddings.map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.clientName})</option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Target Event">
                <div className="relative">
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <select 
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    disabled={!selectedWeddingId || events.length === 0}
                    className={inputCls + " appearance-none cursor-pointer disabled:opacity-50"}
                  >
                    <option value="" disabled>
                      {!selectedWeddingId ? 'Select a wedding first...' : events.length === 0 ? 'No events found' : 'Select an event...'}
                    </option>
                    {events.map(ev => (
                      <option key={ev._id} value={ev._id}>{ev.name} ({new Date(ev.eventDate).toLocaleDateString()})</option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Rooms Needed">
                <input 
                  type="number" 
                  min="1"
                  value={linkRooms}
                  onChange={(e) => setLinkRooms(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button 
                  onClick={closeLinkModal}
                  className="flex-1 px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLinkHotel}
                  disabled={!selectedEventId || linking}
                  className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {linking ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Selection'}
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </>
  );
}
