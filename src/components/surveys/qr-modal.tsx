import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Copy, Download, X } from '@/lib/icons';
import { Survey } from '@/types';
import { Button } from '@/components/ui/button';
import { ModalScaffold } from '@/components/ui/modal-scaffold';

interface QrModalProps {
  survey: Survey;
  copied: boolean;
  onClose: () => void;
  onCopyLink: (id: string) => void;
  onDownload: (id: string, title: string) => void;
}

export function QrModal({ survey, copied, onClose, onCopyLink, onDownload }: QrModalProps) {
  return (
    <ModalScaffold
      onClose={onClose}
      size="sm"
      bare
      padded
      className="relative"
    >
      <button
        onClick={onClose}
        className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div>
        <div className="eyebrow">shareable code</div>
        <h3 className="heading text-[17px] font-semibold mt-1 leading-tight truncate">
          {survey.title}
        </h3>
        <p className="text-[12px] text-muted-foreground mt-1">
          Scan to open the respondent view.
        </p>
      </div>

      <div className="flex justify-center py-2">
        <div className="p-3 rounded-md bg-card border border-border">
          <QRCodeSVG
            id={`qr-code-${survey.id}`}
            value={`${window.location.origin}/s/${survey.id}`}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onCopyLink(survey.id)}>
          {copied ? (
            <><CheckCircle2 size={14} className="text-emerald-600" /> Copied</>
          ) : (
            <><Copy size={14} /> Copy link</>
          )}
        </Button>
        <Button onClick={() => onDownload(survey.id, survey.title)}>
          <Download size={14} /> Download
        </Button>
      </div>
    </ModalScaffold>
  );
}
