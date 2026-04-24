import React from 'react';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Settings2, Eye, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { Question, QuestionType, Survey, Department } from '../types';
import SurveyResponse from './SurveyResponse';
import { api } from '../lib/api';

const DEFAULT_RATING_QUESTION = (): Question => ({
  id: `rating-${Date.now()}`,
  type: 'rating',
  text: 'Overall, how would you rate your experience?',
  required: true,
});

const QUESTION_TYPES: { type: QuestionType; label: string }[] = [
  { type: 'text', label: 'Short Answer' },
  { type: 'rating', label: 'Rating Scale' },
  { type: 'multiple-choice', label: 'Multiple Choice' },
  { type: 'boolean', label: 'Yes / No' },
];

export default function SurveyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [questions, setQuestions] = React.useState<Question[]>(
    isNew ? [DEFAULT_RATING_QUESTION()] : []
  );
  const [status, setStatus] = React.useState<Survey['status']>('draft');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState<string>('');
  const [customer, setCustomer] = React.useState('');
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(!isNew);

  React.useEffect(() => {
    api.get<Department[]>('/departments').then(setDepartments).catch(() => setDepartments([]));
  }, []);

  React.useEffect(() => {
    if (!isNew) {
      api.get<any>(`/surveys/${id}`)
        .then((data) => {
          setTitle(data.title);
          setDescription(data.description);
          setQuestions(data.questions);
          setStatus(data.status);
          if (data.startDate) setStartDate(data.startDate.slice(0, 10));
          if (data.endDate) setEndDate(data.endDate.slice(0, 10));
          if (data.departmentId) setDepartmentId(data.departmentId);
          if (data.customer) setCustomer(data.customer);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, isNew]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted font-medium">Loading survey details...</div>
      </div>
    );
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      text: '',
      required: false,
      options: type === 'multiple-choice' ? ['Option 1'] : undefined
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const saveSurvey = async () => {
    const isEdit = !isNew;
    const surveyData: any = { title, description, questions, status };
    if (startDate) surveyData.start_date = new Date(startDate).toISOString();
    if (endDate) surveyData.end_date = new Date(endDate).toISOString();
    surveyData.department_id = departmentId || null;
    surveyData.customer = customer.trim() || null;

    if (isEdit) {
      await api.put(`/surveys/${id}`, surveyData);
    } else {
      await api.post('/surveys', surveyData);
    }
    navigate('/surveys');
  };

  const inputBase = "w-full border border-line bg-surface focus:border-accent outline-none px-3 py-2 text-sm";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 bg-surface border-b border-line py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-muted hover:text-ink transition-colors text-sm"
        >
          <ArrowLeft size={18} className="mr-2" /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center px-3 sm:px-4 py-2 border border-line text-ink hover:bg-accent-soft/60 transition-colors text-xs sm:text-sm font-medium"
          >
            <Eye size={16} className="mr-2" /> Preview
          </button>
          <div className="flex items-center gap-2">
            <span className="label hidden sm:inline">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-transparent border-b border-line px-1 py-0.5 text-ink text-sm outline-none focus:border-accent cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            onClick={saveSurvey}
            className="flex items-center px-4 sm:px-5 py-2 bg-accent hover:bg-accent-2 text-white transition-colors text-xs sm:text-sm font-medium"
          >
            <Save size={16} className="mr-2" /> Save <span className="hidden sm:inline">&nbsp;Survey</span>
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-line w-full max-w-4xl shadow-xl my-8"
            >
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-accent" aria-hidden />
                  <div>
                    <h3 className="text-[15px] font-medium text-ink">Live Preview</h3>
                    <div className="label" style={{ fontSize: '9.5px' }}>Previewing your changes</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto bg-canvas">
                <SurveyResponse
                  previewSurvey={{
                    id: 'preview',
                    title: title || 'Untitled Survey',
                    description: description || 'No description provided.',
                    questions,
                    status,
                    createdAt: new Date().toISOString()
                  }}
                  isPreview={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Metadata panel */}
      <div className="bg-surface border border-line p-6 space-y-5">
        <input
          type="text"
          placeholder="Survey Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl md:text-3xl font-semibold text-ink placeholder:text-muted-2 bg-transparent border-b border-line focus:border-accent outline-none pb-2"
        />
        <textarea
          placeholder="Add a description for your survey..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm text-ink placeholder:text-muted-2 bg-transparent border-b border-line focus:border-accent outline-none resize-none h-16 pb-2"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="label block mb-1.5">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputBase}
            >
              <option value="">— Select a department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted mt-1">
              Don't see yours? Admin can add via <span className="font-medium text-ink">Settings → Departments</span>.
            </p>
          </div>
          <div>
            <label className="label block mb-1.5">Customer</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={inputBase}
            />
          </div>
          <div>
            <label className="label block mb-1.5">Start Date (optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={`${inputBase} tabular`}
            />
          </div>
          <div>
            <label className="label block mb-1.5">End Date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className={`${inputBase} tabular`}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[15px] font-medium text-ink flex items-center gap-2">
            Questions
            <span className="label tabular">{questions.length}</span>
          </h3>
        </div>

        <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
          {questions.map((q) => (
            <Reorder.Item key={q.id} value={q}>
              <div className="bg-surface border border-line p-6 group relative">
                <div className="absolute left-1 md:left-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hidden md:block">
                  <GripVertical size={18} className="text-muted-2" />
                </div>

                <div className="md:ml-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Enter your question here..."
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      className="flex-1 text-base md:text-[17px] font-medium text-ink placeholder:text-muted-2 bg-transparent border-b border-line focus:border-accent outline-none pb-1"
                    />
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span className="label px-2 py-1 border border-line bg-canvas">
                        {q.type}
                      </span>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="p-2 text-muted hover:text-accent hover:bg-accent-soft/60 transition-colors"
                        aria-label="Remove question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {q.type === 'multiple-choice' && (
                    <div className="space-y-2 ml-1">
                      {q.options?.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 border border-line shrink-0" aria-hidden />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[idx] = e.target.value;
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className="flex-1 text-sm text-ink bg-transparent border-b border-line focus:border-accent outline-none py-1"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          updateQuestion(q.id, {
                            options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`],
                          })
                        }
                        className="label text-accent hover:text-accent-2 transition-colors ml-[22px]"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                        className="w-4 h-4 accent-[var(--color-accent)] border-line"
                      />
                      <span className="text-sm text-muted font-medium">Required</span>
                    </label>
                    <button
                      className="p-2 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
                      aria-label="Question settings"
                    >
                      <Settings2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add-question tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {QUESTION_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => addQuestion(item.type)}
              className="flex flex-col items-center justify-center p-5 bg-surface border border-dashed border-line hover:border-accent hover:bg-accent-soft/60 transition-colors group"
            >
              <Plus size={18} className="text-muted group-hover:text-accent mb-2 transition-colors" />
              <span className="label group-hover:text-accent transition-colors">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
