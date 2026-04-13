import React from 'react';
import { Plus, Search, Eye, Edit2, Archive, Trash2, CheckCircle2, Clock, AlertCircle, BarChart3, Copy, ExternalLink, QrCode, X, Download, CopyPlus, Mail, Bell } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
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
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Done</button>
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
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={addEmails} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add</button>
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
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm disabled:opacity-50">
                {sending ? 'Sending...' : `Send to ${emails.length} recipient${emails.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
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
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [qrSurvey, setQrSurvey] = React.useState<Survey | null>(null);
  const [previewSurvey, setPreviewSurvey] = React.useState<Survey | null>(null);
  const [surveyToDelete, setSurveyToDelete] = React.useState<Survey | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [distributeSurvey, setDistributeSurvey] = React.useState<Survey | null>(null);

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getStatusBadge = (status: Survey['status']) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={12} className="mr-1" /> Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <Clock size={12} className="mr-1" /> Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
            <Archive size={12} className="mr-1" /> Archived
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search surveys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Link
            to="/surveys/new"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={18} className="mr-2" /> Create Survey
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Survey Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading surveys...</td>
                </tr>
              ) : filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle size={48} className="text-gray-200 mb-4" />
                      <p className="text-gray-500 font-medium">No surveys found</p>
                      {searchQuery ? (
                        <button onClick={() => setSearchQuery('')} className="text-indigo-600 text-sm mt-2 hover:underline">Clear search</button>
                      ) : (
                        <Link to="/surveys/new" className="text-indigo-600 text-sm mt-2 hover:underline">Create your first survey</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{survey.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{survey.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(survey.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-medium">{survey.questions.length} questions</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{format(new Date(survey.createdAt), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setPreviewSurvey(survey)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Preview Survey"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => copyLink(survey.id)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            copiedId === survey.id ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                          )}
                          title="Copy Survey Link"
                        >
                          <Copy size={18} />
                        </button>
                        <a 
                          href={`/s/${survey.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Open Customer View"
                        >
                          <ExternalLink size={18} />
                        </a>
                        <button 
                          onClick={() => setQrSurvey(survey)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <Link
                          to={`/analytics/${survey.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Analytics"
                        >
                          <BarChart3 size={18} />
                        </Link>
                        {canEdit && (
                          <>
                            <button onClick={() => duplicateSurvey(survey)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Duplicate">
                              <CopyPlus size={18} />
                            </button>
                            {survey.status === 'published' && (
                              <>
                                <button onClick={() => setDistributeSurvey(survey)} className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" title="Distribute via Email">
                                  <Mail size={18} />
                                </button>
                                <button onClick={() => sendReminders(survey)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Send Reminders">
                                  <Bell size={18} />
                                </button>
                              </>
                            )}
                            <Link to={`/surveys/edit/${survey.id}`} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                              <Edit2 size={18} />
                            </Link>
                            <button onClick={() => setSurveyToDelete(survey)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <Trash2 size={18} />
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
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading surveys...</div>
          ) : filteredSurveys.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No surveys found</p>
            </div>
          ) : (
            filteredSurveys.map((survey) => (
              <div key={survey.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{survey.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(survey.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  {getStatusBadge(survey.status)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{survey.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-medium text-gray-500">{survey.questions.length} questions</span>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => setPreviewSurvey(survey)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => copyLink(survey.id)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                      <Copy size={18} />
                    </button>
                    <a href={`/s/${survey.id}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                      <ExternalLink size={18} />
                    </a>
                    <button onClick={() => setQrSurvey(survey)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                      <QrCode size={18} />
                    </button>
                    <Link to={`/analytics/${survey.id}`} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                      <BarChart3 size={18} />
                    </Link>
                    <Link to={`/surveys/edit/${survey.id}`} className="p-2 text-gray-400 hover:text-amber-600 rounded-lg">
                      <Edit2 size={18} />
                    </Link>
                    <button onClick={() => setSurveyToDelete(survey)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
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
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Survey'}
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

                <div className="bg-white p-4 rounded-2xl border border-gray-100 inline-block mx-auto">
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
                    className="flex items-center justify-center w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
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
