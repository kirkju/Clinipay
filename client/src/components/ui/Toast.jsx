import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#1A1A2E',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
          fontSize: '14px',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#3EB489',
            secondary: '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: '#E74C3C',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
}
