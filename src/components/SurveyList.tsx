import React from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Eye, Edit2, Trash2, CheckCircle2, AlertCircle, BarChart3, Copy, QrCode, X,
  Download, CopyPlus, Mail, Bell, ChevronDown, ChevronUp, Archive,
} from '../lib/icons';
import { SearchBar } from './ui/SearchBar';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Survey } from '../types';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import SurveyResponse from './SurveyResponse';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Tab = 'active' | 'draft' | 'archived';
type SortKey = 'title' | 'createdAt' | 'responses';
type SortDir = 'asc' | 'desc';

const TABS: { key: Tab; label: string; status: Survey['status'] }[] = [
  { key: 'active',   label: 'Active',   status: 'published' },
  { key: 'draft',    label: 'Drafts',   status: 'draft' },
  { key: 'archived', label: 'Archived', status: 'archived' },
];

function DistributeModal({ survey, onClose }: { survey: Survey; onClose: () => void }) {
  const [emailInput, setEmailInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');

  const addEmails = () => {
    const parsed = emailInput.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
    setEmails(prev => [...new Set([...prev, ...parsed])]);
    setEmailInput('');
  };

  const handleSend = async () => {
    if (emails.length === 0) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/surveys/${survey.id}/distribute`, { emails });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to distribute');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Distribute Survey</h3>
            <p className="text-sm text-gray-500 mt-0.5">{survey.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        {sent ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-semibold text-gray-900">Emails queued successfully!</p>
            <p className="text-sm text-gray-500">Survey links are being sent to {emails.length} recipients.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Done</button>
          </div>
        ) : (
          <>
            {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Add Email Addresses</label>
              <div className="flex gap-2">
                <input type="text" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEmails()}
                  placeholder="email@example.com, another@example.com"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addEmails} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Add</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Separate multiple emails with commas or press Enter</p>
            </div>

            {emails.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {emails.map(email => (
                  <div key={email} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{email}</span>
                    <button onClick={() => setEmails(emails.filter(e => e !== email))} className="text-gray-400 hover:text-red-500 ml-2"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all text-sm">Cancel</button>
              <button onClick={handleSend} disabled={sending || emails.length === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm disabled:opacity-50">
                {sending ? 'Sending...' : `Send to ${emails.length} recipient${emails.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

interface OverflowMenuProps {
  survey: Survey;
  canEdit: boolean;
  onPreview: () => void;
  onCopyLink: () => void;
  onQR: () => void;
  onDuplicate: () => void;
  onReminders: () => void;
  onEdit: () => void;
  onDelete: () => void;
  copied: boolean;
}

function OverflowMenu({
  survey, canEdit, onPreview, onCopyLink, onQR, onDuplicate, onReminders, onEdit, onDelete, copied,
}: OverflowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Position the floating menu in viewport coordinates so it escapes any
  // ancestor's overflow:hidden (the surveys card clips otherwise).
  const positionMenu = React.useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const MENU_WIDTH = 208; // matches w-52
    const MENU_HEIGHT_ESTIMATE = 360;
    const GAP = 4;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const goUp = spaceBelow < MENU_HEIGHT_ESTIMATE && spaceAbove > spaceBelow;

    const style: React.CSSProperties = {
      position: 'fixed',
      width: MENU_WIDTH,
      right: Math.max(8, window.innerWidth - rect.right),
      zIndex: 60,
    };
    if (goUp) {
      style.bottom = window.innerHeight - rect.top + GAP;
    } else {
      style.top = rect.bottom + GAP;
    }
    setMenuStyle(style);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    positionMenu();
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const reposition = () => positionMenu();
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, positionMenu]);

  const item = "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors";
  const danger = "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="More actions"
        aria-expanded={open}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span className="block leading-none text-xl select-none" aria-hidden>⋯</span>
      </button>
      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={menuStyle}
          className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1.5"
        >
          <button onClick={() => { setOpen(false); onPreview(); }} className={item}>
            <Eye size={14} className="text-gray-400" /> Preview
          </button>
          <Link
            to={`/analytics/${survey.id}`}
            onClick={() => setOpen(false)}
            className={item}
          >
            <BarChart3 size={14} className="text-gray-400" /> View analytics
          </Link>
          <button onClick={() => { setOpen(false); onCopyLink(); }} className={item}>
            <Copy size={14} className={copied ? 'text-emerald-600' : 'text-gray-400'} />
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <button onClick={() => { setOpen(false); onQR(); }} className={item}>
            <QrCode size={14} className="text-gray-400" /> QR code
          </button>
          {canEdit && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button onClick={() => { setOpen(false); onDuplicate(); }} className={item}>
                <CopyPlus size={14} className="text-gray-400" /> Duplicate
              </button>
              {survey.status === 'published' && (
                <button onClick={() => { setOpen(false); onReminders(); }} className={item}>
                  <Bell size={14} className="text-gray-400" /> Send reminders
                </button>
              )}
              {survey.status !== 'draft' && (
                <button onClick={() => { setOpen(false); onEdit(); }} className={item}>
                  <Edit2 size={14} className="text-gray-400" /> Edit
                </button>
              )}
              <div className="my-1 border-t border-gray-100" />
              <button onClick={() => { setOpen(false); onDelete(); }} className={danger}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

export default function SurveyList() {
  const { canEdit } = useAuth();
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<Tab>('active');
  const [sortKey, setSortKey] = React.useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [qrSurvey, setQrSurvey] = React.useState<Survey | null>(null);
  const [previewSurvey, setPreviewSurvey] = React.useState<Survey | null>(null);
  const [surveyToDelete, setSurveyToDelete] = React.useState<Survey | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [distributeSurvey, setDistributeSurvey] = React.useState<Survey | null>(null);

  const tabCounts = React.useMemo(() => ({
    active:   surveys.filter(s => s.status === 'published').length,
    draft:    surveys.filter(s => s.status === 'draft').length,
    archived: surveys.filter(s => s.status === 'archived').length,
  }), [surveys]);

  const tabStatus = TABS.find(t => t.key === activeTab)!.status;

  const filteredSurveys = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = surveys
      .filter(s => s.status === tabStatus)
      .filter(s => !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.createdByName && s.createdByName.toLowerCase().includes(q)) ||
        (s.departmentName && s.departmentName.toLowerCase().includes(q)) ||
        (s.customer && s.customer.toLowerCase().includes(q))
      );

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title) * dir;
      if (sortKey === 'responses') return ((a.responseCount ?? 0) - (b.responseCount ?? 0)) * dir;
      // createdAt
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
    return sorted;
  }, [surveys, tabStatus, searchQuery, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadQR = (id: string, title: string) => {
    const svg = document.getElementById(`qr-code-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const deleteSurvey = async () => {
    if (!surveyToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/surveys/${surveyToDelete.id}`);
      setSurveys(surveys.filter(s => s.id !== surveyToDelete.id));
      setSurveyToDelete(null);
    } catch (error) {
      console.error('Failed to delete survey:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const duplicateSurvey = async (survey: Survey) => {
    try {
      const newSurvey = await api.post<Survey>(`/surveys/${survey.id}/duplicate`);
      setSurveys([newSurvey, ...surveys]);
    } catch (error) {
      console.error('Failed to duplicate survey:', error);
    }
  };

  const sendReminders = async (survey: Survey) => {
    try {
      const res = await api.post<{ message: string }>(`/surveys/${survey.id}/remind`);
      alert(res.message);
    } catch (error: any) {
      alert(error.message || 'Failed to send reminders');
    }
  };

  React.useEffect(() => {
    api.get<Survey[]>('/surveys').then(data => { setSurveys(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const SortHeader = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'right' }) => {
    const active = sortKey === k;
    return (
      <th
        className={cn(
          'px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
          align === 'right' && 'text-right'
        )}
      >
        <button
          type="button"
          onClick={() => handleSort(k)}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            align === 'right' && 'flex-row-reverse',
            active ? 'text-blue-600' : 'hover:text-gray-700'
          )}
        >
          <span>{label}</span>
          {active ? (
            sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          ) : (
            <span className="w-3 inline-block" aria-hidden />
          )}
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top bar: search + create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, description, creator, department, customer…"
          shortcut="⌘K"
          className="flex-1 max-w-md"
        />
        <Link
          to="/surveys/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={18} className="mr-2" /> Create Survey
        </Link>
      </div>

      {/* Status tabs */}
      <div className="border-b border-gray-200 flex items-center gap-1">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'pb-3 px-3 -mb-px border-b-2 text-sm transition-colors flex items-center gap-2',
                active
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[11px] font-medium tabular-nums',
                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                )}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          );
        })}
        {searchQuery && (
          <span className="ml-auto text-xs text-gray-400">
            {filteredSurveys.length} match{filteredSurveys.length === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortHeader label="Survey" k="title" />
                <SortHeader label="Responses" k="responses" />
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <SortHeader label="Created" k="createdAt" />
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading surveys…</td>
                </tr>
              ) : filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      {activeTab === 'archived'
                        ? <Archive size={36} className="text-gray-200 mb-3" />
                        : <AlertCircle size={36} className="text-gray-200 mb-3" />
                      }
                      <p className="text-gray-500 font-medium">
                        {searchQuery
                          ? 'No surveys match your search'
                          : activeTab === 'active'
                            ? 'No published surveys yet'
                            : activeTab === 'draft'
                              ? 'No drafts'
                              : 'No archived surveys'}
                      </p>
                      {searchQuery ? (
                        <button onClick={() => setSearchQuery('')} className="text-blue-600 text-sm mt-2 hover:underline">Clear search</button>
                      ) : activeTab !== 'archived' && (
                        <Link to="/surveys/new" className="text-blue-600 text-sm mt-2 hover:underline">Create a survey</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => {
                  const responses = survey.responseCount;
                  return (
                    <tr key={survey.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 max-w-md">
                        <Link
                          to={`/analytics/${survey.id}`}
                          className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors block"
                        >
                          {survey.title || 'Untitled'}
                        </Link>
                        {survey.description && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{survey.description}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {survey.questions.length} question{survey.questions.length === 1 ? '' : 's'}
                          {survey.createdByName && <> · By {survey.createdByName}</>}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {responses === undefined ? (
                          <span className="text-sm text-gray-300">—</span>
                        ) : (
                          <div>
                            <span className="text-sm font-bold text-gray-900 tabular-nums">{responses}</span>
                            <p className="text-[11px] text-gray-400">response{responses === 1 ? '' : 's'}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {survey.departmentName ? (
                          <span className="text-sm text-gray-700">{survey.departmentName}</span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                        {survey.customer && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[180px]">{survey.customer}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{format(new Date(survey.createdAt), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Per-status primary action */}
                          {survey.status === 'published' && canEdit && (
                            <button
                              onClick={() => setDistributeSurvey(survey)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Mail size={14} className="mr-1.5" /> Distribute
                            </button>
                          )}
                          {survey.status === 'draft' && canEdit && (
                            <Link
                              to={`/surveys/edit/${survey.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:border-blue-300 hover:text-blue-700 transition-colors"
                            >
                              <Edit2 size={14} className="mr-1.5" /> Edit
                            </Link>
                          )}
                          {survey.status === 'archived' && (
                            <span className="text-[11px] text-gray-400 italic">archived</span>
                          )}

                          <OverflowMenu
                            survey={survey}
                            canEdit={canEdit}
                            onPreview={() => setPreviewSurvey(survey)}
                            onCopyLink={() => copyLink(survey.id)}
                            onQR={() => setQrSurvey(survey)}
                            onDuplicate={() => duplicateSurvey(survey)}
                            onReminders={() => sendReminders(survey)}
                            onEdit={() => { window.location.href = `/surveys/edit/${survey.id}`; }}
                            onDelete={() => setSurveyToDelete(survey)}
                            copied={copiedId === survey.id}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading surveys…</div>
          ) : filteredSurveys.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No surveys</p>
            </div>
          ) : (
            filteredSurveys.map((survey) => {
              const responses = survey.responseCount;
              return (
                <div key={survey.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/analytics/${survey.id}`} className="font-bold text-gray-900 block truncate">
                        {survey.title || 'Untitled'}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(survey.createdAt), 'MMM d, yyyy')}
                        {survey.departmentName && <> · {survey.departmentName}</>}
                      </p>
                    </div>
                    <OverflowMenu
                      survey={survey}
                      canEdit={canEdit}
                      onPreview={() => setPreviewSurvey(survey)}
                      onCopyLink={() => copyLink(survey.id)}
                      onQR={() => setQrSurvey(survey)}
                      onDuplicate={() => duplicateSurvey(survey)}
                      onReminders={() => sendReminders(survey)}
                      onEdit={() => { window.location.href = `/surveys/edit/${survey.id}`; }}
                      onDelete={() => setSurveyToDelete(survey)}
                      copied={copiedId === survey.id}
                    />
                  </div>
                  {survey.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{survey.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-500">
                      {responses !== undefined && <span className="font-semibold text-gray-900 tabular-nums">{responses}</span>}
                      {responses !== undefined && <span> response{responses === 1 ? '' : 's'} · </span>}
                      <span>{survey.questions.length} question{survey.questions.length === 1 ? '' : 's'}</span>
                    </div>
                    {survey.status === 'published' && canEdit && (
                      <button
                        onClick={() => setDistributeSurvey(survey)}
                        className="inline-flex items-center px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                      >
                        <Mail size={14} className="mr-1.5" /> Distribute
                      </button>
                    )}
                    {survey.status === 'draft' && canEdit && (
                      <Link
                        to={`/surveys/edit/${survey.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                      >
                        <Edit2 size={14} className="mr-1.5" /> Edit
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {surveyToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Survey?</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{surveyToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={deleteSurvey}
                  disabled={isDeleting}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting…' : 'Yes, Delete Survey'}
                </button>
                <button
                  onClick={() => setSurveyToDelete(null)}
                  disabled={isDeleting}
                  className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewSurvey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative my-8"
            >
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Survey Preview</h3>
                    <p className="text-xs text-gray-500">Viewing as a customer</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewSurvey(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-0 max-h-[80vh] overflow-y-auto bg-gray-50">
                <SurveyResponse previewSurvey={previewSurvey} isPreview={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {distributeSurvey && (
          <DistributeModal
            survey={distributeSurvey}
            onClose={() => setDistributeSurvey(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrSurvey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setQrSurvey(null)}
                className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{qrSurvey.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Scan to take the survey</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 inline-block mx-auto">
                  <QRCodeSVG
                    id={`qr-code-${qrSurvey.id}`}
                    value={`${window.location.origin}/s/${qrSurvey.id}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => downloadQR(qrSurvey.id, qrSurvey.title)}
                    className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    <Download size={18} className="mr-2" /> Download QR Code
                  </button>
                  <button
                    onClick={() => copyLink(qrSurvey.id)}
                    className="flex items-center justify-center w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
                  >
                    {copiedId === qrSurvey.id ? (
                      <span className="text-emerald-600 flex items-center">
                        <CheckCircle2 size={18} className="mr-2" /> Copied!
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Copy size={18} className="mr-2" /> Copy Link
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
