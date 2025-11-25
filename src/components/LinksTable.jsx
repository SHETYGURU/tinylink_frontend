import React, { useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const REDIRECT_BASE =
  import.meta.env.VITE_REDIRECT_BASE || 'http://localhost:4000';
const FRONTEND_URL =
  import.meta.env.VITE_BASE_URL || 'http://localhost:5173';

export default function LinksTable({ links, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');

  const [openingCode, setOpeningCode] = useState(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (code) => {
    setDeleteConfirmCode(code);
    setDeleteLoading(false);
  };

  const confirmDelete = () => {
    if (!deleteConfirmCode) return;
    setDeleteLoading(true);

    setTimeout(async () => {
      try {
        await axios.delete(`${API_URL}/api/links/${deleteConfirmCode}`);
        if (onRefresh) onRefresh();
      } catch (e) {
        console.error(e);
        alert('Failed to delete. Please try again.');
      } finally {
        setDeleteLoading(false);
        setDeleteConfirmCode(null);
      }
    }, 2000);
  };

  const openOne = (code) => {
    const shortUrl = `${REDIRECT_BASE}/${code}`;
    setOpeningCode(code);

    setTimeout(() => {
      window.open(shortUrl, '_blank', 'noopener,noreferrer');
      if (onRefresh) onRefresh();
    }, 1000);

    setTimeout(() => {
      setOpeningCode(null);
    }, 1500);
  };

  const handleRefreshClick = () => {
    if (onRefresh) onRefresh();
  };

  const processedLinks = useMemo(() => {
    if (!links) return [];
    let list = [...links];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.code.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'clicks_desc') {
        return (b.total_clicks || 0) - (a.total_clicks || 0);
      }
      if (sortBy === 'clicks_asc') {
        return (a.total_clicks || 0) - (b.total_clicks || 0);
      }
      if (sortBy === 'last_clicked_desc') {
        const da = a.last_clicked ? new Date(a.last_clicked).getTime() : 0;
        const db = b.last_clicked ? new Date(b.last_clicked).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'last_clicked_asc') {
        const da = a.last_clicked ? new Date(a.last_clicked).getTime() : 0;
        const db = b.last_clicked ? new Date(b.last_clicked).getTime() : 0;
        return da - db;
      }
      if (sortBy === 'created_desc' && a.created_at && b.created_at) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return 0;
    });

    return list;
  }, [links, search, sortBy]);

  if (loading) return <div>...</div>;
  if (!links || links.length === 0) return <div>No links yet.</div>;

  const hasResults = processedLinks.length > 0;

  return (
    <>
      {/* Delete confirmation overlay */}
      {deleteConfirmCode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl px-6 py-5 max-w-sm w-[90%] text-center shadow-xl border">
            {deleteLoading ? (
              <>
                <img
                  src="/icons/deleting.gif"
                  alt="Deleting"
                  className="mx-auto mb-3 h-16 w-16 object-contain"
                />
                <p className="text-sm font-semibold text-gray-800">
                  Deleting link…
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  Delete this TinyLink?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Code: <span className="font-mono">{deleteConfirmCode}</span>
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmCode(null)}
                    className="px-4 py-2 rounded-lg bg-white text-black border border-gray-800 hover:bg-gray-100 text-sm font-medium shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 text-sm font-medium shadow-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Yes, delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto mt-6">
        {/* toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          {/* search + refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="6" />
                  <line x1="16" y1="16" x2="20" y2="20" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code"
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* NEW refresh button */}
            <button
              type="button"
              onClick={handleRefreshClick}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-white text-black border border-black hover:bg-gray-100 text-xs font-medium shadow-sm"
            >
              <img
                src="/icons/refresh.gif"
                alt="Refresh"
                className="w-4 h-4 mr-1"
              />
              Refresh
            </button>
          </div>

          {/* sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 5h10" />
                <path d="M11 9h7" />
                <path d="M11 13h4" />
                <path d="M3 17l3 3 3-3" />
                <path d="M6 4v16" />
              </svg>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg text-sm px-2 py-1 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_desc">Newest first</option>
              <option value="clicks_desc">Clicks (high → low)</option>
              <option value="clicks_asc">Clicks (low → high)</option>
              <option value="last_clicked_desc">Last clicked (new → old)</option>
              <option value="last_clicked_asc">Last clicked (old → new)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          {!hasResults && (
            <div className="p-4 text-sm text-gray-500">
              No links match your search.
            </div>
          )}

          {hasResults && (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                    Short URL
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                    Target
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">
                    Clicks
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                    Last clicked
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {processedLinks.map((l) => {
                  const statsUrl = `${FRONTEND_URL}/code/${l.code}`;
                  const lastClicked = l.last_clicked
                    ? new Date(l.last_clicked).toLocaleString()
                    : '—';

                  const shortUrl = `${REDIRECT_BASE}/${l.code}`;
                  const isOpening = openingCode === l.code;

                  return (
                    <tr
                      key={l.code}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-3 py-2 border-b align-middle">
                        <a
                          href={statsUrl}
                          className="text-blue-600 hover:underline font-semibold"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {l.code}
                        </a>
                      </td>

                      {/* Short URL + Copy */}
                      <td className="px-3 py-2 border-b align-middle">
                        <div className="flex items-center gap-2 max-w-[260px]">
                          <span className="font-mono text-xs text-gray-800 truncate">
                            {shortUrl}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(shortUrl)
                            }
                            className="p-1 rounded-lg border border-black text-black hover:bg-gray-100 shadow-sm"
                            title="Copy short URL"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Target URL */}
                      <td
                        className="px-3 py-2 border-b align-middle text-gray-800"
                        style={{
                          maxWidth: 320,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={l.url}
                      >
                        {l.url}
                      </td>

                      <td className="px-3 py-2 border-b text-right align-middle">
                        {l.total_clicks}
                      </td>

                      <td className="px-3 py-2 border-b align-middle text-gray-600">
                        {lastClicked}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 border-b text-right align-middle">
                        <div className="flex justify-end gap-2">
                          {/* Open */}
                          <button
                            type="button"
                            onClick={() => openOne(l.code)}
                            className={
                              'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border transition-colors ' +
                              (isOpening
                                ? 'bg-white text-white border-black justify-center'
                                : 'bg-white text-black border-black hover:bg-gray-100 justify-start')
                            }
                          >
                            {isOpening ? (
                              <img
                                src="/icons/opening.gif"
                                alt="Opening"
                                className="w-4 h-4"
                              />
                            ) : (
                              <>
                                <svg
                                  className="w-3.5 h-3.5 mr-1"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                Open
                              </>
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(l.code)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white text-black border border-black hover:bg-gray-100 text-xs font-medium shadow-sm"
                          >
                            <svg
                              className="w-3.5 h-3.5 mr-1"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
