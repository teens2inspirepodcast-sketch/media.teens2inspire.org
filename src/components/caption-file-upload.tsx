'use client';
import { useState } from 'react';
/** Works with the existing AdminUploadForm: a selected .vtt is uploaded only when Save is clicked. */
export function CaptionFileUpload({ defaultPath = '', defaultLanguage = 'en' }: { defaultPath?: string | null; defaultLanguage?: string | null }) {
  const [fileName, setFileName] = useState('');
  return <div className="studio-upload-field">
    <label>Subtitle file (.vtt)
      <input type="file" accept=".vtt,text/vtt" data-save-upload="true" data-storage="captions" data-target-name="caption_path" onChange={event => setFileName(event.target.files?.[0]?.name || '')}/>
      <small>Optional. Upload a WebVTT file (up to 5 MB) for the video's Captions control. Clicking Save uploads the file to private Supabase Storage.</small>
    </label>
    <input type="hidden" name="caption_path" defaultValue={defaultPath || ''}/>
    <label>Subtitle language
      <select name="caption_language" defaultValue={defaultLanguage || 'en'}>
        <option value="en">English</option><option value="he">עברית — Hebrew</option><option value="yi">ייִדיש — Yiddish</option>
      </select>
    </label>
    {fileName && <small role="status">Selected: {fileName}. The subtitle file will upload when you save.</small>}
    {defaultPath && <small>Existing captions remain attached until you select a replacement.</small>}
  </div>;
}
