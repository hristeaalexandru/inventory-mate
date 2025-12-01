import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

// Declare the global Html5Qrcode from the CDN script
declare const Html5Qrcode: any;

interface ScannerModalProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let html5QrCode: any;

    const startCamera = async () => {
      try {
        // Use the ID of the div directly
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Configuration for better mobile scanning
        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false // Helps with some front/back camera confusions
        };

        // Explicitly request the environment (back) camera
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText: string) => {
             // Success callback
             // Stop scanning immediately after success to prevent multiple triggers
             html5QrCode.stop().then(() => {
                onScan(decodedText);
             }).catch((err: any) => {
                console.error("Failed to stop", err);
                onScan(decodedText); // Still return the code
             });
          },
          (errorMessage: any) => {
            // parse error, ignore to keep console clean
          }
        );
        
        setPermissionGranted(true);
      } catch (err: any) {
        console.error("Camera error:", err);
        let msg = "Nu s-a putut accesa camera.";
        if (typeof err === 'string') {
            msg = err;
        } else if (err.name === 'NotAllowedError') {
            msg = "Accesul la cameră a fost refuzat. Te rugăm să permiți accesul în setările browserului.";
        } else if (err.name === 'NotFoundError') {
            msg = "Nu s-a găsit nicio cameră pe acest dispozitiv.";
        } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            msg = "Camera necesită o conexiune securizată (HTTPS) sau localhost. Pe Android, Chrome blochează camera pe HTTP.";
        }
        setError(msg);
      }
    };

    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
        startCamera();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden relative border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Camera size={20} className="text-blue-400" />
                Scanare
            </h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Camera Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center min-h-[300px]">
            {error ? (
                <div className="p-6 text-center text-red-400 flex flex-col items-center">
                    <AlertCircle size={48} className="mb-4 opacity-80" />
                    <p className="text-lg font-medium mb-2">Eroare Cameră</p>
                    <p className="text-sm opacity-90">{error}</p>
                    <button onClick={onClose} className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700">
                        Închide
                    </button>
                </div>
            ) : (
                <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full [&>div]:hidden"></div>
            )}
            
            {/* Loading Indicator */}
            {!permissionGranted && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    Se inițializează camera...
                </div>
            )}
        </div>

        {/* Instructions */}
        {!error && (
             <div className="p-4 text-center text-sm text-gray-400 bg-gray-800 border-t border-gray-700">
                Încadrează codul de bare în centrul ecranului.
            </div>
        )}
      </div>
    </div>
  );
};

export default ScannerModal;