import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Send, Star, Eye, AlertCircle } from '../lib/icons';
import { Survey } from '../types';
import { cn } from '../lib/utils';

interface SurveyResponseProps {
  previewSurvey?: Survey;
  isPreview?: boolean;
}

export default function SurveyResponse({ previewSurvey, isPreview = false }: SurveyResponseProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  // Per-recipient invite token from the email link (?t=...). When present
  // the backend dedupes by token instead of by IP+UA, so two recipients on
  // the same office network can both submit their own response.
  const inviteToken = searchParams.get('t') || undefined;
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
        token: inviteToken,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400 font-medium">Loading survey...</div>
    </div>
  );

  if (alreadySubmitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Already Submitted</h2>
        <p className="text-gray-500 leading-relaxed">
          You have already submitted a response to this survey. Duplicate submissions are not allowed.
        </p>
      </motion.div>
    </div>
  );

  if (!survey) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500 font-medium">Survey not found</div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl shadow-blue-100 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
        <p className="text-gray-500 leading-relaxed">
          Your feedback has been successfully submitted. We appreciate your time and input.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Submit another response
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="bg-white p-6 md:p-10 rounded-xl md:rounded-3xl shadow-sm border border-gray-100 space-y-3 md:space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{survey.title}</h1>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed">{survey.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-xl md:rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-1">
              <label className="text-base md:text-lg font-bold text-gray-900 flex items-start">
                Your Name
                {!isAnonymous && <span className="text-rose-500 ml-1">*</span>}
              </label>
              <p className="text-xs md:text-sm text-gray-500">
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
                "w-full p-3 md:p-4 border rounded-xl md:rounded-xl outline-none transition-all text-sm md:text-base",
                isAnonymous
                  ? "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-50 border-gray-100 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              )}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 font-medium">Submit anonymously</span>
            </label>
          </div>

          {survey.questions.map((q, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={q.id}
              className="bg-white p-6 md:p-8 rounded-xl md:rounded-3xl shadow-sm border border-gray-100 space-y-4 md:space-y-6"
            >
              <div className="space-y-2">
                <label className="text-base md:text-lg font-bold text-gray-900 flex items-start">
                  {q.text}
                  {q.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
              </div>

              {q.type === 'text' && (
                <textarea
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Your answer..."
                  className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none h-32 text-sm md:text-base"
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
                          "aspect-square rounded-xl md:rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border",
                          answers[q.id] === val
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                            : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-white hover:border-blue-200 hover:text-blue-600"
                        )}
                        aria-label={`Rate ${val} out of 5`}
                      >
                        <Star
                          size={16}
                          className="sm:w-[18px] sm:h-[18px]"
                          fill={answers[q.id] === val ? "currentColor" : "none"}
                        />
                        <span className="text-sm sm:text-base font-bold leading-none">{val}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-1 text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">
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
                        "w-full p-3 md:p-4 text-left rounded-xl md:rounded-xl border transition-all flex items-center justify-between group text-sm md:text-base",
                        answers[q.id] === opt
                          ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                          : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {opt}
                      <div className={cn(
                        "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        answers[q.id] === opt ? "border-blue-600 bg-blue-600" : "border-gray-200"
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
                        "flex-1 p-3 md:p-4 rounded-xl md:rounded-xl border transition-all font-medium text-sm md:text-base",
                        answers[q.id] === val
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                          : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
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
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            className={cn(
              "w-full py-3 md:py-4 text-white rounded-xl md:rounded-3xl font-bold text-base md:text-lg transition-all shadow-xl flex items-center justify-center space-x-2",
              isPreview ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
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
