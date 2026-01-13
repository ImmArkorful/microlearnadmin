import { useState } from 'react';
import './DataTable.css';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  actions?: Array<{
    label: string | ((row: T) => string);
    onClick: (row: T) => void;
    className?: string;
  }>;
  loading?: boolean;
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  actions = [],
  loading = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = typeof sortColumn === 'string' ? (a as any)[sortColumn] : a[sortColumn as keyof T];
    const bValue = typeof sortColumn === 'string' ? (b as any)[sortColumn] : b[sortColumn as keyof T];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Handle date strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        const comparison = aDate.getTime() - bDate.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    }

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Fallback to string comparison
    const aStr = String(aValue || '');
    const bStr = String(bValue || '');
    const comparison = aStr.localeCompare(bStr);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="data-table__loading">
        <div className="data-table__spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="data-table__empty">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="data-table">
      <div className="data-table__wrapper">
        <table className="data-table__table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={column.sortable ? 'data-table__sortable' : ''}
                  onClick={() => handleSort(column)}
                >
                  {column.label}
                  {column.sortable && sortColumn === column.key && (
                    <span className="data-table__sort-indicator">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
              {(onView || onEdit || onDelete || actions.length > 0) && (
                <th className="data-table__actions-header">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render
                      ? column.render(
                          typeof column.key === 'string' ? (row as any)[column.key] : row[column.key as keyof T],
                          row
                        )
                      : String(typeof column.key === 'string' ? (row as any)[column.key] : row[column.key as keyof T] || '')}
                  </td>
                ))}
                {(onView || onEdit || onDelete || actions.length > 0) && (
                  <td className="data-table__actions">
                    {onView && (
                      <button
                        className="data-table__action data-table__action--view"
                        onClick={() => onView(row)}
                        title="View"
                      >
                        👁️
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="data-table__action data-table__action--edit"
                        onClick={() => onEdit(row)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="data-table__action data-table__action--delete"
                        onClick={() => onDelete(row)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                    {actions.map((action, index) => {
                      const labelText = typeof action.label === 'string' ? action.label : action.label(row);
                      return (
                        <button
                          key={index}
                          className={`data-table__action ${action.className || ''}`}
                          onClick={() => action.onClick(row)}
                          title={labelText}
                        >
                          {labelText}
                        </button>
                      );
                    })}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
