import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#1A2A22',
          borderRadius: '14px',
          border: '1px solid #E2E8E4',
          padding: '16px',
          fontSize: '14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        },
        success: {
          iconTheme: {
            primary: '#22C55E',
            secondary: '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
}
