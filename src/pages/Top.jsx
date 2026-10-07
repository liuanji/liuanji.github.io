import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import GhostNav from '../components/layout/GhostNav';
import HostCard from '../components/top/HostCard';
import LoginCard from '../components/top/LoginCard';
import UsageChart from '../components/top/UsageChart';
import UserRanking from '../components/top/UserRanking';
import {
  DEFAULT_RANGE,
  DELAYED_AFTER_SECONDS,
  HISTORY_REFRESH_MS,
  HOST_STATUS,
  LIVE_REFRESH_MS,
  OFFLINE_AFTER_SECONDS,
  RANGES,
} from '../components/top/config';
import { LiveDot, Notice, SectionLabel, SegmentedControl, StatTile } from '../components/top/controls';
import {
  currentStatus,
  formatAgo,
  formatMemory,
  formatObserved,
  formatPercent,
  formatPower,
  summarize,
} from '../components/top/format';
import { useSession } from '../components/top/useSession';
import { useNow, useStatusFile } from '../components/top/useStatusFile';
import { gpuStatusUrl } from '../data/servers';
import { myCopyrightBody, myUpdateInfo } from '../data/profile';

const EASE = [0.16, 1, 0.3, 1];
const FILE_KEY = /^[a-z0-9][a-z0-9._-]*$/;

function Freshness({ overview, now }) {
  if (!overview.data) {
    const failed = overview.isError;
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-data-grey">
        <LiveDot color={failed ? HOST_STATUS.error.color : HOST_STATUS.unseen.color} />
        {failed ? 'Live data unavailable' : 'Connecting…'}
      </div>
    );
  }
  const age = now - overview.data.generated_at;
  const state =
    age < DELAYED_AFTER_SECONDS
      ? { label: 'Live', color: HOST_STATUS.online.color }
      : age < OFFLINE_AFTER_SECONDS
        ? { label: 'Delayed', color: HOST_STATUS.stale.color }
        : { label: 'Offline', color: HOST_STATUS.error.color };
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-data-grey">
      <LiveDot color={state.color} pulse={state.label === 'Live'} />
      <span className="text-inkwell">{state.label}</span>
      <span>· updated {formatAgo(age)}</span>
    </div>
  );
}

function LiveTiles({ hosts, allHosts }) {
  const summary = summarize(hosts);
  const idle = summary.gpusTotal - summary.gpusBusy;
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile
        label="GPUs in use"
        value={summary.gpusBusy}
        total={summary.gpusTotal}
        caption={allHosts ? `${idle} idle · ${summary.hostsOnline}/${summary.hostsTotal} servers online` : `${idle} idle`}
      />
      <StatTile
        label="GPU compute"
        value={formatPercent(summary.computeLoad)}
        caption={`Average across ${summary.gpusTotal} GPUs`}
      />
      <StatTile
        label="GPU memory"
        value={formatPercent(summary.memoryTotalMb ? (summary.memoryUsedMb / summary.memoryTotalMb) * 100 : 0)}
        caption={`${formatMemory(summary.memoryUsedMb)} of ${formatMemory(summary.memoryTotalMb)}`}
      />
      <StatTile label="GPU power" value={formatPower(summary.powerW)} caption="Current total draw" />
    </div>
  );
}

function PeriodTiles({ period, range }) {
  const ready = period?.has_data;
  const incomplete = ready && Number(period.observed_hours) + 0.02 < range.hours;
  return (
    <>
      {incomplete && (
        <p className="mb-4 font-mono text-xs text-data-grey">
          Only {formatObserved(period.observed_hours)} of data so far in this period.
        </p>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="GPUs in use"
          value={ready ? Number(period.average_busy_gpus).toFixed(1) : '—'}
          total={ready ? period.gpu_count : null}
          caption={ready ? `${formatPercent(period.gpu_usage_percent)} of GPUs on average` : 'No data yet'}
        />
        <StatTile
          label="GPU compute"
          value={ready ? formatPercent(period.compute_load) : '—'}
          caption="Average across GPUs"
        />
        <StatTile
          label="GPU memory"
          value={ready ? formatPercent(period.memory_percent) : '—'}
          caption="Average share in use"
        />
        <StatTile
          label="GPU power"
          value={ready ? formatPower(period.average_power_w) : '—'}
          caption="Average total draw"
        />
      </div>
    </>
  );
}

export default function Top() {
  const [params, setParams] = useSearchParams();
  const now = useNow();
  const { token, signIn, signOut } = useSession();
  const overview = useStatusFile('overview', LIVE_REFRESH_MS, token);
  const hosts = (overview.data?.hosts ?? []).map((item) => ({ ...item, status: currentStatus(item, now) }));

  // Trust ?host= before the overview arrives so its files load in parallel.
  const requestedHost = params.get('host') ?? 'all';
  const host = overview.data
    ? hosts.some((item) => item.name === requestedHost) ? requestedHost : 'all'
    : FILE_KEY.test(requestedHost) ? requestedHost : 'all';
  const range = RANGES.find((item) => item.value === params.get('range')) ?? DEFAULT_RANGE;

  const stats = useStatusFile(`stats-${host}`, HISTORY_REFRESH_MS, token);
  const history = useStatusFile(
    `history-${host}-${range.value}`,
    range.value === '1h' ? LIVE_REFRESH_MS : HISTORY_REFRESH_MS,
    token,
  );

  // An expired session, or one from before a password change, is rejected.
  const rejected = [overview, stats, history].some((query) => query.error?.status === 401);
  useEffect(() => {
    if (rejected) signOut();
  }, [rejected, signOut]);

  const setParam = (key, value, fallback) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const selectedHosts = host === 'all' ? hosts : hosts.filter((item) => item.name === host);
  const hostOptions = [
    {
      value: 'all',
      label: 'All servers',
      dot: hosts.length && hosts.every((item) => item.status === 'online') ? HOST_STATUS.online.color : undefined,
    },
    ...hosts.map((item) => ({
      value: item.name,
      label: item.name,
      dot: (HOST_STATUS[item.status] ?? HOST_STATUS.unseen).color,
    })),
  ];
  const period = stats.data?.periods.find((item) => item.range === range.value);

  return (
    <div className="bg-paper min-h-screen page-enter">
      <GhostNav />
      <main className="pt-24 pb-28">
        <div className="max-w-6xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-10"
          >
            <div className="font-mono text-sm text-data-grey mb-3">Lab Compute</div>
            <h1 className="font-tight font-bold text-5xl lg:text-6xl text-inkwell">GPU Servers</h1>
            <p className="text-data-grey mt-4 max-w-2xl text-base leading-relaxed">
              Live usage of the Tractable Bakery Lab&apos;s servers.
            </p>
            {gpuStatusUrl && token && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Freshness overview={overview} now={now} />
                <button
                  type="button"
                  onClick={signOut}
                  className="font-mono text-xs text-data-grey transition-colors hover:text-inkwell"
                >
                  Sign out
                </button>
              </div>
            )}
          </motion.div>

          {!gpuStatusUrl ? (
            <Notice title="Server status is not available yet">
              This page will show the lab&apos;s GPU servers once their status feed is connected.
            </Notice>
          ) : !token ? (
            <LoginCard onSignIn={signIn} />
          ) : !overview.data ? (
            overview.isError ? (
              <Notice title="Server status is temporarily unavailable">
                The status feed could not be reached. This page retries automatically every minute.
              </Notice>
            ) : (
              <Notice title="Loading server status…">Fetching the latest sample from each server.</Notice>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            >
              {hosts.length > 1 && (
                <div className="mb-12">
                  <SegmentedControl
                    label="Server"
                    options={hostOptions}
                    value={host}
                    onChange={(value) => setParam('host', value, 'all')}
                  />
                </div>
              )}

              <section className="mb-16" aria-labelledby="top-now">
                <h2 id="top-now" className="sr-only">Right now</h2>
                <SectionLabel>Right now</SectionLabel>
                <LiveTiles hosts={selectedHosts} allHosts={host === 'all'} />
                <div className="space-y-6">
                  {selectedHosts.map((item) => (
                    <HostCard key={item.name} host={item} now={now} />
                  ))}
                </div>
              </section>

              <section aria-labelledby="top-history">
                <h2 id="top-history" className="sr-only">Over time</h2>
                <SectionLabel>Over time</SectionLabel>
                <div className="mb-6">
                  <SegmentedControl
                    label="Time range"
                    options={RANGES}
                    value={range.value}
                    onChange={(value) => setParam('range', value, DEFAULT_RANGE.value)}
                  />
                </div>
                <div className={`transition-opacity duration-300 ${stats.isPlaceholderData ? 'opacity-50' : ''}`}>
                  <PeriodTiles period={period} range={range} />
                </div>
                <div
                  className={`mb-6 transition-opacity duration-300 ${history.isPlaceholderData ? 'opacity-50' : ''}`}
                >
                  {history.data ? (
                    <UsageChart history={history.data} range={range.value} />
                  ) : (
                    <Notice title={history.isError ? 'Trend unavailable' : 'Loading trend…'}>
                      {history.isError ? 'This period has not been published yet.' : 'Fetching usage history.'}
                    </Notice>
                  )}
                </div>
                <div className={`transition-opacity duration-300 ${stats.isPlaceholderData ? 'opacity-50' : ''}`}>
                  <UserRanking
                    users={stats.data?.users[range.value] ?? []}
                    rangeTitle={range.title}
                    showHosts={host === 'all' && hosts.length > 1}
                  />
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </main>
      <footer className="py-8 border-t border-border-light">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-data-grey/60">{myCopyrightBody}</div>
          <div className="font-mono text-xs text-data-grey/40">{myUpdateInfo}</div>
        </div>
      </footer>
    </div>
  );
}
