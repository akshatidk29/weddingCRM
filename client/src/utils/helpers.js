import { format, formatDistanceToNow, differenceInDays, isPast, isToday } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatRelative = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const daysUntil = (date) => {
  if (!date) return null;
  return differenceInDays(new Date(date), new Date());
};

export const isOverdue = (date) => {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const stageColors = {
  inquiry: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  proposal: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  negotiation: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  booked: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  lost: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
};

export const categoryColors = {
  fnb: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '🍽️' },
  decor: { bg: 'bg-pink-500/20', text: 'text-pink-400', icon: '🎨' },
  logistics: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🚚' },
  av: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '🎬' },
  photography: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: '📷' },
  entertainment: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🎭' },
  attire: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: '👗' },
  other: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '📋' }
};

export const vendorCategories = [
  { value: 'catering', label: 'Catering' },
  { value: 'decor', label: 'Decor' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'music', label: 'Music/DJ' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'venue', label: 'Venue' },
  { value: 'transport', label: 'Transport' },
  { value: 'invitation', label: 'Invitations' },
  { value: 'other', label: 'Other' }
];

export const taskCategories = [
  { value: 'fnb', label: 'F&B', icon: '🍽️' },
  { value: 'decor', label: 'Decor', icon: '🎨' },
  { value: 'logistics', label: 'Logistics', icon: '🚚' },
  { value: 'av', label: 'AV/Tech', icon: '🎬' },
  { value: 'photography', label: 'Photography', icon: '📷' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { value: 'attire', label: 'Attire', icon: '👗' },
  { value: 'other', label: 'Other', icon: '📋' }
];

export const leadSources = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'other', label: 'Other' }
];
