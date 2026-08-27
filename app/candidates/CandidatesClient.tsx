'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/candidates/SearchBar';
import { CandidatesTable } from '@/components/candidates/CandidatesTable';

export function CandidatesClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows);
  const [searched, setSearched] = useState(false);

  return (
    <div>
      <SearchBar onResults={(results) => { setRows(results); setSearched(true); }} />
      <div className="mt-6">
        <CandidatesTable rows={rows} />
        {searched && (
          <button
            className="mt-3 text-xs text-engrity-blue hover:underline"
            onClick={() => { setRows(initialRows); setSearched(false); }}
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
}
