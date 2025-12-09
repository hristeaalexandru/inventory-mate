import React from 'react';

// Această componentă a fost dezactivată la cerere.
// Funcționalitatea de cameră a fost eliminată în favoarea scanerelor fizice sau introducerii manuale.

interface ScannerModalProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose }) => {
  return null;
};

export default ScannerModal;