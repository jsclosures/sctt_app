'use client';

export default function SetupLayout({ children }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1300,
      background: '#fafafa',
    }}>
      {children}
    </div>
  );
}