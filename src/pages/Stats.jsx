import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Stats() {
  const { code } = useParams();
  const [link, setLink] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/links/' + code);
        setLink(r.data);
      } catch (err) {
        setLink(null);
      }
    }
    load();
  }, [code]);

  if (!link) return <div className="p-6">Not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Stats for {link.code}</h1>
      <p className="mt-2">Target: {link.url}</p>
      <p>Total clicks: {link.total_clicks}</p>
      <p>Last clicked: {link.last_clicked ? new Date(link.last_clicked).toString() : 'never'}</p>
    </div>
  );
}
