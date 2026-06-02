import React from "react";

function Pagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between mt-4 ${className}`}>
      <p className="text-sm text-gray-500">
        Strona {currentPage} z {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Poprzednia
        </button>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Nastepna
        </button>
      </div>
    </div>
  );
}

export default Pagination;
