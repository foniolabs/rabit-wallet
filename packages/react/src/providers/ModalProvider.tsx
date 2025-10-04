import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  openModals: Set<string>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const openModal = (id: string) => {
    setOpenModals(prev => new Set(prev).add(id));
  };

  const closeModal = (id: string) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const isModalOpen = (id: string) => openModals.has(id);

  const value: ModalContextType = {
    openModals,
    openModal,
    closeModal,
    isModalOpen,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
