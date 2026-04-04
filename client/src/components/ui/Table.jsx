import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Table({
  headers,
  rows,
  onRowClick,
  pagination,
  onPageChange,
  emptyMessage,
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyMessage || t('common.noResults')}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`hover:bg-slate-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick?.(row, rowIdx)}
                >
                  {row.cells.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-3.5 text-sm text-slate-800"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3 p-4">
        {rows.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            {emptyMessage || t('common.noResults')}
          </p>
        ) : (
          rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`bg-white rounded-xl border border-slate-200 p-4 space-y-2 ${
                onRowClick ? 'cursor-pointer active:bg-slate-50' : ''
              }`}
              onClick={() => onRowClick?.(row, rowIdx)}
            >
              {row.cells.map((cell, cellIdx) => (
                <div key={cellIdx} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase">
                    {headers[cellIdx]}
                  </span>
                  <span className="text-sm text-slate-800 text-right">{cell}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            {t('common.page')} {pagination.currentPage} {t('common.of')}{' '}
            {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
