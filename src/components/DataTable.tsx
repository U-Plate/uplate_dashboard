import React from 'react';
import './DataTable.css';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  actions,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  if (data.length === 0) {
    return <div className="data-table__empty">{emptyMessage}</div>;
  }

  return (
    <div className="data-table">
      <table className="data-table__table">
        <thead className="data-table__header">
          <tr className="data-table__row">
            {columns.map((column, index) => (
              <th
                key={index}
                className="data-table__cell data-table__cell--header"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="data-table__cell data-table__cell--header data-table__cell--actions">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="data-table__body">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={`data-table__row${onRowClick ? ' data-table__row--clickable' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="data-table__cell">
                  {getCellValue(row, column)}
                </td>
              ))}
              {actions && (
                <td
                  className="data-table__cell data-table__cell--actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
