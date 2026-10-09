import { ChefHat } from 'lucide-react';
import { Banner } from './controls';
import { HOST_STATUS } from './config';
import { closedBakeryPhrase } from './easterEggs';
import { formatAgo, formatFullTime } from './format';

// The note while the monitor has gone quiet for a while (the jump machine down
// or rebooting): nothing new is known about the servers, so the page says the
// bakery is closed for now rather than that the servers are down. since is
// when the last readings were sent.
export function ClosedBanner({ since, now }) {
  return (
    <Banner icon={ChefHat} color={HOST_STATUS.closed.color} tinted>
      <p className="font-medium text-inkwell">
        The bakery is temporarily closed, and the chefs are {closedBakeryPhrase()}.
      </p>
      <p className="text-inkwell">
        No fresh readings have come in since {formatFullTime(since)} ({formatAgo(now - since)}), so the numbers below
        are from then. The servers themselves may be running just fine, and this page picks up again on its own.
      </p>
    </Banner>
  );
}
