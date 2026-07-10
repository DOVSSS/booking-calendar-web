import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // URL страницы с отзывами (замените на ваш реальный URL)
  const reviewUrl = 'https://booking-calendar-web.vercel.app/review';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 transition-colors text-white px-4 py-2 rounded-lg shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span>QR-код</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">QR-код для отзывов</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCode
                value={reviewUrl}
                size={200}
                level="H"
                includeMargin={true}
                renderAs="svg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center max-w-[200px]">
              Отсканируйте QR-код, чтобы оставить отзыв или пожелание
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(reviewUrl);
                alert('Ссылка скопирована в буфер обмена');
              }}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              📋 Скопировать ссылку
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeWidget;