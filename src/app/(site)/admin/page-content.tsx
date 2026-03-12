'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/cn';
import type { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: 'bg-border text-muted border-border',
  paid: 'bg-accent/10 text-accent border-accent/30',
  generating: 'bg-secondary/20 text-text border-secondary/40',
  done: 'bg-muted/15 text-text border-muted/30',
  delivered: 'bg-surface text-muted border-border',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status])}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── Login ────────────────────────────────────────────────────────────────────

function LoginForm({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Verify by attempting a real API call
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${pw}` },
    });
    setLoading(false);
    if (res.ok) {
      sessionStorage.setItem('admin_pw', pw);
      onAuth(pw);
    } else {
      setError('Wrong password.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="border-border bg-surface w-full max-w-sm rounded-xl border p-8"
      >
        <h1 className="font-heading mb-6 text-2xl font-semibold">Admin</h1>
        <Input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className="rounded-xl"
        />
        {error && <p className="text-accent mt-2 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-4 w-full">
          {loading ? 'Checking...' : 'Enter'}
        </Button>
      </form>
    </div>
  );
}

// ── Order row ────────────────────────────────────────────────────────────────

function OrderRow({ order, pw }: { order: Order; pw: string }) {
  const [open, setOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(order.status === 'delivered');
  const [songId, setSongId] = useState(order.song_id);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('orderId', order.id);
      form.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pw}` },
        body: form,
      });
      if (res.ok) {
        const data = (await res.json()) as { audioUrl: string };
        setAudioUrl(data.audioUrl);
      } else {
        alert('Upload failed — check console.');
      }
    } catch {
      alert('Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeliver() {
    if (!audioUrl.trim()) return;
    setDelivering(true);
    try {
      const res = await fetch('/api/admin/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pw}` },
        body: JSON.stringify({ orderId: order.id, audioUrl: audioUrl.trim() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { songId: string };
        setSongId(data.songId);
        setDelivered(true);
      } else {
        alert('Delivery failed — check console.');
      }
    } catch {
      alert('Network error — delivery may not have sent.');
    } finally {
      setDelivering(false);
    }
  }

  return (
    <div className="border-border bg-surface rounded-xl border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <StatusBadge status={delivered ? 'delivered' : order.status} />
          <span className="shrink-0 font-medium">{order.recipient_name}</span>
          <span className="text-muted truncate text-sm">{order.buyer_email}</span>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-muted text-xs">{formatDate(order.created_at)}</span>
          <span className="text-muted text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-border space-y-4 border-t p-4">
          {/* Intake */}
          <div className="bg-border/30 rounded-xl p-3">
            <p className="text-muted mb-1 text-xs font-semibold tracking-wider uppercase">Intake</p>
            <div className="text-text space-y-1 text-sm">
              <p className="whitespace-pre-wrap">{order.intake_data.freeformContext}</p>
              <p className="text-muted pt-1 text-xs">
                <strong>Vibe:</strong> {order.intake_data.vibe}
                {order.intake_data.musicReference && (
                  <>
                    {' '}
                    &middot; <strong>Music:</strong> {order.intake_data.musicReference}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Suno style */}
          {order.suno_style && (
            <div>
              <p className="text-muted mb-1 text-xs font-semibold tracking-wider uppercase">
                Suno Style String
              </p>
              <p className="bg-border/40 rounded-lg p-3 font-mono text-sm">{order.suno_style}</p>
            </div>
          )}

          {/* Lyrics */}
          {order.lyrics && (
            <div>
              <p className="text-muted mb-1 text-xs font-semibold tracking-wider uppercase">
                Lyrics
              </p>
              <pre className="bg-border/40 max-h-60 overflow-y-auto rounded-lg p-3 text-sm whitespace-pre-wrap">
                {order.lyrics}
              </pre>
            </div>
          )}

          {/* Song link if delivered */}
          {songId && (
            <a
              href={`/song/${songId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-sm underline"
            >
              View song page →
            </a>
          )}

          {/* Deliver */}
          {!delivered && (
            <div className="space-y-2">
              {!audioUrl ? (
                <label
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-sm transition-colors',
                    uploading
                      ? 'border-border text-muted cursor-not-allowed'
                      : 'border-accent/40 text-accent hover:border-accent hover:bg-accent/5'
                  )}
                >
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,.aac"
                    disabled={uploading}
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {uploading ? 'Uploading…' : '↑ Upload MP3 / WAV'}
                </label>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <p className="bg-border/40 text-muted flex-1 truncate rounded-xl px-3 py-2 text-xs">
                    ✅ {audioUrl.split('/').pop()}
                  </p>
                  <Button
                    onClick={handleDeliver}
                    disabled={delivering}
                    className="rounded-xl px-4 py-2 sm:w-auto"
                  >
                    {delivering ? 'Sending…' : 'Deliver ✉️'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {delivered && (
            <p className="text-muted bg-secondary/15 border-secondary/40 rounded-xl border px-3 py-2 text-sm">
              ✅ Delivered — email sent to {order.buyer_email}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ pw }: { pw: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { orders: Order[] };
        setOrders(data.orders);
      }
    } catch {
      // Network failure — orders list stays empty
    } finally {
      setLoading(false);
    }
  }, [pw]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">songfor.me admin</h1>
        <Button onClick={fetchOrders} variant="secondary" size="sm" className="rounded-xl">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {(['all', 'pending_payment', 'paid', 'done', 'delivered'] as const).map((s) => (
          <Button
            key={s}
            onClick={() => setFilter(s)}
            variant="secondary"
            size="sm"
            className={cn(
              'rounded-xl text-xs transition-colors',
              filter === s ? 'border-accent bg-accent/10 text-accent' : 'text-muted'
            )}
          >
            {s === 'all'
              ? `All (${orders.length})`
              : `${s.replace('_', ' ')} (${statusCounts[s] ?? 0})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted text-center text-sm">Loading orders...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-center text-sm">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} pw={pw} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function AdminContent() {
  const [pw, setPw] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_pw');
    if (stored) setPw(stored);
  }, []);

  if (!pw) return <LoginForm onAuth={(p) => setPw(p)} />;
  return <Dashboard pw={pw} />;
}
