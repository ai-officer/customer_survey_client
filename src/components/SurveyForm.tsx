import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Reorder, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Save, ArrowLeft, GripVertical, Settings2, Eye, X,
} from '../lib/icons';
import { Question, QuestionType, Survey, Department } from '../types';
import SurveyResponse from './SurveyResponse';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { ModalScaffold } from '@/components/ui/modal-scaffold';

const DEFAULT_RATING_QUESTION = (): Question => ({
  id: `rating-${Date.now()}`,
  type: 'rating',
  text: 'Overall, how would you rate your experience?',
  required: true,
});

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  text: 'Short answer',
  rating: 'Rating scale',
  'multiple-choice': 'Multiple choice',
  boolean: 'Yes / No',
};

const ADD_TYPES: { type: QuestionType; label: string; hint: string }[] = [
  { type: 'text',            label: 'Short answer',   hint: 'a text field' },
  { type: 'rating',          label: 'Rating scale',   hint: '1 to 5 stars' },
  { type: 'multiple-choice', label: 'Multiple choice', hint: 'pick one from a list' },
  { type: 'boolean',         label: 'Yes / No',       hint: 'a binary toggle' },
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
  const [saving, setSaving] = React.useState(false);

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
        <div className="eyebrow animate-pulse">loading survey…</div>
      </div>
    );
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      text: '',
      required: false,
      options: type === 'multiple-choice' ? ['Option 1'] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (qid: string) => setQuestions(questions.filter(q => q.id !== qid));

  const updateQuestion = (qid: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === qid ? { ...q, ...updates } : q));
  };

  const saveSurvey = async () => {
    setSaving(true);
    try {
      const isEdit = !isNew;
      const surveyData: any = { title, description, questions, status };
      if (startDate) surveyData.start_date = new Date(startDate).toISOString();
      if (endDate) surveyData.end_date = new Date(endDate).toISOString();
      surveyData.department_id = departmentId || null;
      surveyData.customer = customer.trim() || null;

      if (isEdit) await api.put(`/surveys/${id}`, surveyData);
      else await api.post('/surveys', surveyData);
      navigate('/surveys');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} /> <span className="hidden sm:inline">Back to surveys</span>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
          </Button>

          <Select value={status} onValueChange={(v) => setStatus(v as Survey['status'])}>
            <SelectTrigger className="w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={saveSurvey} disabled={saving || !title.trim()}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save'}
            <span className="hidden sm:inline">&nbsp;survey</span>
          </Button>
        </div>
      </div>

      {/* Page eyebrow */}
      <div>
        <div className="eyebrow">{isNew ? 'new survey' : 'edit survey'}</div>
        <p className="text-[13px] text-muted-foreground mt-2">
          {isNew
            ? 'Draft a survey, add questions, and publish when it\'s ready.'
            : 'Make changes to this survey. Existing responses are preserved.'}
        </p>
      </div>

      {/* Title + description card — big editable display input */}
      <Card className="p-7 space-y-4">
        <input
          type="text"
          placeholder="Untitled survey"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="display w-full text-[32px] leading-tight text-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none focus:ring-0 p-0"
        />
        <textarea
          placeholder="Add a short description to explain what this survey is for…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 bg-transparent border-none outline-none focus:ring-0 resize-none p-0"
        />

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-border">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={departmentId || 'none'} onValueChange={(v) => setDepartmentId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="— Select a department —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unassigned —</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11.5px] text-muted-foreground">
              Don't see yours? Admin can add via <span className="font-medium text-foreground">Settings → Departments</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start">Start date <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end">End date <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Questions section */}
      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <h2 className="heading text-[22px] font-semibold text-foreground">Questions</h2>
          <span className="num text-[13px] text-muted-foreground">
            {questions.length} {questions.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {questions.length === 0 ? (
          <Card className="py-10 text-center space-y-1.5">
            <p className="text-[13px] text-muted-foreground">No questions yet.</p>
            <p className="text-[12px] text-muted-foreground/80">Add one from the options below to get started.</p>
          </Card>
        ) : (
          <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-3">
            {questions.map((q, idx) => (
              <Reorder.Item key={q.id} value={q}>
                <QuestionBlock
                  index={idx}
                  q={q}
                  onChange={(patch) => updateQuestion(q.id, patch)}
                  onRemove={() => removeQuestion(q.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {/* Add question row */}
        <Card className="p-4">
          <div className="eyebrow mb-3">add question</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ADD_TYPES.map(({ type, label, hint }) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                className="flex flex-col items-start gap-1 rounded-md border border-dashed border-border px-3 py-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <Plus size={14} className="text-muted-foreground group-hover:text-primary" />
                  <span className="text-[13px] font-medium text-foreground">{label}</span>
                </div>
                <span className="eyebrow">{hint}</span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Live Preview */}
      <AnimatePresence>
        {isPreviewOpen && (
          <ModalScaffold
            onClose={() => setIsPreviewOpen(false)}
            size="xl"
            bare
            scrollable
            className="relative my-8 overflow-hidden"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-md px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-secondary text-foreground flex items-center justify-center">
                  <Eye size={16} />
                </div>
                <div>
                  <div className="eyebrow">live preview</div>
                  <h3 className="heading text-[14px] font-semibold leading-none mt-0.5">
                    Previewing unsaved changes
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto bg-background">
              <SurveyResponse
                previewSurvey={{
                  id: 'preview',
                  title: title || 'Untitled survey',
                  description: description || 'No description provided.',
                  questions,
                  status,
                  createdAt: new Date().toISOString(),
                }}
                isPreview={true}
              />
            </div>
          </ModalScaffold>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Question Block ─────────────────────────────────────────────────────────────

function QuestionBlock({
  index,
  q,
  onChange,
  onRemove,
}: {
  index: number;
  q: Question;
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative bg-card border border-border rounded-xl shadow-card">
      {/* Drag handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hidden md:block">
        <GripVertical size={16} className="text-muted-foreground/60" />
      </div>

      <div className="p-5 md:pl-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="num text-[11px] text-muted-foreground mt-1.5 shrink-0">
              Q{String(index + 1).padStart(2, '0')}
            </span>
            <input
              type="text"
              placeholder="Enter your question…"
              value={q.text}
              onChange={(e) => onChange({ text: e.target.value })}
              className="flex-1 text-[15.5px] font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent border-none outline-none focus:ring-0 p-0"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="normal-case tracking-normal">
              {QUESTION_TYPE_LABEL[q.type]}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              aria-label="Remove question"
              className="hover:text-destructive hover:bg-red-50"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Type-specific body */}
        {q.type === 'multiple-choice' && (
          <div className="space-y-1.5 pl-10">
            {q.options?.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 group/opt">
                <span className="h-3 w-3 rounded-full border border-border shrink-0" />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...(q.options || [])];
                    newOpts[idx] = e.target.value;
                    onChange({ options: newOpts });
                  }}
                  className="flex-1 text-[13.5px] text-foreground bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-muted-foreground/50"
                  placeholder={`Option ${idx + 1}`}
                />
                {(q.options?.length ?? 0) > 1 && (
                  <button
                    onClick={() => {
                      const newOpts = [...(q.options || [])];
                      newOpts.splice(idx, 1);
                      onChange({ options: newOpts });
                    }}
                    className="opacity-0 group-hover/opt:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove option ${idx + 1}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
              className="text-[12px] font-medium text-primary hover:underline underline-offset-4 mt-1"
            >
              + Add option
            </button>
          </div>
        )}

        {q.type === 'rating' && (
          <div className="flex items-center gap-1.5 pl-10">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-8 w-8 rounded-md border border-border bg-secondary/40 flex items-center justify-center num text-[12px] text-muted-foreground"
              >
                {n}
              </div>
            ))}
            <span className="eyebrow ml-2">1 (low) – 5 (high)</span>
          </div>
        )}

        {q.type === 'boolean' && (
          <div className="flex items-center gap-2 pl-10">
            <span className="px-3 py-1 rounded-md bg-secondary/50 text-[12.5px] text-muted-foreground">Yes</span>
            <span className="px-3 py-1 rounded-md bg-secondary/50 text-[12.5px] text-muted-foreground">No</span>
          </div>
        )}

        {q.type === 'text' && (
          <div className="pl-10">
            <div className="h-16 rounded-md border border-dashed border-border bg-secondary/30 flex items-center px-3 text-[12.5px] text-muted-foreground/70 italic">
              Respondent will see a text field here.
            </div>
          </div>
        )}

        {/* Footer: required + settings */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-ring focus:ring-offset-background focus:ring-2 focus:ring-offset-2"
            />
            <span className="text-[12.5px] text-muted-foreground">Required</span>
          </label>
          <Button size="icon" variant="ghost" className="opacity-60 hover:opacity-100" aria-label="Question settings">
            <Settings2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
