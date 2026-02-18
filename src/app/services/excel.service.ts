import { authService } from './auth.service';

const API = (window as any).__env?.API_EXCEL || 'http://localhost:4000/api/excel';

function authHeaders(): Record<string, string> {
  const token = authService.getToken?.() || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseFilename(header: string | null): string | null {
  if (!header) return null;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch && utfMatch[1]) {
    try { return decodeURIComponent(utfMatch[1].replace(/"/g, '')); } catch { return utfMatch[1]; }
  }
  const match = header.match(/filename="?([^";]+)"?/i);
  return match && match[1] ? match[1] : null;
}

async function postExcel(action: 'unlock' | 'lock', file: File, password?: string): Promise<{ blob: Blob; filename: string }> {
  const form = new FormData();
  form.append('file', file, file.name);
  if (password && String(password).trim()) {
    form.append('password', String(password));
  }

  const res = await fetch(`${API}/${action}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form
  });

  if (!res.ok) {
    let msg = 'Error procesando el archivo';
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {
      try { msg = await res.text(); } catch {}
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const filename = parseFilename(res.headers.get('content-disposition')) || file.name;
  return { blob, filename };
}

export const excelService = {
  async unlockExcel(file: File) {
    return postExcel('unlock', file);
  },
  async lockExcel(file: File, password?: string) {
    return postExcel('lock', file, password);
  }
};
