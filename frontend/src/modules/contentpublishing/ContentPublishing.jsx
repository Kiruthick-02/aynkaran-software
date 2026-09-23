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
  HelpCircle,
  Edit,
  Save,
} from 'lucide-react';
import API_URL from '../../config/api';

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

  // Claim Help (multi-company)
  const [claimHelpCompanies, setClaimHelpCompanies] = useState([]);
  const [activeClaimCompanyId, setActiveClaimCompanyId] = useState(null);
  const [claimCompanyName, setClaimCompanyName] = useState('');
  const [claimCompanyImageFile, setClaimCompanyImageFile] = useState(null);
  const [claimCompanyImagePreview, setClaimCompanyImagePreview] = useState('');
  const [claimCompanySaving, setClaimCompanySaving] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyImageFile, setNewCompanyImageFile] = useState(null);
  const [newCompanyImagePreview, setNewCompanyImagePreview] = useState('');
  const [newCompanyProcedures, setNewCompanyProcedures] = useState(['']);
  const [newCompanyHelplines, setNewCompanyHelplines] = useState(['']);
  const [newCompanyCreating, setNewCompanyCreating] = useState(false);
  const [procInput, setProcInput] = useState('');
  const [procEditingId, setProcEditingId] = useState(null);
  const [procEditValue, setProcEditValue] = useState('');
  const [helpInput, setHelpInput] = useState('');
  const [helpEditingId, setHelpEditingId] = useState(null);
  const [helpEditValue, setHelpEditValue] = useState('');

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
        if (data.claimHelp) {
          const cos = data.claimHelp.companies || [];
          setClaimHelpCompanies(cos);
          setActiveClaimCompanyId(null);
        }
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

  // ----- Claim Help: multi-company -----
  const activeClaimCompany = claimHelpCompanies.find((c) => c.id === activeClaimCompanyId) || null;

  const syncActiveCompany = (company) => {
    setClaimHelpCompanies((prev) => prev.map((c) => (c.id === company.id ? company : c)));
  };

  const onNewCompanyImage = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      notify('Please select an image file');
      return;
    }
    if (newCompanyImagePreview) URL.revokeObjectURL(newCompanyImagePreview);
    setNewCompanyImageFile(f);
    setNewCompanyImagePreview(URL.createObjectURL(f));
  };

  const onCreateCompany = async (e) => {
    if (e) e.preventDefault();
    const name = newCompanyName.trim();
    const validationError = validateClaimCompanyData({
      name,
      image: newCompanyImageFile || newCompanyImagePreview,
      procedures: newCompanyProcedures,
      helplines: newCompanyHelplines,
    });
    if (validationError) {
      notify(validationError);
      return;
    }
    setNewCompanyCreating(true);
    try {
      const fd = new FormData();
      fd.append('companyName', name);
      if (newCompanyImageFile) fd.append('file', newCompanyImageFile);
      const procedures = newCompanyProcedures.map((value) => value.trim()).filter(Boolean);
      const helplineNumbers = newCompanyHelplines.map((value) => onlyDigits(value)).filter(Boolean);
      if (helplineNumbers.some((number) => number.length !== 10)) {
        notify('Each helpline number must contain exactly 10 digits');
        return;
      }
      fd.append('procedures', JSON.stringify(procedures));
      fd.append('helplineNumbers', JSON.stringify(helplineNumbers));

      const created = await apiJson('/api/content/claimhelp/company', {
        method: 'POST',
        body: fd,
      });
      const co = created.company || created;
      setClaimHelpCompanies((prev) => [...prev, co]);
      setActiveClaimCompanyId(co.id);
      setClaimCompanyName(co.companyName || '');
      setClaimCompanyImagePreview(co.companyProfileImage || '');
      setClaimCompanyImageFile(null);
      setNewCompanyName('');
      setNewCompanyProcedures(['']);
      setNewCompanyHelplines(['']);
      if (newCompanyImagePreview) {
        URL.revokeObjectURL(newCompanyImagePreview);
        setNewCompanyImageFile(null);
        setNewCompanyImagePreview('');
      }
      setShowNewCompanyForm(false);
      notify('Company added');
    } catch (err) {
      notify(err.message || 'Failed to add company');
    } finally {
      setNewCompanyCreating(false);
    }
  };

  const resetNewCompanyForm = () => {
    setShowNewCompanyForm(false);
    setNewCompanyName('');
    setNewCompanyProcedures(['']);
    setNewCompanyHelplines(['']);
    if (newCompanyImagePreview) {
      URL.revokeObjectURL(newCompanyImagePreview);
      setNewCompanyImageFile(null);
      setNewCompanyImagePreview('');
    }
  };

  const onClaimCompanyImage = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      notify('Please select an image file');
      return;
    }
    if (claimCompanyImagePreview && !activeClaimCompany?.companyProfileImage) {
      URL.revokeObjectURL(claimCompanyImagePreview);
    }
    setClaimCompanyImageFile(f);
    setClaimCompanyImagePreview(URL.createObjectURL(f));
  };

  const removeClaimCompanyImage = () => {
    if (claimCompanyImagePreview && !activeClaimCompany?.companyProfileImage) {
      URL.revokeObjectURL(claimCompanyImagePreview);
    }
    setClaimCompanyImageFile(null);
    setClaimCompanyImagePreview('');
  };

  const saveClaimCompanyProfile = async (e) => {
    if (e) e.preventDefault();
    if (!activeClaimCompanyId) {
      notify('Select or add a company first');
      return;
    }
    const name = claimCompanyName.trim();
    const validationError = validateClaimCompanyData({
      name,
      image: claimCompanyImageFile || claimCompanyImagePreview,
      procedures: companyProcedures,
      helplines: activeClaimCompany?.helplineNumbers || [],
    });
    if (validationError) {
      notify(validationError);
      return;
    }
    setClaimCompanySaving(true);
    try {
      const fd = new FormData();
      fd.append('companyName', name);
      if (claimCompanyImageFile) fd.append('file', claimCompanyImageFile);

      const saved = await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}`, {
        method: 'PUT',
        body: fd,
      });
      const co = saved.company || saved;
      syncActiveCompany(co);
      setClaimCompanyName(co.companyName || name);
      setClaimCompanyImagePreview(co.companyProfileImage || '');
      setClaimCompanyImageFile(null);
      notify('Claim Help profile saved');
    } catch (err) {
      notify(err.message || 'Failed to save profile');
    } finally {
      setClaimCompanySaving(false);
    }
  };

  const deleteClaimCompany = async (id) => {
    const name = claimHelpCompanies.find((c) => c.id === id)?.companyName || 'company';
    if (!window.confirm(`Remove "${name}" and all its Claim Help data?`)) return;
    try {
      await apiJson(`/api/content/claimhelp/company/${id}`, { method: 'DELETE' });
      setClaimHelpCompanies((prev) => prev.filter((c) => c.id !== id));
      if (activeClaimCompanyId === id) {
        setActiveClaimCompanyId(null);
        setClaimCompanyName('');
        setClaimCompanyImagePreview('');
        setClaimCompanyImageFile(null);
      }
      notify('Company removed');
    } catch (err) {
      notify(err.message || 'Failed to remove company');
    }
  };

  // Sync the profile form fields whenever the active company changes
  useEffect(() => {
    if (activeClaimCompany) {
      setClaimCompanyName(activeClaimCompany.companyName || '');
      setClaimCompanyImagePreview(activeClaimCompany.companyProfileImage || '');
      setClaimCompanyImageFile(null);
    } else {
      setClaimCompanyName('');
      setClaimCompanyImagePreview('');
      setClaimCompanyImageFile(null);
    }
  }, [activeClaimCompanyId]);

  // ----- Claim Help: Procedures (per company) -----
  const companyProcedures = activeClaimCompany?.procedures || [];

  const addProcedure = async () => {
    if (!activeClaimCompanyId) return notify('Select a company first');
    const text = procInput.trim();
    if (!text) {
      notify('Enter a procedure step');
      return;
    }
    try {
      const saved = await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/procedures`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const item = saved.item || saved;
      setClaimHelpCompanies((prev) =>
        prev.map((c) =>
          c.id === activeClaimCompanyId
            ? { ...c, procedures: [...(c.procedures || []), item] }
            : c
        )
      );
      setProcInput('');
      notify('Procedure step added');
    } catch (err) {
      notify(err.message || 'Failed to add procedure');
    }
  };

  const startEditProcedure = (id, text) => {
    setProcEditingId(id);
    setProcEditValue(text);
  };

  const saveEditProcedure = async (id) => {
    if (!activeClaimCompanyId) return;
    const text = procEditValue.trim();
    if (!text) {
      notify('Procedure text cannot be empty');
      return;
    }
    try {
      const saved = await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/procedures/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ text }),
      });
      const updated = saved.item || saved;
      setClaimHelpCompanies((prev) =>
        prev.map((c) =>
          c.id === activeClaimCompanyId
            ? { ...c, procedures: c.procedures.map((p) => (p.id === id ? updated : p)) }
            : c
        )
      );
      setProcEditingId(null);
      notify('Procedure updated');
    } catch (err) {
      notify(err.message || 'Failed to update procedure');
    }
  };

  const cancelEditProcedure = () => {
    setProcEditingId(null);
    setProcEditValue('');
  };

  const deleteProcedure = async (id) => {
    if (!activeClaimCompanyId) return;
    if (!window.confirm('Remove this procedure step?')) return;
    try {
      await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/procedures/${id}`, { method: 'DELETE' });
      setClaimHelpCompanies((prev) =>
        prev.map((c) =>
          c.id === activeClaimCompanyId
            ? { ...c, procedures: c.procedures.filter((p) => p.id !== id) }
            : c
        )
      );
      notify('Procedure step removed');
    } catch (err) {
      notify(err.message || 'Failed to remove procedure');
    }
  };

  const moveProcedure = async (index, direction) => {
    if (!activeClaimCompanyId) return;
    const list = [...companyProcedures];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setClaimHelpCompanies((prev) =>
      prev.map((c) => (c.id === activeClaimCompanyId ? { ...c, procedures: list } : c))
    );
    try {
      await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/procedures/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: list.map((p) => p.id) }),
      });
    } catch (e) {
      notify(e.message || 'Reorder failed');
    }
  };

  const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 10);

  const validateClaimCompanyData = ({ name, image, procedures, helplines }) => {
    const safeName = String(name || '').trim();
    if (!safeName) return 'Company name is required';
    if (!image) return 'Company profile image is required';

    const validProcedures = (procedures || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    if (validProcedures.length === 0) return 'At least one procedure step is required';

    const validHelplines = (helplines || [])
      .map((item) => onlyDigits(String(item || '')))
      .filter((item) => item.length === 10);
    if (validHelplines.length === 0) return 'At least one valid 10-digit helpline number is required';
    if (validHelplines.length !== (helplines || []).map((item) => onlyDigits(String(item || ''))).filter((item) => item).length) {
      return 'Each helpline number must contain exactly 10 digits';
    }

    return null;
  };

  const newCompanyFormReady = Boolean(
    newCompanyName.trim() &&
      (newCompanyImagePreview || newCompanyImageFile) &&
      newCompanyProcedures.some((item) => String(item || '').trim()) &&
      newCompanyHelplines.some((item) => onlyDigits(String(item || '')).length === 10)
  );

  const activeCompanyFormReady = Boolean(
    claimCompanyName.trim() &&
      (claimCompanyImagePreview || claimCompanyImageFile) &&
      companyProcedures.some((item) => String(item?.text || '').trim()) &&
      (activeClaimCompany?.helplineNumbers || []).some((item) => String(item?.number || '').length === 10)
  );

  const addHelpline = async () => {
    if (!activeClaimCompanyId) return notify('Select a company first');
    const number = onlyDigits(helpInput);
    if (!number || number.length !== 10) {
      notify('Enter a valid 10-digit helpline number');
      return;
    }
    try {
      const saved = await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/helplines`, {
        method: 'POST',
        body: JSON.stringify({ number }),
      });
      const item = saved.item || saved;
      setClaimHelpCompanies((prev) =>
        prev.map((c) =>
          c.id === activeClaimCompanyId
            ? { ...c, helplineNumbers: [...(c.helplineNumbers || []), item] }
            : c
        )
      );
      setHelpInput('');
      notify('Helpline number added');
    } catch (err) {
      notify(err.message || 'Failed to add helpline');
    }
  };

  const startEditHelpline = (id, number) => {
    setHelpEditingId(id);
    setHelpEditValue(number);
  };

  const saveEditHelpline = async (id) => {
    if (!activeClaimCompanyId) return;
    const number = onlyDigits(helpEditValue);
    if (!number || number.length !== 10) {
      notify('Helpline number must be exactly 10 digits');
      return;
    }
    try {
      const saved = await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/helplines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ number }),
      });
      const updated = saved.item || saved;
      setClaimHelpCompanies((prev) =>
        prev.map((c) =>
          c.id === activeClaimCompanyId
            ? { ...c, helplineNumbers: c.helplineNumbers.map((h) => (h.id === id ? updated : h)) }
            : c
        )
      );
      setHelpEditingId(null);
      notify('Helpline number updated');
    } catch (err) {
      notify(err.message || 'Failed to update helpline');
    }
  };

  const cancelEditHelpline = () => {
    setHelpEditingId(null);
    setHelpEditValue('');
  };

  const deleteHelpline = async (id) => {
    if (!activeClaimCompanyId) return;
    if (!window.confirm('Remove this helpline number?')) return;
    try {
      await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/helplines/${id}`, { method: 'DELETE' });
      setClaimHelpCompanies((prev) =>
        prev.map((c) =>
          c.id === activeClaimCompanyId
            ? { ...c, helplineNumbers: c.helplineNumbers.filter((h) => h.id !== id) }
            : c
        )
      );
      notify('Helpline number removed');
    } catch (err) {
      notify(err.message || 'Failed to remove helpline');
    }
  };

  const moveHelpline = async (index, direction) => {
    if (!activeClaimCompanyId) return;
    const list = [...(activeClaimCompany?.helplineNumbers || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setClaimHelpCompanies((prev) =>
      prev.map((c) => (c.id === activeClaimCompanyId ? { ...c, helplineNumbers: list } : c))
    );
    try {
      await apiJson(`/api/content/claimhelp/company/${activeClaimCompanyId}/helplines/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: list.map((h) => h.id) }),
      });
    } catch (e) {
      notify(e.message || 'Reorder failed');
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
    { id: 'claimhelp', label: 'Claim Help', icon: HelpCircle },
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

    {/* ========== CLAIM HELP (multi-company) ========== */}
    {tab === 'claimhelp' && (
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-bold text-white">Claim Help</h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Manage multiple company profiles shown on the website <strong>Claim Help</strong> section. For each company, add Procedure steps and Contact helpline numbers with the <Plus className="w-3 h-3 inline" /> buttons. Helpline numbers accept exactly 10 digits. Changes sync to the public website.
          </p>
        </div>

        {/* ===== Company cards + New company form ===== */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Companies</h3>
            <button
              type="button"
              onClick={() => setShowNewCompanyForm(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Company
            </button>
          </div>

          {claimHelpCompanies.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">
              No companies added yet. Add your first company below.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {claimHelpCompanies.map((co) => (
                <div
                  key={co.id}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    activeClaimCompanyId === co.id
                      ? 'bg-blue-600/15 border-blue-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveClaimCompanyId(co.id);
                      setShowNewCompanyForm(false);
                    }}
                    className="w-full flex items-center gap-3"
                  >
                    {co.companyProfileImage ? (
                      <img src={mediaUrl(co.companyProfileImage)} alt="" className="w-11 h-11 rounded-lg object-contain bg-slate-950 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate">{co.companyName || co.name || 'Unnamed'}</span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        {(co.procedures || []).length} procedure{(co.procedures || []).length === 1 ? '' : 's'} · {(co.helplineNumbers || []).length} helpline{(co.helplineNumbers || []).length === 1 ? '' : 's'}
                      </span>
                    </span>
                  </button>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={() => setActiveClaimCompanyId(co.id)}
                      className="flex-1 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      <Edit className="w-3 h-3 inline mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteClaimCompany(co.id)}
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-600/80 hover:bg-rose-600 text-white"
                      title="Delete company"
                    >
                      <Trash2 className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {showNewCompanyForm && (
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={resetNewCompanyForm}>
            <form
              onSubmit={onCreateCompany}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Add New Company</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Add the company profile, procedures, and contact helpline numbers.</p>
                </div>
                <button type="button" onClick={resetNewCompanyForm} className="text-slate-400 hover:text-white" title="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Company Profile</label>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-950/50 hover:border-blue-500/50 px-3 py-5 cursor-pointer min-h-[130px]">
                    {newCompanyImagePreview ? (
                      <img src={newCompanyImagePreview} alt="" className="max-h-24 rounded object-contain" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-slate-500" />
                        <span className="text-[11px] text-slate-400">Click to choose image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={onNewCompanyImage} />
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Company name *</label>
                  <input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Company name"
                    maxLength={60}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                  <span className="block text-right text-[10px] text-slate-600">{newCompanyName.length}/60</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-bold">Procedures</label>
                <div className="space-y-2">
                  {newCompanyProcedures.map((procedure, index) => (
                    <div key={`procedure-${index}`} className="flex gap-2">
                      <input
                        value={procedure}
                        onChange={(e) => setNewCompanyProcedures((prev) => prev.map((value, itemIndex) => itemIndex === index ? e.target.value : value))}
                        placeholder="Enter a procedure step"
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                      {index === newCompanyProcedures.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setNewCompanyProcedures((prev) => [...prev, ''])}
                          className="w-9 rounded-lg bg-[#0078d4] hover:bg-blue-600 text-white flex items-center justify-center"
                          title="Add procedure"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNewCompanyProcedures((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                          title="Remove procedure"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-bold">Contact Helpline number</label>
                <div className="space-y-2">
                  {newCompanyHelplines.map((number, index) => (
                    <div key={`helpline-${index}`} className="flex gap-2">
                      <input
                        value={number}
                        onChange={(e) => setNewCompanyHelplines((prev) => prev.map((value, itemIndex) => itemIndex === index ? onlyDigits(e.target.value) : value))}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="10-digit helpline number"
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                      />
                      {index === newCompanyHelplines.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setNewCompanyHelplines((prev) => [...prev, ''])}
                          className="w-9 rounded-lg bg-[#0078d4] hover:bg-blue-600 text-white flex items-center justify-center"
                          title="Add helpline number"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNewCompanyHelplines((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                          title="Remove helpline number"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">Only numbers are accepted, with a maximum of 10 digits per field.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button type="button" onClick={resetNewCompanyForm} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newCompanyCreating || !newCompanyFormReady}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white disabled:opacity-60 flex items-center gap-1.5"
                >
                  {newCompanyCreating ? 'Saving…' : <><Save className="w-3.5 h-3.5" /> Save Company</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== Active company profile ===== */}
        {activeClaimCompany ? (
          <>
            {/* Company Profile Image + Company Name + Save */}
            <form
              onSubmit={saveClaimCompanyProfile}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Company Profile</h3>
                <button
                  type="button"
                  onClick={() => deleteClaimCompany(activeClaimCompany.id)}
                  className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                  title="Delete company"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Company Profile Image */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Company Profile image *</label>
                  <label
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-5 cursor-pointer min-h-[120px] ${
                      claimCompanyImagePreview
                        ? 'border-slate-600 bg-slate-900/50 hover:border-blue-500/50'
                        : 'border-slate-600 bg-slate-900/50 hover:border-blue-500/50'
                    }`}
                  >
                    {claimCompanyImagePreview ? (
                      <img src={claimCompanyImagePreview} alt="" className="max-h-28 rounded object-contain" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-slate-500" />
                        <span className="text-[11px] text-slate-400">Click to choose image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onClaimCompanyImage}
                    />
                  </label>
                  {claimCompanyImagePreview && (
                    <button
                      type="button"
                      onClick={removeClaimCompanyImage}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Remove image
                    </button>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-1 xl:self-end">
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Company name *</label>
                  <div className="relative">
                    <input
                      value={claimCompanyName}
                      onChange={(e) => setClaimCompanyName(e.target.value)}
                      placeholder="e.g. Aynkaran Consultants"
                      maxLength={60}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">{claimCompanyName.length}/60</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={claimCompanySaving || !activeCompanyFormReady}
                className="w-full py-2 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {claimCompanySaving ? 'Saving…' : <><Save className="w-3.5 h-3.5" /> Save Profile</>}
              </button>
            </form>

            {/* ===== Procedure (add + edit) ===== */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Procedure</h3>
              <p className="text-[10px] text-slate-500">
                Add each step of the claim procedure. Click the pencil icon to edit a step. Use ↑↓ to reorder.
              </p>

              <div className="flex gap-2">
                <input
                  value={procInput}
                  onChange={(e) => setProcInput(e.target.value)}
                  placeholder="e.g. Submit your claim form online…"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addProcedure}
                  className="inline-flex items-center gap-1 px-3 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {companyProcedures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
                  No procedure steps yet. Type a step and click +.
                </div>
              ) : (
                <div className="space-y-2">
                  {companyProcedures.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 flex gap-2 items-start"
                    >
                      <div className="flex-1 min-w-0">
                        {procEditingId === item.id ? (
                          <textarea
                            value={procEditValue}
                            onChange={(e) => setProcEditValue(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500 resize-y"
                          />
                        ) : (
                          <p className="text-xs text-slate-200 leading-snug whitespace-pre-wrap">
                            {item.text}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">Order: {index + 1}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {procEditingId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditProcedure(item.id)}
                              className="p-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditProcedure}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditProcedure(item.id, item.text)}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveProcedure(index, -1)}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === companyProcedures.length - 1}
                          onClick={() => moveProcedure(index, 1)}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProcedure(item.id)}
                          className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===== Contact helpline number (10 digits only) ===== */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Contact Helpline number</h3>
              <p className="text-[10px] text-slate-500">
                Add helpline numbers. Only numeric digits are allowed (exactly 10 digits).
              </p>

              <div className="flex gap-2">
                <input
                  value={helpInput}
                  onChange={(e) => setHelpInput(onlyDigits(e.target.value))}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="10-digit helpline, e.g. 9876543210"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={addHelpline}
                  className="inline-flex items-center gap-1 px-3 rounded-lg text-xs font-bold bg-[#0078d4] hover:bg-blue-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {(activeClaimCompany?.helplineNumbers || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
                  No helpline numbers yet. Type a 10-digit number and click +.
                </div>
              ) : (
                <div className="space-y-2">
                  {(activeClaimCompany?.helplineNumbers || []).map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 flex gap-2 items-start"
                    >
                      <div className="flex-1 min-w-0">
                        {helpEditingId === item.id ? (
                          <input
                            value={helpEditValue}
                            onChange={(e) => setHelpEditValue(onlyDigits(e.target.value))}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                          />
                        ) : (
                          <p className="text-xs text-slate-200 font-mono leading-snug">
                            {item.number}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">Order: {index + 1}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {helpEditingId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditHelpline(item.id)}
                              className="p-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditHelpline}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditHelpline(item.id, item.number)}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveHelpline(index, -1)}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === (activeClaimCompany?.helplineNumbers || []).length - 1}
                          onClick={() => moveHelpline(index, 1)}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHelpline(item.id)}
                          className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
            No company selected. Add a company to get started.
          </div>
        )}
      </div>
    )}

      </div>

      <PreviewModal item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}