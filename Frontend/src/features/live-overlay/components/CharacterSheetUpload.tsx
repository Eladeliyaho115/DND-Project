import React, { useState } from 'react';
import { uploadCharacterSheetPDF } from '../../../services/characterSheetPDFService';

interface Props {
  campaignId: string;
  onSuccess?: () => void;
}

export const CharacterSheetUpload: React.FC<Props> = ({ campaignId, onSuccess }) => {
  const [characterName, setCharacterName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'נא לבחור קובץ PDF בלבד' });
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!characterName.trim()) {
      setMessage({ type: 'error', text: 'נא להזין את שם הדמות' });
      return;
    }

    if (!file) {
      setMessage({ type: 'error', text: 'נא לבחור קובץ PDF' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      await uploadCharacterSheetPDF({
        campaignId,
        characterName: characterName.trim(),
        file,
      });

      setMessage({ type: 'success', text: `דף הדמות של ${characterName} עודכן בהצלחה!` });
      setCharacterName('');
      setFile(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error uploading character sheet:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'שגיאה בהעלאת הקובץ. נסה שנית.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px' }}>
      <h3>העלאת / עדכון דף דמות (PDF)</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>שם הדמות:</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="למשל: Gorgar"
            disabled={loading}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>קובץ PDF:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file || !characterName}
          style={{
            padding: '0.6rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? 'מעלה...' : 'שמור דף דמות'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '1rem', color: message.type === 'success' ? 'green' : 'red' }}>
          {message.text}
        </p>
      )}
    </div>
  );
};