import React from 'react';
import { Plus, Search, Eye, Edit2, Archive, Trash2, CheckCircle2, BarChart3, Copy, QrCode, X, Download, CopyPlus, Mail, Bell, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Survey } from '../types';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import SurveyResponse from './SurveyResponse';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-surface border border-line max-w-md w-full shadow-xl"
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1 h-4 bg-accent flex-shrink-0" aria-hidden />
            <div className="min-w-0">
              <h3 className="text-[15px] font-medium text-ink truncate">Distribute survey</h3>
              <p className="label mt-0.5 truncate">{survey.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-ink">Emails queued successfully.</p>
              <p className="label">Sending to {emails.length} recipient{emails.length !== 1 ? 's' : ''}</p>
              <button onClick={onClose} className="px-5 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="px-3 py-2 bg-accent-soft border-l-2 border-negative text-negative text-[13px]">{error}</div>
              )}
              <div>
                <label className="label block mb-1.5">Add email addresses</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEmails();
                      }
                    }}
                    placeholder="email@example.com, another@example.com"
                    className="flex-1 px-3 py-2 border border-line bg-surface outline-none focus:border-accent text-sm"
                  />
                  <button
                    onClick={addEmails}
                    className="px-4 py-2 bg-accent hover:bg-accent-2 text-white text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="label mt-1.5">Separate with commas or press Enter</p>
              </div>

              {emails.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-line">
                  {emails.map(email => (
                    <div key={email} className="flex items-center justify-between px-3 py-1.5 border-b border-line-2 last:border-b-0 text-sm">
                      <span className="text-ink truncate">{email}</span>
                      <button
                        onClick={() => setEmails(emails.filter(e => e !== email))}
                        className="p-1 text-muted hover:text-negative hover:bg-red-50/50 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-line -mx-5 px-5 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 border border-line text-ink text-sm font-medium hover:bg-accent-soft/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || emails.length === 0}
                  className="flex-1 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending…' : `Send to ${emails.length} recipient${emails.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function SurveyList() {
  const { canEdit } = useAuth();
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [showArchived, setShowArchived] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [qrSurvey, setQrSurvey] = React.useState<Survey | null>(null);
  const [previewSurvey, setPreviewSurvey] = React.useState<Survey | null>(null);
  const [surveyToDelete, setSurveyToDelete] = React.useState<Survey | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [distributeSurvey, setDistributeSurvey] = React.useState<Survey | null>(null);

  const filteredSurveys = surveys.filter(s => {
    // Hide archived unless explicitly shown
    if (!showArchived && s.status === 'archived') return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.createdByName && s.createdByName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const archivedCount = surveys.filter(s => s.status === 'archived').length;

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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
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

  const getStatusBadge = (status: Survey['status']) => {
    switch (status) {
      case 'published':
        return <span className="label px-2 py-0.5 bg-accent text-canvas">Published</span>;
      case 'draft':
        return <span className="label px-2 py-0.5 border border-line text-muted">Draft</span>;
      case 'archived':
        return <span className="label text-muted">Archived</span>;
    }
  };

  const actionIcon = 'p-1.5 text-muted hover:text-accent hover:bg-accent-soft transition-colors';
  const destructiveIcon = 'p-1.5 text-muted hover:text-negative hover:bg-red-50/50 transition-colors';

  return (
    <div className="space-y-6">
      {/* Controls row: search + filters + Create */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by title, description, or creator…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-2 py-2 bg-transparent border-b border-line text-sm text-ink placeholder:text-muted outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="label">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-b border-line px-1 py-0.5 text-sm text-ink outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              {showArchived && <option value="archived">Archived</option>}
            </select>
          </div>
          <button
            onClick={() => {
              setShowArchived(v => !v);
              if (statusFilter === 'archived') setStatusFilter('all');
            }}
            className="flex items-center gap-1.5 label hover:text-accent transition-colors"
            title={showArchived ? 'Hide archived surveys' : 'Show archived surveys'}
          >
            {showArchived ? <EyeOff size={13} /> : <Archive size={13} />}
            {showArchived ? 'Hide archived' : `Archived${archivedCount > 0 ? ` (${archivedCount})` : ''}`}
          </button>
          <Link
            to="/surveys/new"
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-2 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Create Survey
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-line overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="data-table">
            <thead>
              <tr>
                <th>Survey Details</th>
                <th>Status</th>
                <th>Questions</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <span className="label">Loading surveys…</span>
                  </td>
                </tr>
              ) : filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="label">No surveys found</p>
                      {searchQuery ? (
                        <button onClick={() => setSearchQuery('')} className="label hover:text-accent transition-colors">
                          Clear search
                        </button>
                      ) : (
                        <Link to="/surveys/new" className="label hover:text-accent transition-colors">
                          Create your first survey
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id}>
                    <td>
                      <p className="text-sm font-medium text-ink">{survey.title}</p>
                      <p className="text-xs text-muted line-clamp-1 mt-0.5">{survey.description}</p>
                      {survey.createdByName && (
                        <p className="label mt-1">By {survey.createdByName}</p>
                      )}
                    </td>
                    <td>{getStatusBadge(survey.status)}</td>
                    <td className="tabular text-ink">{survey.questions.length}</td>
                    <td className="tabular text-muted">{format(new Date(survey.createdAt), 'MMM d, yyyy')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewSurvey(survey)}
                          className={actionIcon}
                          title="Preview Survey"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => copyLink(survey.id)}
                          className={cn(
                            'p-1.5 transition-colors',
                            copiedId === survey.id
                              ? 'text-accent bg-accent-soft'
                              : 'text-muted hover:text-accent hover:bg-accent-soft'
                          )}
                          title="Copy Survey Link"
                        >
                          {copiedId === survey.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => setQrSurvey(survey)}
                          className={actionIcon}
                          title="View QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                        <Link
                          to={`/analytics/${survey.id}`}
                          className={actionIcon}
                          title="View Analytics"
                        >
                          <BarChart3 size={16} />
                        </Link>
                        {canEdit && (
                          <>
                            <button onClick={() => duplicateSurvey(survey)} className={actionIcon} title="Duplicate">
                              <CopyPlus size={16} />
                            </button>
                            {survey.status === 'published' && (
                              <>
                                <button onClick={() => setDistributeSurvey(survey)} className={actionIcon} title="Distribute via Email">
                                  <Mail size={16} />
                                </button>
                                <button onClick={() => sendReminders(survey)} className={actionIcon} title="Send Reminders">
                                  <Bell size={16} />
                                </button>
                              </>
                            )}
                            <Link to={`/surveys/edit/${survey.id}`} className={actionIcon} title="Edit">
                              <Edit2 size={16} />
                            </Link>
                            <button onClick={() => setSurveyToDelete(survey)} className={destructiveIcon} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-line">
          {loading ? (
            <div className="p-6 text-center">
              <span className="label">Loading surveys…</span>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="p-12 text-center">
              <p className="label">No surveys found</p>
            </div>
          ) : (
            filteredSurveys.map((survey) => (
              <div key={survey.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-medium text-ink truncate">{survey.title}</h4>
                    <p className="label mt-1">{format(new Date(survey.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  {getStatusBadge(survey.status)}
                </div>
                <p className="text-sm text-muted line-clamp-2">{survey.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-line-2">
                  <span className="label tabular">{survey.questions.length} questions</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewSurvey(survey)} className={actionIcon} title="Preview">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => copyLink(survey.id)} className={actionIcon} title="Copy link">
                      {copiedId === survey.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                    <button onClick={() => setQrSurvey(survey)} className={actionIcon} title="QR code">
                      <QrCode size={16} />
                    </button>
                    <Link to={`/analytics/${survey.id}`} className={actionIcon} title="Analytics">
                      <BarChart3 size={16} />
                    </Link>
                    {canEdit && (
                      <>
                        <Link to={`/surveys/edit/${survey.id}`} className={actionIcon} title="Edit">
                          <Edit2 size={16} />
                        </Link>
                        <button onClick={() => setSurveyToDelete(survey)} className={destructiveIcon} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {surveyToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-line max-w-sm w-full shadow-xl"
            >
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-accent" aria-hidden />
                  <h3 className="text-[15px] font-medium text-ink">Delete survey</h3>
                </div>
                <button
                  onClick={() => !isDeleting && setSurveyToDelete(null)}
                  className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-ink">
                  Are you sure you want to delete <span className="font-medium">"{surveyToDelete.title}"</span>?
                </p>
                <p className="label">This action cannot be undone.</p>
                <div className="flex gap-3 pt-2 border-t border-line -mx-5 px-5 pt-4">
                  <button
                    onClick={() => setSurveyToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 py-2 border border-line text-ink text-sm font-medium hover:bg-accent-soft/60 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteSurvey}
                    disabled={isDeleting}
                    className="flex-1 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview modal */}
      <AnimatePresence>
        {previewSurvey && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-line w-full max-w-4xl shadow-xl relative my-8"
            >
              <div className="px-5 py-4 border-b border-line flex items-center justify-between sticky top-0 bg-surface z-10">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-accent" aria-hidden />
                  <div>
                    <h3 className="text-[15px] font-medium text-ink">Survey preview</h3>
                    <p className="label mt-0.5">Viewing as a customer</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewSurvey(null)}
                  className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto bg-canvas">
                <SurveyResponse previewSurvey={previewSurvey} isPreview={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Distribute modal */}
      <AnimatePresence>
        {distributeSurvey && (
          <DistributeModal
            survey={distributeSurvey}
            onClose={() => setDistributeSurvey(null)}
          />
        )}
      </AnimatePresence>

      {/* QR code modal */}
      <AnimatePresence>
        {qrSurvey && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-line max-w-sm w-full shadow-xl"
            >
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1 h-4 bg-accent flex-shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-ink truncate">{qrSurvey.title}</h3>
                    <p className="label mt-0.5">Scan to take the survey</p>
                  </div>
                </div>
                <button
                  onClick={() => setQrSurvey(null)}
                  className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex justify-center">
                  <div className="p-3 bg-surface border border-line">
                    <QRCodeSVG
                      id={`qr-code-${qrSurvey.id}`}
                      value={`${window.location.origin}/s/${qrSurvey.id}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-line -mx-5 px-5 pt-4">
                  <button
                    onClick={() => copyLink(qrSurvey.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-line text-ink text-sm font-medium hover:bg-accent-soft/60 transition-colors"
                  >
                    {copiedId === qrSurvey.id ? (
                      <>
                        <CheckCircle2 size={16} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy link
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadQR(qrSurvey.id, qrSurvey.title)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors"
                  >
                    <Download size={16} /> Download
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
