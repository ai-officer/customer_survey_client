import React from 'react';
import { Eye, X } from '@/lib/icons';
import { Survey } from '@/types';
import { ModalScaffold } from '@/components/ui/modal-scaffold';
import SurveyResponse from '@/components/SurveyResponse';

interface PreviewModalProps {
  survey: Survey;
  onClose: () => void;
}

export function PreviewModal({ survey, onClose }: PreviewModalProps) {
  return (
    <ModalScaffold
      onClose={onClose}
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
            <div className="eyebrow">preview</div>
            <h3 className="heading text-[14px] font-semibold leading-none mt-0.5">
              Viewing as a respondent
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[80vh] overflow-y-auto bg-background">
        <SurveyResponse previewSurvey={survey} isPreview={true} />
      </div>
    </ModalScaffold>
  );
}
