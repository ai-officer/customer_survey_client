import React from 'react';
import { Trash2 } from '@/lib/icons';
import { Survey } from '@/types';
import { Button } from '@/components/ui/button';
import { ModalScaffold } from '@/components/ui/modal-scaffold';

interface DeleteConfirmModalProps {
  survey: Survey;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  survey,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <ModalScaffold
      onClose={onClose}
      size="sm"
      tier="over"
      bare
      padded
    >
      <div className="space-y-1.5">
        <div className="w-11 h-11 bg-red-50 border border-red-200 text-destructive rounded-md flex items-center justify-center">
          <Trash2 size={18} />
        </div>
        <div>
          <div className="eyebrow text-destructive">destructive · irreversible</div>
          <h3 className="heading text-[18px] font-semibold mt-1 leading-tight">
            Delete this survey?
          </h3>
        </div>
        <p className="text-[13px] text-muted-foreground pt-1">
          <span className="font-medium text-foreground">"{survey.title}"</span> and all
          of its responses will be permanently removed. This action cannot be undone.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1">
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="flex-1">
          {isDeleting ? 'Deleting…' : 'Delete survey'}
        </Button>
      </div>
    </ModalScaffold>
  );
}
