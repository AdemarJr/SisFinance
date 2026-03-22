import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card } from './ui/card';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<T>) {
  const getCellContent = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return String(row[column.accessor]);
  };

  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={`w-full overflow-hidden ${className || ''}`}>
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead 
                    key={index}
                    className={`${column.className || ''} ${column.mobileHidden ? 'hidden sm:table-cell' : ''}`}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-accent/50' : ''}
                >
                  {columns.map((column, index) => (
                    <TableCell
                      key={index}
                      className={`${column.className || ''} ${column.mobileHidden ? 'hidden sm:table-cell' : ''}`}
                    >
                      {getCellContent(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {data.map((row) => (
          <Card
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={`p-4 ${onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
          >
            <div className="space-y-2">
              {columns
                .filter((col) => !col.mobileHidden)
                .map((column, index) => (
                  <div key={index} className="flex justify-between items-start gap-2 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0 w-24">
                      {column.header}:
                    </span>
                    <span className="text-sm text-right flex-1 break-words min-w-0">
                      {getCellContent(row, column)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}