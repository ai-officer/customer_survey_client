import React from 'react';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Settings2, CheckCircle2, Eye, X } from 'lucide-react';
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
        <div className="animate-pulse text-gray-400 font-medium">Loading survey details...</div>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32">
      <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md py-4 flex items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-xs sm:text-sm"
          >
            <Eye size={18} className="mr-2" /> Preview
          </button>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-xl px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button 
            onClick={saveSurvey}
            className="flex items-center px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 font-medium text-xs sm:text-sm"
          >
            <Save size={18} className="mr-2" /> Save <span className="hidden sm:inline">Survey</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isPreviewOpen && (
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
                    <h3 className="font-bold text-gray-900">Live Preview</h3>
                    <p className="text-xs text-gray-500">Previewing your changes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-0 max-h-[80vh] overflow-y-auto bg-gray-50">
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

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 md:space-y-6">
        <input
          type="text"
          placeholder="Survey Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl md:text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none focus:ring-0"
        />
        <textarea
          placeholder="Add a description for your survey..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm md:text-base text-gray-600 placeholder-gray-300 border-none outline-none focus:ring-0 resize-none h-20"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">— Select a department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Don't see yours? Admin can add via <span className="font-medium">Settings → Departments</span>.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Customer</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date (optional)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date (optional)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          Questions <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{questions.length}</span>
        </h3>
        
        <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
          {questions.map((q) => (
            <Reorder.Item key={q.id} value={q}>
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm group relative">
                <div className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hidden md:block">
                  <GripVertical size={20} className="text-gray-300" />
                </div>
                
                <div className="md:ml-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Enter your question here..."
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      className="flex-1 text-base md:text-lg font-medium text-gray-900 placeholder-gray-300 border-none outline-none focus:ring-0 p-0"
                    />
                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                      <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        {q.type}
                      </span>
                      <button onClick={() => removeQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {q.type === 'multiple-choice' && (
                    <div className="space-y-2 ml-4">
                      {q.options?.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[idx] = e.target.value;
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className="flex-1 text-sm text-gray-600 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                      ))}
                      <button 
                        onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                        className="text-xs font-medium text-indigo-600 hover:underline ml-6"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-500 font-medium">Required</span>
                      </label>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                      <Settings2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {[
            { type: 'text', label: 'Short Answer' },
            { type: 'rating', label: 'Rating Scale' },
            { type: 'multiple-choice', label: 'Multiple Choice' },
            { type: 'boolean', label: 'Yes / No' }
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => addQuestion(item.type as QuestionType)}
              className="flex flex-col items-center justify-center p-4 bg-white border border-dashed border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              <Plus size={20} className="text-gray-400 group-hover:text-indigo-500 mb-1" />
              <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
