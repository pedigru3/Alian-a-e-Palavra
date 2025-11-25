'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteDevotionalButtonProps {
  sessionId: string;
}

export const DeleteDevotionalButton = ({ sessionId }: DeleteDevotionalButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const error = await res.json();
        alert(`Erro ao excluir: ${error.error || 'Erro desconhecido'}`);
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Erro ao excluir devocional. Tente novamente.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Tem certeza?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isDeleting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              Excluindo...
            </>
          ) : (
            'Sim, excluir'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
    >
      <Trash2 size={14} />
      Excluir devocional
    </button>
  );
};

