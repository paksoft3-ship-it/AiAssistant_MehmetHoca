import { useState, type FormEvent } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { submitWaitlist, isValidEmail } from '../services/waitlistService';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus('error');
      setMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setStatus('submitting');
    setMessage('');
    const result = await submitWaitlist(email);
    if (result.ok) {
      setStatus('done');
      setMessage(
        result.savedLocally
          ? 'Kaydınız bu cihaza alındı; bağlantı kurulduğunda iletebilirsiniz.'
          : 'Teşekkürler! Beta listesine eklendiniz.',
      );
    } else {
      setStatus('error');
      setMessage('Kayıt alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
        <Check className="h-4 w-4" />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@universite.edu.tr"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            aria-label="E-posta adresi"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Beta'ya Katıl
        </button>
      </div>
      {message && status === 'error' && <p className="text-xs text-red-600">{message}</p>}
      <p className="text-[11px] text-slate-400">
        E-postanız yalnızca beta davetleri için kullanılır. İstediğiniz zaman ayrılabilirsiniz.
      </p>
    </form>
  );
}
