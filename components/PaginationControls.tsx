
import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

  return (
    <div className="flex items-center justify-between p-4 border-t border-border">
      <p className="text-sm text-text_secondary">
        Showing {startItem} to {endItem} of {totalItems} results
      </p>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-secondary hover:bg-secondary_hover disabled:opacity-50 disabled:cursor-not-allowed text-text_primary font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Previous
        </button>
        <span className="text-sm text-text_secondary font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-secondary hover:bg-secondary_hover disabled:opacity-50 disabled:cursor-not-allowed text-text_primary font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
