import { ConnectionStatus } from '../hooks/useInventorySocket';

interface FooterProps {
  connectionStatus: ConnectionStatus;
  onOpenInventoryConsole: () => void;
}

export function Footer({ connectionStatus, onOpenInventoryConsole }: FooterProps) {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#c9a24b]/30 text-[#b8b09c] text-xs">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="font-display text-2xl font-bold tracking-[0.22em] mgr-gold-text">
            MGR
          </p>
          <p>© {new Date().getFullYear()} MGR Solutions</p>
          <p>ClickUp · Operations · Automation · AI</p>
          <p>
            <a
              href="mailto:support@mgropsolutions.com"
              className="text-[#e8d08a] hover:text-[#c9a24b] hover:underline transition-colors"
            >
              support@mgropsolutions.com
            </a>
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 uppercase tracking-[0.1em]" aria-label="Footer">
          <a href="#template-library" className="hover:text-[#e8d08a] transition-colors">
            Templates
          </a>
          <a href="#purchase-flow" className="hover:text-[#e8d08a] transition-colors">
            Purchase Flow
          </a>
          <a
            href="mailto:support@mgropsolutions.com?subject=Templates%20-%20MGR%20Solutions"
            className="hover:text-[#e8d08a] transition-colors"
          >
            Contact
          </a>
          <button
            type="button"
            onClick={onOpenInventoryConsole}
            className="inline-flex items-center gap-2 hover:text-[#e8d08a] transition-colors uppercase tracking-[0.1em] cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-[#2b7a4b]' : 'bg-[#c9a24b]'
              }`}
              aria-hidden="true"
            />
            <span>
              {connectionStatus === 'connected'
                ? 'Live Inventory Connected'
                : 'Reconnecting Inventory'}
            </span>
          </button>
        </nav>

        <div className="uppercase tracking-[0.22em] text-[#c9a24b]">
          Management · Growth · Results
        </div>
      </div>
    </footer>
  );
}
