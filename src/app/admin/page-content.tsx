'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/cn';
import type { Order, OrderStatus } from '@/lib/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  generating: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-700',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status])}>
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
        className="border-border w-full max-w-sm rounded-xl border bg-white p-8"
      >
        <h1 className="font-heading mb-6 text-2xl font-semibold">Admin</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className="border-border focus:border-accent w-full rounded-lg border px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-accent mt-2 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-accent mt-4 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}

// ── Order row ────────────────────────────────────────────────────────────────

function OrderRow({ order, pw }: { order: Order; pw: string }) {
  const [open, setOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(order.status === 'delivered');
  const [songId, setSongId] = useState(order.song_id);

  async function handleDeliver() {
    if (!audioUrl.trim()) return;
    setDelivering(true);
    const res = await fetch('/api/admin/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pw}` },
      body: JSON.stringify({ orderId: order.id, audioUrl: audioUrl.trim() }),
    });
    setDelivering(false);
    if (res.ok) {
      const data = (await res.json()) as { songId: string };
      setSongId(data.songId);
      setDelivered(true);
    } else {
      alert('Delivery failed — check console.');
    }
  }

  return (
    <div className="border-border rounded-xl border bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={delivered ? 'delivered' : order.status} />
          <span className="font-medium">{order.recipient_name}</span>
          <span className="text-muted text-sm">{order.buyer_email}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">{formatDate(order.created_at)}</span>
          <span className="text-muted text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-border space-y-4 border-t p-4">
          {/* Intake */}
          <div>
            <p className="text-muted mb-1 text-xs font-semibold tracking-wider uppercase">Intake</p>
            <div className="text-text space-y-0.5 text-sm">
              <p>
                <strong>Age:</strong> {order.intake_data.age}
              </p>
              <p>
                <strong>Relationship:</strong> {order.intake_data.relationship}
              </p>
              <p>
                <strong>Quirk 1:</strong> {order.intake_data.quirk1}
              </p>
              {order.intake_data.quirk2 && (
                <p>
                  <strong>Quirk 2:</strong> {order.intake_data.quirk2}
                </p>
              )}
              {order.intake_data.quirk3 && (
                <p>
                  <strong>Quirk 3:</strong> {order.intake_data.quirk3}
                </p>
              )}
              <p>
                <strong>Vibe:</strong> {order.intake_data.vibe} &middot; <strong>Genre:</strong>{' '}
                {order.intake_data.genre}
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
            <div className="flex gap-2">
              <input
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="Paste Suno audio URL..."
                className="border-border focus:border-accent flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={handleDeliver}
                disabled={delivering || !audioUrl.trim()}
                className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {delivering ? 'Sending...' : 'Deliver ✉️'}
              </button>
            </div>
          )}

          {delivered && (
            <p className="text-sm text-green-700">
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
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${pw}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { orders: Order[] };
      setOrders(data.orders);
    }
    setLoading(false);
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
        <button onClick={fetchOrders} className="text-muted text-sm underline">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {(['all', 'pending_payment', 'paid', 'done', 'delivered'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              filter === s
                ? 'border-accent text-accent bg-white'
                : 'border-border text-muted bg-white'
            )}
          >
            {s === 'all'
              ? `All (${orders.length})`
              : `${s.replace('_', ' ')} (${statusCounts[s] ?? 0})`}
          </button>
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
