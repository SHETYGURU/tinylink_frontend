import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const REDIRECT_BASE =
  import.meta.env.VITE_REDIRECT_BASE || 'http://localhost:4000';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LinkForm({ onCreated, currentEmail, setCurrentEmail }) {
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(currentEmail || '');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState(1);

  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailPopupError, setEmailPopupError] = useState('');

  // 🔹 On first load, try to pull email from localStorage if parent doesn't have one yet
  useEffect(() => {
    if (currentEmail) return;

    try {
      const stored = typeof window !== 'undefined'
        ? window.localStorage.getItem('tinylink_email')
        : null;

      if (stored && emailRegex.test(stored)) {
        setEmail(stored);
        if (setCurrentEmail) setCurrentEmail(stored);
      }
    } catch (e) {
      console.warn('Could not read email from localStorage', e);
    }
  }, [currentEmail, setCurrentEmail]);

  // actual create logic – only called once we have a valid email
  const doCreate = async (emailToUse) => {
    setMsg(null);
    setLoading(true);

    // processing overlay
    setShowOverlay(true);
    setOverlayStep(1);
    setTimeout(() => setOverlayStep(2), 1500);
    setTimeout(() => setShowOverlay(false), 3500);

    try {
      const r = await axios.post(`${API_URL}/api/links`, {
        url,
        code: code || undefined,
        email: emailToUse,
      });

      setUrl('');
      setCode('');
      setCopied(false);

      const shortUrl = `${REDIRECT_BASE}/${r.data.code}`;

      setMsg({
        type: 'success',
        text: `Short URL: ${shortUrl}`,
        shortUrl,
        code: r.data.code,
      });

      if (onCreated) onCreated(emailToUse);
    } catch (err) {
      const backendError = err.response?.data?.error;
      setMsg({
        type: 'error',
        text:
          backendError ||
          'Error creating link. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // if user already "logged in" with email (parent stored it), use that
    if (currentEmail && emailRegex.test(currentEmail)) {
      await doCreate(currentEmail);
      return;
    }

    // no stored email yet → open popup
    setShowEmailPopup(true);
    setEmailPopupError('');
  };

  const handleEmailConfirm = async () => {
    if (!emailRegex.test(email)) {
      setEmailPopupError('Please enter a valid email address.');
      return;
    }

    // store email globally in parent so next time we skip popup
    if (setCurrentEmail) setCurrentEmail(email);

    // 🔹 persist to localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tinylink_email', email);
      }
    } catch (e) {
      console.warn('Could not write email to localStorage', e);
    }

    setShowEmailPopup(false);
    setEmailPopupError('');

    await doCreate(email);
  };

  const handleCopy = async () => {
    if (!msg?.shortUrl) return;
    await navigator.clipboard.writeText(msg.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 🔹 when user clicks Logout / change email
  const handleChangeEmailClick = () => {
    if (setCurrentEmail) setCurrentEmail('');
    setEmail('');
    setEmailPopupError('');
    setShowEmailPopup(true);

    // clear from localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tinylink_email');
      }
    } catch (e) {
      console.warn('Could not remove email from localStorage', e);
    }
  };

  return (
    <>
      {/* Email popup (only shown when user hasn't provided email yet or when changing) */}
      {showEmailPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl px-6 py-5 max-w-sm w-[90%] text-center shadow-xl border">
            <img
              src="/icons/email-error.gif"
              alt="Enter email"
              className="mx-auto mb-3 h-16 w-16 object-contain"
            />
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Add your email to continue
            </p>
            <p className="text-xs text-gray-500 mb-3">
              We’ll use this to show only your TinyLinks.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border p-2 rounded-lg text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 mb-2"
            />

            {emailPopupError && (
              <p className="text-xs text-red-600 mb-2">{emailPopupError}</p>
            )}

            <div className="flex justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowEmailPopup(false);
                  setEmailPopupError('');
                }}
                className="px-4 py-2 rounded-lg bg-white text-black border border-gray-800 hover:bg-gray-100 text-sm font-medium shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmailConfirm}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium shadow-sm hover:bg-gray-900"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* processing overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl px-8 py-6 max-w-sm w-[90%] text-center shadow-xl border">
            <img
              src="/icons/processing.gif"
              alt="loading"
              className="mx-auto mb-3 h-16 w-16 object-contain"
            />

            {overlayStep === 1 && (
              <p className="text-sm font-semibold text-gray-800">
                Processing…
              </p>
            )}
            {overlayStep === 2 && (
              <p className="text-sm font-semibold text-gray-800">
                Shortening URL…
              </p>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
        className="w-full max-w-xl mx-auto rounded-xl p-6 border bg-white shadow-lg"
      >
        {/* Target URL label + email icon/logout on the right */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Target URL
          </label>

          {currentEmail && (
            <button
              type="button"
              onClick={handleChangeEmailClick}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
            >
              <img
                src="/icons/email.gif"
                alt="Email"
                className="w-4 h-4"
              />
              <span>Logout</span>
            </button>
          )}
        </div>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full border p-2 rounded-lg mt-1 mb-4 text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
        />

        <label className="text-sm font-medium text-gray-700">
          Custom code (optional)
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="abc123"
          className="w-full border p-2 rounded-lg mt-1 mb-4 text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className={
            'px-4 py-2 rounded-lg font-medium shadow transition inline-flex items-center ' +
            (loading
              ? 'bg-black text-white cursor-wait'
              : 'bg-white text-blue-700 border border-blue-600 hover:bg-gray-100')
          }
        >
          {!loading && (
            <img
              src="/icons/create.gif"
              alt="Create"
              className="w-5 h-5 mr-2"
            />
          )}
          {loading ? 'Creating...' : 'Create'}
        </button>

        {msg && (
          <div
            className={
              'mt-4 p-3 rounded-lg text-sm ' +
              (msg.type === 'error'
                ? 'bg-red-100 text-red-700 border border-red-400'
                : 'bg-green-100 text-green-700 border border-green-400')
            }
          >
            {msg.text}
          </div>
        )}

        {msg?.shortUrl && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="2" width="6" height="4" rx="1" />
                    <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4" />
                  </svg>
                  Copy short URL
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </>
  );
}
