import React from 'react';
import { CheckCircle2, X } from '@/lib/icons';
import { api } from '@/lib/api';
import { Survey } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalScaffold } from '@/components/ui/modal-scaffold';

interface DistributeModalProps {
  survey: Survey;
  onClose: () => void;
}

export function DistributeModal({ survey, onClose }: DistributeModalProps) {
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
    <ModalScaffold
      onClose={onClose}
      eyebrow="distribute · invite"
      title={survey.title}
      size="md"
    >
      {sent ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md flex items-center justify-center mx-auto">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-[14px] font-medium text-foreground">Invitations queued.</p>
          <p className="text-[13px] text-muted-foreground">
            Survey links are being sent to <span className="num text-foreground">{emails.length}</span>{' '}
            recipient{emails.length !== 1 ? 's' : ''}.
          </p>
          <Button onClick={onClose} className="w-full mt-2">Done</Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
              <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dist-input">Recipients</Label>
            <div className="flex gap-2">
              <Input
                id="dist-input"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmails(); } }}
                placeholder="email@example.com, another@example.com"
                className="flex-1"
              />
              <Button onClick={addEmails} variant="outline">Add</Button>
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-1">
              Separate multiple addresses with commas, spaces, or press Enter.
            </p>
          </div>

          {emails.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto -mx-1 px-1">
              <div className="eyebrow mb-1.5 px-1">
                <span className="num text-foreground mr-1">{emails.length}</span>
                {emails.length === 1 ? 'recipient' : 'recipients'}
              </div>
              {emails.map(email => (
                <div
                  key={email}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/50 rounded-md text-[13px] group"
                >
                  <span className="text-foreground truncate">{email}</span>
                  <button
                    onClick={() => setEmails(emails.filter(e => e !== email))}
                    className="text-muted-foreground hover:text-destructive p-0.5 transition-colors"
                    aria-label={`Remove ${email}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || emails.length === 0}
              className="flex-1"
            >
              {sending ? 'Sending…' : `Send ${emails.length > 0 ? `· ${emails.length}` : ''}`}
            </Button>
          </div>
        </>
      )}
    </ModalScaffold>
  );
}
