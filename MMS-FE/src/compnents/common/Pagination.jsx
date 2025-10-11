import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
}) {
  const pageSizeOptions = [5, 10, 20, 50];
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        pages.push(0, 1, 2, 3, '...', totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        pages.push(0, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push(0, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-600">
          Hiển thị <span className="font-medium text-slate-800">{startItem}</span> đến{" "}
          <span className="font-medium text-slate-800">{endItem}</span> trong tổng số{" "}
          <span className="font-medium text-slate-800">{totalElements}</span> mục
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-slate-600">
            Mỗi trang:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentPage === 0
              ? "text-slate-400 bg-slate-100 cursor-not-allowed"
              : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm text-slate-600"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                page === currentPage
                  ? "bg-brand-blue text-white"
                  : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              }`}
            >
              {page + 1}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentPage >= totalPages - 1
              ? "text-slate-400 bg-slate-100 cursor-not-allowed"
              : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

