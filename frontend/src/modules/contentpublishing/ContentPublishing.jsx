// frontend/src/modules/content/ContentPublishing.jsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Newspaper,
  Images,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  Film,
  X,
  CheckCircle2,
  LayoutTemplate,
  Play,
  Megaphone,
  ChevronUp,
  ChevronDown,
  Plus,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860';

const NEWS_CATEGORIES = [
  'Educational',
  'Industry Updates',
  'Tips & Guide',
  'Recruitment',
];

function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function isVideoFile(fileOrPath) {
  if (!fileOrPath) return false;
  if (fileOrPath instanceof File) return fileOrPath.type.startsWith('video/');
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(String(fileOrPath));
}

async function apiJson(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Request failed');
  }
  return res.json();
}

// ---------- Shorts / Reels style card ----------
function ShortsCard({ item, onView, onDelete }) {
  const url = mediaUrl(item.url || item.coverImage || item.image);
  const video = item.type === 'video' || isVideoFile(item.url || item.image);

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-lg w-[160px] shrink-0">
      <div className="aspect-[9/16] bg-slate-950 relative">
        {url ? (
          video ? (
            <video
              src={url}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : (
            <img src={url} alt={item.title || ''} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        {video && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white flex items-center gap-1">
            <Film className="w-3 h-3" /> Video
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[11px] font-bold text-white line-clamp-2 leading-snug">
            {item.title || 'Untitled'}
          </p>
          {item.category && (
            <p className="text-[9px] text-slate-300 mt-0.5 uppercase tracking-wider">
              {item.category}
            </p>
          )}
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button type="button" onClick={() => onView?.(item)} className="p-2 rounded-full bg-white/90 text-slate-900 hover:bg-white" title="Preview">
            <Eye className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onDelete?.(item)} className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ item, onClose }) {
  if (!item) return null;
  const url = mediaUrl(item.url || item.coverImage || item.image);
  const video = item.type === 'video' || isVideoFile(item.url || item.image);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{item.title || 'Preview'}</p>
            {item.category && <p className="text-[10px] text-slate-400 uppercase">{item.category}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-black flex items-center justify-center max-h-[70vh]">
          {video ? (
            <video src={url} controls autoPlay className="max-w-full max-h-[70vh]" />
          ) : (
            <img src={url} alt="" className="max-w-full max-h-[70vh] object-contain" />
          )}
        </div>
        {item.description && (
          <div className="p-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800">
            {item.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Ordered Poster Column ----------
function PosterColumn({ title, colorClass, items, audience, onUpload, onDelete, onMove, uploading }) {
  const inputId = `poster-upload-${audience}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`text-[10px] uppercase tracking-widest font-bold ${colorClass}`}>{title}</p>
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#0078d4] hover:bg-blue-600 text-white cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Image
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onUpload(audience, f);
          }}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
          No images yet. Click “Add Image”.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const url = mediaUrl(item.url);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 flex gap-3 items-start"
              >
                <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                  {url ? (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[11px] text-slate-300 truncate">{item.fileName || 'Poster'}</p>
                  <p className="text-[10px] text-slate-500">Order: {index + 1}</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMove(audience, index, -1)}
                      className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => onMove(audience, index, 1)}
                      className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uploading === audience && (
        <p className="text-[11px] text-blue-400 font-bold">Uploading…</p>
      )}
    </div>
  );
}

// ---------- Announcement Column ----------
function AnnouncementColumn({
  title,
  colorClass,
  items,
  audience,
  onAdd,
  onDelete,
  onMove,
}) {
  const [text, setText] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const textareaRef = React.useRef(null);

  const handleAdd = () => {
    if (!text.trim()) {
      setError('Announcement text is required');
      return;
    }
    setError('');
    onAdd(audience, text.trim(), label.trim());
    setText('');
    setLabel('');
  };

  const applyBold = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      // nothing selected – wrap whole text or just insert ** **
      setText((prev) => prev + '****');
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(prev.length + 2, prev.length + 2);
      }, 0);
      return;
    }
    const newText = text.slice(0, start) + '**' + text.slice(start, end) + '**' + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 2, end + 2);
    }, 0);
  };

  return (
    <div className="space-y-3">
      <p className={`text-[10px] uppercase tracking-widest font-bold ${colorClass}`}>{title}</p>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Optional label (e.g. Careers)"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
        />

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError('');
            }}
            rows={3}
            placeholder="Announcement text… (select text and click Bold)"
            className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-xs text-white outline-none resize-y
              ${error ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'}`}
          />
          <button
            type="button"
            onClick={applyBold}
            className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white"
            title="Make selected text bold (**text**)"
          >
            B
          </button>
        </div>

        {error && <p className="text-[10px] text-rose-400 font-medium">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-2 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Announcement
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 flex gap-2 items-start"
            >
              <div className="flex-1 min-w-0">
                {item.label && (
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded mb-1">
                    {item.label}
                  </span>
                )}
                <p className="text-xs text-slate-200 leading-snug whitespace-pre-wrap">
                  {item.text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={i}>{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Order: {index + 1}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMove(audience, index, -1)}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => onMove(audience, index, 1)}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== MAIN ====================
export default function ContentPublishing({ onShowNotification }) {
  const notify = (msg) => {
    if (typeof onShowNotification === 'function') onShowNotification(msg);
    else console.log('[Content]', msg);
  };

  const [tab, setTab] = useState('posters');
  const [loading, setLoading] = useState(true);

  const [customerPosters, setCustomerPosters] = useState([]);
  const [advisorPosters, setAdvisorPosters] = useState([]);
  const [uploadingAudience, setUploadingAudience] = useState(null);

  const [news, setNews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [preview, setPreview] = useState(null);

  const [customerAnnouncements, setCustomerAnnouncements] = useState([]);
  const [advisorAnnouncements, setAdvisorAnnouncements] = useState([]);

  // News form
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDesc, setNewsDesc] = useState('');
  const [newsCategory, setNewsCategory] = useState(NEWS_CATEGORIES[0]);
  const [newsFile, setNewsFile] = useState(null);
  const [newsPreview, setNewsPreview] = useState('');
  const [newsSaving, setNewsSaving] = useState(false);

  // ---------- Categories ----------
const [newsCategories, setNewsCategories] = useState([
  'Educational', 'Industry Updates', 'Tips & Guide', 'Recruitment',
]);
const [galleryCategories, setGalleryCategories] = useState([
  'Events', 'Training', 'Meetings', 'Awards', 'Office',
]);
const [newCatName, setNewCatName] = useState('');
const [addingCatFor, setAddingCatFor] = useState(null); // 'news' | 'gallery' | null

// ---------- Field errors ----------
const [newsErrors, setNewsErrors] = useState({});
const [galErrors, setGalErrors] = useState({});

// ---------- Announcement bold helper ----------
const makeBold = (text, start, end) => {
  if (start === end) return text;
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  return `${before}**${selected}**${after}`;
};
  

  // Gallery form
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState('Events');
  const [galFile, setGalFile] = useState(null);
  const [galPreview, setGalPreview] = useState('');
  const [galSaving, setGalSaving] = useState(false);

  

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson('/api/content');
      if (data && data.success !== false && !data.error) {
        setCustomerPosters(data.posters?.customers || []);
        setAdvisorPosters(data.posters?.advisors || []);
        setNews(data.news || data.posts || []);
        setGallery(data.gallery || []);
        setCustomerAnnouncements(data.announcements?.customers || []);
        setAdvisorAnnouncements(data.announcements?.advisors || []);
      }

      if (data.categories) {
  if (Array.isArray(data.categories.news)) setNewsCategories(data.categories.news);
  if (Array.isArray(data.categories.gallery)) setGalleryCategories(data.categories.gallery);
}

    } catch (e) {
      console.warn(e);
      notify(e.message || 'Could not refresh content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

const addCategory = async (type) => {
  const name = newCatName.trim();
  if (!name) return notify('Category name is required');
  try {
    await apiJson('/api/content/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
    if (type === 'news') {
      setNewsCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setNewsCategory(name);
    } else {
      setGalleryCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setGalCategory(name);
    }
    setNewCatName('');
    setAddingCatFor(null);
    notify(`Category “${name}” added`);
  } catch (e) {
    notify(e.message || 'Failed to add category');
  }
};

  // ----- Posters -----
  const uploadPoster = async (audience, file) => {
    setUploadingAudience(audience);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('audience', audience);
      const saved = await apiJson('/api/content/posters', { method: 'POST', body: fd });
      const poster = saved.poster || saved;
      if (audience === 'customers') {
        setCustomerPosters((prev) => [...prev, poster]);
      } else {
        setAdvisorPosters((prev) => [...prev, poster]);
      }
      notify(`Poster added (${audience})`);
    } catch (e) {
      notify(e.message || 'Upload failed');
    } finally {
      setUploadingAudience(null);
    }
  };

  const deletePoster = async (item) => {
    if (!window.confirm('Remove this poster from the website?')) return;
    try {
      await apiJson(`/api/content/posters/${item.id}`, { method: 'DELETE' });
    } catch (_) {}
    setCustomerPosters((prev) => prev.filter((p) => p.id !== item.id));
    setAdvisorPosters((prev) => prev.filter((p) => p.id !== item.id));
    notify('Poster removed');
  };

  const movePoster = async (audience, index, direction) => {
    const list = audience === 'customers' ? [...customerPosters] : [...advisorPosters];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;

    [list[index], list[newIndex]] = [list[newIndex], list[index]];

    if (audience === 'customers') setCustomerPosters(list);
    else setAdvisorPosters(list);

    try {
      await apiJson('/api/content/posters/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          audience,
          orderedIds: list.map((p) => p.id),
        }),
      });
    } catch (e) {
      notify(e.message || 'Reorder failed');
      loadAll();
    }
  };

  // ----- Announcements -----
  const addAnnouncement = async (audience, text, label) => {
    try {
      const saved = await apiJson('/api/content/announcements', {
        method: 'POST',
        body: JSON.stringify({ audience, text, label }),
      });
      const item = saved.item || saved;
      if (audience === 'customers') {
        setCustomerAnnouncements((prev) => [...prev, item]);
      } else {
        setAdvisorAnnouncements((prev) => [...prev, item]);
      }
      notify('Announcement added');
    } catch (e) {
      notify(e.message || 'Failed to add announcement');
    }
  };

  const deleteAnnouncement = async (item) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiJson(`/api/content/announcements/${item.id}`, { method: 'DELETE' });
    } catch (_) {}
    setCustomerAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
    setAdvisorAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
    notify('Announcement deleted');
  };

  const moveAnnouncement = async (audience, index, direction) => {
    const list = audience === 'customers' ? [...customerAnnouncements] : [...advisorAnnouncements];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;

    [list[index], list[newIndex]] = [list[newIndex], list[index]];

    if (audience === 'customers') setCustomerAnnouncements(list);
    else setAdvisorAnnouncements(list);

    try {
      await apiJson('/api/content/announcements/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          audience,
          orderedIds: list.map((a) => a.id),
        }),
      });
    } catch (e) {
      notify(e.message || 'Reorder failed');
      loadAll();
    }
  };

  // ----- News -----
  const onNewsFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (newsPreview) URL.revokeObjectURL(newsPreview);
    setNewsFile(f);
    setNewsPreview(URL.createObjectURL(f));
  };

  const saveNews = async (e) => {
  e.preventDefault();
  const errors = {};
  if (!newsTitle.trim()) errors.title = 'Title is required';
  if (!newsDesc.trim()) errors.description = 'Description is required';
  if (!newsFile && !newsPreview) errors.cover = 'Cover image is required';

  setNewsErrors(errors);
  if (Object.keys(errors).length > 0) {
    notify(Object.values(errors)[0]);
    return;
  }

  setNewsSaving(true);
  try {
    const fd = new FormData();
    fd.append('title', newsTitle.trim());
    fd.append('description', newsDesc.trim());
    fd.append('category', newsCategory);
    if (newsFile) fd.append('file', newsFile);

    const saved = await apiJson('/api/content/news', { method: 'POST', body: fd });
    setNews((prev) => [saved.post || saved, ...prev]);
    setNewsTitle('');
    setNewsDesc('');
    setNewsCategory(newsCategories[0] || 'Educational');
    setNewsFile(null);
    setNewsPreview('');
    setNewsErrors({});
    notify('News post published');
  } catch (err) {
    notify(err.message || 'Failed to publish news');
  } finally {
    setNewsSaving(false);
  }
};

  const deleteNews = async (item) => {
    if (!window.confirm(`Delete news “${item.title}”?`)) return;
    try {
      if (item.id) await apiJson(`/api/content/news/${item.id}`, { method: 'DELETE' });
    } catch (_) {}
    setNews((prev) => prev.filter((n) => n.id !== item.id));
    notify('News deleted');
  };

  // ----- Gallery -----
  const onGalFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (galPreview) URL.revokeObjectURL(galPreview);
    setGalFile(f);
    setGalPreview(URL.createObjectURL(f));
  };

  const saveGallery = async (e) => {
  e.preventDefault();
  const errors = {};
  if (!galTitle.trim()) errors.title = 'Title is required';
  if (!galFile) errors.file = 'Image or video is required';

  setGalErrors(errors);
  if (Object.keys(errors).length > 0) {
    notify(Object.values(errors)[0]);
    return;
  }

  setGalSaving(true);
  try {
    const fd = new FormData();
    fd.append('title', galTitle.trim());
    fd.append('category', galCategory);
    fd.append('file', galFile);
    fd.append('type', isVideoFile(galFile) ? 'video' : 'image');

    const saved = await apiJson('/api/content/gallery', { method: 'POST', body: fd });
    setGallery((prev) => [saved.item || saved, ...prev]);
    setGalTitle('');
    setGalCategory(galleryCategories[0] || 'Events');
    setGalFile(null);
    setGalPreview('');
    setGalErrors({});
    notify('Gallery item added');
  } catch (err) {
    notify(err.message || 'Failed to add gallery item');
  } finally {
    setGalSaving(false);
  }
};

  const deleteGallery = async (item) => {
    if (!window.confirm(`Delete “${item.title}” from gallery?`)) return;
    try {
      if (item.id) await apiJson(`/api/content/gallery/${item.id}`, { method: 'DELETE' });
    } catch (_) {}
    setGallery((prev) => prev.filter((g) => g.id !== item.id));
    notify('Gallery item deleted');
  };

  const tabs = [
    { id: 'posters', label: 'Posters', icon: LayoutTemplate },
    { id: 'news', label: 'News / Blogs', icon: Newspaper },
    { id: 'gallery', label: 'Gallery', icon: Images },
    { id: 'announcements', label: 'Live Announcement', icon: Megaphone },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0b1220] text-slate-200">
      <div className="px-5 pt-4 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                active
                  ? 'bg-white text-slate-900 border-white'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={loadAll}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {loading && <p className="text-xs text-slate-500">Loading content…</p>}

        {/* ========== POSTERS ========== */}
        {tab === 'posters' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Website sidebar posters</h2>
              <p className="text-[11px] text-slate-400 mt-1">
                Add images for Customers (left) and Advisors (right). Use ↑↓ to set the display order on the website.
                Customer posters open the Enquiry form; Advisor posters open the Advisor form.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PosterColumn
                title="Left · Customers"
                colorClass="text-blue-400"
                items={customerPosters}
                audience="customers"
                onUpload={uploadPoster}
                onDelete={deletePoster}
                onMove={movePoster}
                uploading={uploadingAudience}
              />
              <PosterColumn
                title="Right · Advisors"
                colorClass="text-amber-400"
                items={advisorPosters}
                audience="advisors"
                onUpload={uploadPoster}
                onDelete={deletePoster}
                onMove={movePoster}
                uploading={uploadingAudience}
              />
            </div>
          </div>
        )}

        {/* ========== NEWS ========== */}
{tab === 'news' && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <form onSubmit={saveNews} className="xl:col-span-1 rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3 h-fit">
      <h2 className="text-sm font-bold text-white flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-blue-400" />
        New article
      </h2>

      {/* Title */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Title *</label>
        <input
          value={newsTitle}
          onChange={(e) => {
            setNewsTitle(e.target.value);
            setNewsErrors((p) => ({ ...p, title: undefined }));
          }}
          className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-xs text-white outline-none
            ${newsErrors.title ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'}`}
          placeholder="Article title"
        />
        {newsErrors.title && (
          <p className="text-[10px] text-rose-400 font-medium">{newsErrors.title}</p>
        )}
      </div>

      {/* Category + Add new */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Category *</label>
        <div className="flex gap-2">
          <select
            value={newsCategory}
            onChange={(e) => setNewsCategory(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
          >
            {newsCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAddingCatFor(addingCatFor === 'news' ? null : 'news')}
            className="px-2.5 rounded-lg text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white"
          >
            + New
          </button>
        </div>
        {addingCatFor === 'news' && (
          <div className="flex gap-2 mt-1">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none"
            />
            <button type="button" onClick={() => addCategory('news')} className="px-2 py-1 rounded bg-blue-600 text-xs font-bold text-white">
              Add
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Description *</label>
        <textarea
          value={newsDesc}
          onChange={(e) => {
            setNewsDesc(e.target.value);
            setNewsErrors((p) => ({ ...p, description: undefined }));
          }}
          rows={4}
          className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-xs text-white outline-none resize-y
            ${newsErrors.description ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'}`}
          placeholder="Short summary shown on the website card"
        />
        {newsErrors.description && (
          <p className="text-[10px] text-rose-400 font-medium">{newsErrors.description}</p>
        )}
      </div>

      {/* Cover image */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Cover image *</label>
        <label
          className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-6 cursor-pointer min-h-[120px]
            ${newsErrors.cover ? 'border-rose-500 bg-rose-500/5' : 'border-slate-600 bg-slate-900/50 hover:border-blue-500/50'}`}
        >
          {newsPreview ? (
            <img src={newsPreview} alt="" className="max-h-28 rounded object-contain" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-slate-500" />
              <span className="text-[11px] text-slate-400">Click to choose image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onNewsFile(e);
              setNewsErrors((p) => ({ ...p, cover: undefined }));
            }}
          />
        </label>
        {newsErrors.cover && (
          <p className="text-[10px] text-rose-400 font-medium">{newsErrors.cover}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={newsSaving}
        className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white disabled:opacity-60"
      >
        {newsSaving ? 'Publishing…' : 'Publish article'}
      </button>
    </form>

    <div className="xl:col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Published articles</h2>
        <span className="text-[10px] text-slate-500 font-mono">{news.length} item(s)</span>
      </div>
      {news.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
          No articles yet.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {news.map((item) => (
            <ShortsCard
              key={item.id}
              item={{ ...item, url: item.coverImage || item.image || item.url }}
              onView={setPreview}
              onDelete={deleteNews}
            />
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* ========== GALLERY ========== */}
{tab === 'gallery' && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <form onSubmit={saveGallery} className="xl:col-span-1 rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3 h-fit">
      <h2 className="text-sm font-bold text-white flex items-center gap-2">
        <Images className="w-4 h-4 text-emerald-400" />
        Add to gallery
      </h2>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Title *</label>
        <input
          value={galTitle}
          onChange={(e) => {
            setGalTitle(e.target.value);
            setGalErrors((p) => ({ ...p, title: undefined }));
          }}
          className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-xs text-white outline-none
            ${galErrors.title ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'}`}
          placeholder="e.g. Team training day"
        />
        {galErrors.title && (
          <p className="text-[10px] text-rose-400 font-medium">{galErrors.title}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Category *</label>
        <div className="flex gap-2">
          <select
            value={galCategory}
            onChange={(e) => setGalCategory(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
          >
            {galleryCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAddingCatFor(addingCatFor === 'gallery' ? null : 'gallery')}
            className="px-2.5 rounded-lg text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white"
          >
            + New
          </button>
        </div>
        {addingCatFor === 'gallery' && (
          <div className="flex gap-2 mt-1">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none"
            />
            <button type="button" onClick={() => addCategory('gallery')} className="px-2 py-1 rounded bg-emerald-600 text-xs font-bold text-white">
              Add
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate-400 font-bold">Image or video *</label>
        <label
          className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-6 cursor-pointer min-h-[140px]
            ${galErrors.file ? 'border-rose-500 bg-rose-500/5' : 'border-slate-600 bg-slate-900/50 hover:border-emerald-500/50'}`}
        >
          {galPreview ? (
            isVideoFile(galFile) ? (
              <video src={galPreview} className="max-h-32 rounded" muted />
            ) : (
              <img src={galPreview} alt="" className="max-h-32 rounded object-contain" />
            )
          ) : (
            <>
              <Film className="w-5 h-5 text-slate-500" />
              <span className="text-[11px] text-slate-400 text-center">Click to choose image / video</span>
            </>
          )}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              onGalFile(e);
              setGalErrors((p) => ({ ...p, file: undefined }));
            }}
          />
        </label>
        {galErrors.file && (
          <p className="text-[10px] text-rose-400 font-medium">{galErrors.file}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={galSaving}
        className="w-full py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
      >
        {galSaving ? 'Uploading…' : 'Add to gallery'}
      </button>
    </form>

    <div className="xl:col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Gallery feed</h2>
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
          <Play className="w-3 h-3" />
          {gallery.length}
        </span>
      </div>
      {gallery.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
          No gallery items yet.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {gallery.map((item) => (
            <ShortsCard key={item.id} item={item} onView={setPreview} onDelete={deleteGallery} />
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* ========== LIVE ANNOUNCEMENT ========== */}
{tab === 'announcements' && (
  <div className="space-y-4">
    <div>
      <h2 className="text-sm font-bold text-white">Live Announcement (Marquee)</h2>
      <p className="text-[11px] text-slate-400 mt-1">
        Texts appear in the website marquee ticker. Left side (blue) = Customers · Right side (yellow) = Advisors.
        Select text and click <strong>B</strong> to make it bold. Use ↑↓ to control the sequence order.
      </p>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <AnnouncementColumn
        title="Customers (Blue)"
        colorClass="text-blue-400"
        items={customerAnnouncements}
        audience="customers"
        onAdd={addAnnouncement}
        onDelete={deleteAnnouncement}
        onMove={moveAnnouncement}
      />
      <AnnouncementColumn
        title="Advisors (Yellow)"
        colorClass="text-amber-400"
        items={advisorAnnouncements}
        audience="advisors"
        onAdd={addAnnouncement}
        onDelete={deleteAnnouncement}
        onMove={moveAnnouncement}
      />
    </div>
  </div>
)}

      </div>

      <PreviewModal item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}