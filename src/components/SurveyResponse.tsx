import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Send, Star, Eye, AlertCircle } from 'lucide-react';
import { Survey } from '../types';
import { cn } from '../lib/utils';

interface SurveyResponseProps {
  previewSurvey?: Survey;
  isPreview?: boolean;
}

export default function SurveyResponse({ previewSurvey, isPreview = false }: SurveyResponseProps) {
  const { id } = useParams();
  const [survey, setSurvey] = React.useState<Survey | null>(previewSurvey || null);
  const [answers, setAnswers] = React.useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = React.useState('');
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(!previewSurvey);
  const [submitError, setSubmitError] = React.useState('');
  const [alreadySubmitted, setAlreadySubmitted] = React.useState(false);

  React.useEffect(() => {
    if (previewSurvey) {
      setSurvey(previewSurvey);
      setLoading(false);
      return;
    }
    if (id) {
      fetch(`/api/surveys/${id}`)
        .then(res => res.json())
        .then(data => {
          setSurvey(data);
          setLoading(false);
        });
    }
  }, [id, previewSurvey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) {
      alert('This is a preview. No data will be submitted.');
      return;
    }
    setSubmitError('');
    if (!isAnonymous && !respondentName.trim()) {
      setSubmitError('Please enter your name or choose to submit anonymously.');
      return;
    }
    const response = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surveyId: id,
        answers,
        respondent_name: isAnonymous ? null : respondentName.trim(),
        is_anonymous: isAnonymous,
      })
    });
    if (response.ok) {
      setSubmitted(true);
    } else if (response.status === 409) {
      setAlreadySubmitted(true);
    } else {
      const err = await response.json();
      setSubmitError(err.detail || 'Submission failed. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="animate-pulse text-muted font-medium">Loading survey...</div>
    </div>
  );

  if (alreadySubmitted) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface border border-line p-12 rounded-sm text-center space-y-6">
        <div className="w-20 h-20 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-medium text-ink">Already Submitted</h2>
        <p className="text-muted leading-relaxed">
          You have already submitted a response to this survey. Duplicate submissions are not allowed.
        </p>
      </motion.div>
    </div>
  );

  if (!survey) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-muted font-medium">Survey not found</div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface border border-line p-12 rounded-sm text-center space-y-6"
      >
        <div className="w-20 h-20 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-medium text-ink">Thank you!</h2>
        <p className="text-muted leading-relaxed">
          Your feedback has been successfully submitted. We appreciate your time and input.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-accent text-white rounded-sm font-medium hover:bg-accent-2 transition-colors"
        >
          Submit another response
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="bg-surface border border-line p-6 md:p-8 rounded-sm space-y-3 md:space-y-4">
          <h1 className="text-2xl md:text-3xl font-medium text-ink">{survey.title}</h1>
          <p className="text-sm md:text-base text-muted leading-relaxed">{survey.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="bg-surface border border-line p-6 md:p-8 rounded-sm space-y-4">
            <div className="space-y-1">
              <label className="text-base md:text-lg font-medium text-ink flex items-start">
                Your Name
                {!isAnonymous && <span className="text-negative ml-1">*</span>}
              </label>
              <p className="text-xs md:text-sm text-muted">
                We collect your name by default. You may choose to submit anonymously.
              </p>
            </div>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              disabled={isAnonymous}
              placeholder={isAnonymous ? "You are submitting anonymously" : "Enter your full name"}
              className={cn(
                "w-full p-3 md:p-4 border rounded-sm outline-none transition-colors text-sm md:text-base",
                isAnonymous
                  ? "bg-canvas border-line text-muted cursor-not-allowed"
                  : "bg-surface border-line focus:border-accent"
              )}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-accent border-line rounded-sm"
              />
              <span className="text-sm text-muted font-medium">Submit anonymously</span>
            </label>
          </div>

          {survey.questions.map((q, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={q.id}
              className="bg-surface border border-line p-6 md:p-8 rounded-sm space-y-4 md:space-y-6"
            >
              <div className="space-y-2">
                <label className="text-base md:text-lg font-medium text-ink flex items-start">
                  {q.text}
                  {q.required && <span className="text-negative ml-1">*</span>}
                </label>
              </div>

              {q.type === 'text' && (
                <textarea
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Your answer..."
                  className="w-full p-3 md:p-4 bg-surface border border-line focus:border-accent rounded-sm outline-none transition-colors resize-none h-32 text-sm md:text-base"
                />
              )}

              {q.type === 'rating' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: val })}
                        className={cn(
                          "aspect-square rounded-sm flex flex-col items-center justify-center gap-0.5 transition-colors border",
                          answers[q.id] === val
                            ? "bg-accent text-white border-accent"
                            : "bg-surface text-muted border-line hover:border-accent hover:text-accent"
                        )}
                        aria-label={`Rate ${val} out of 5`}
                      >
                        <Star
                          size={16}
                          className="sm:w-[18px] sm:h-[18px]"
                          fill={answers[q.id] === val ? "currentColor" : "none"}
                        />
                        <span className="text-sm sm:text-base font-medium leading-none tabular">{val}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-1 label">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              )}

              {q.type === 'multiple-choice' && (
                <div className="space-y-2 md:space-y-3">
                  {q.options?.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={cn(
                        "w-full p-3 md:p-4 text-left rounded-sm border transition-colors flex items-center justify-between group text-sm md:text-base",
                        answers[q.id] === opt
                          ? "bg-accent-soft border-accent text-ink font-medium"
                          : "bg-surface border-line text-muted hover:border-accent"
                      )}
                    >
                      {opt}
                      <div className={cn(
                        "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        answers[q.id] === opt ? "border-accent bg-accent" : "border-line"
                      )}>
                        {answers[q.id] === opt && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'boolean' && (
                <div className="flex space-x-3 md:space-x-4">
                  {['Yes', 'No'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: val })}
                      className={cn(
                        "flex-1 p-3 md:p-4 rounded-sm border transition-colors font-medium text-sm md:text-base",
                        answers[q.id] === val
                          ? "bg-accent-soft border-accent text-ink"
                          : "bg-surface border-line text-muted hover:border-accent"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {submitError && (
            <div className="p-4 bg-red-50 border-l-2 border-negative text-negative rounded-sm text-sm font-medium">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            className={cn(
              "w-full py-3 md:py-4 text-white rounded-sm font-medium text-base md:text-lg transition-colors flex items-center justify-center space-x-2",
              isPreview ? "bg-negative hover:bg-red-800" : "bg-accent hover:bg-accent-2"
            )}
          >
            {isPreview ? (
              <>
                <Eye size={18} className="md:w-5 md:h-5" />
                <span>Preview Mode (No Submission)</span>
              </>
            ) : (
              <>
                <Send size={18} className="md:w-5 md:h-5" />
                <span>Submit Response</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
