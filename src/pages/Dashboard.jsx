import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LinkForm from '../components/LinkForm';
import LinksTable from '../components/LinksTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState('');

  const fetchLinks = async (emailToUse) => {
    const email = emailToUse || currentEmail;
    if (!email) {
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/api/links`, {
        params: { email },
      });
      setLinks(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // whenever currentEmail changes (from form), refetch
  useEffect(() => {
    if (currentEmail) {
      fetchLinks(currentEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmail]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <img
          src="/icons/logo.png"
          className="h-10 w-10 rounded-xl shadow"
          alt="TinyLink"
        />
        <h1 className="text-2xl font-bold">TinyLink Dashboard</h1>
      </div>

      <LinkForm
        onCreated={fetchLinks}
        currentEmail={currentEmail}
        setCurrentEmail={setCurrentEmail}
      />

      <div className="mt-6">
        <LinksTable links={links} loading={loading} onRefresh={fetchLinks} />
      </div>
    </div>
  );
}
