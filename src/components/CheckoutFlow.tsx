import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  FileText,
  Lock,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { OrderSubmitResult } from '../hooks/useInventorySocket';
import {
  CartItem,
  CheckoutBuyerDetails,
  DeliveryTier,
  OrderConfirmation,
  OrderRequest,
  PaymentMethod,
  Product,
} from '../types/store';
import { TemplateCover } from './TemplateCover';

interface CheckoutFlowProps {
  isOpen: boolean;
  cartItems: CartItem[];
  products: Product[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, variantId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onSubmitOrder: (order: OrderRequest) => Promise<OrderSubmitResult>;
  onOrderCompleted: () => void;
}

type CheckoutStep = 'buyer' | 'payment' | 'confirmation';

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function CheckoutFlow({
  isOpen,
  cartItems,
  products,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  onOrderCompleted,
}: CheckoutFlowProps) {
  const [step, setStep] = useState<CheckoutStep>('buyer');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [buyer, setBuyer] = useState<CheckoutBuyerDetails>({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    teamSize: '5–15 seats',
    country: 'United States',
    notes: '',
  });
  const [deliveryTier, setDeliveryTier] = useState<DeliveryTier>('instant');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [invoiceAccepted, setInvoiceAccepted] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  if (!isOpen) return null;

  const resolvedLines = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!product || !variant) return null;
      const unitPrice = product.price + (variant.priceDelta ?? 0);
      const hasStockConflict = item.quantity > variant.stock;
      return {
        item,
        product,
        variant,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        hasStockConflict,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const subtotal = resolvedLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const guidanceFee = deliveryTier === 'guided' ? 95 : 0;
  const total = subtotal + guidanceFee;
  const hasStockConflict = resolvedLines.some((l) => l.hasStockConflict);

  const validateBuyer = () => {
    const nextErrors: Record<string, string> = {};
    if (!buyer.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) {
      nextErrors.email = 'Valid work email is required for template access delivery';
    }
    if (buyer.phone.replace(/\D/g, '').length < 7) {
      nextErrors.phone = 'Contact phone is required for license verification';
    }
    if (!buyer.companyName.trim()) nextErrors.companyName = 'Company or workspace name is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePayment = () => {
    const nextErrors: Record<string, string> = {};
    if (paymentMethod === 'card') {
      if (!cardholderName.trim()) nextErrors.cardholderName = 'Name on card is required';
      if (cardNumber.replace(/\D/g, '').length < 13) {
        nextErrors.cardNumber = 'Enter a valid card number';
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        nextErrors.cardExpiry = 'Use MM/YY format';
      }
      if (cardCvc.replace(/\D/g, '').length < 3) {
        nextErrors.cardCvc = 'Enter 3 or 4 digit security code';
      }
    } else if (!invoiceAccepted) {
      nextErrors.invoiceAccepted = 'Please confirm Net-7 company invoice terms';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (validateBuyer()) {
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (hasStockConflict) {
      setSubmitError('Please resolve live license inventory changes in your summary first.');
      return;
    }
    if (!validatePayment()) return;

    setIsSubmitting(true);
    const digits = cardNumber.replace(/\D/g, '');
    const result = await onSubmitOrder({
      items: cartItems,
      shipping: buyer,
      shippingMethod: deliveryTier,
      payment:
        paymentMethod === 'card'
          ? {
              method: 'card',
              cardLast4: digits.slice(-4),
              cardholderName: cardholderName.trim(),
            }
          : {
              method: 'invoice',
            },
    });
    setIsSubmitting(false);

    if (!result.ok || !result.confirmation) {
      setSubmitError(result.error || 'Could not complete checkout.');
      return;
    }

    setConfirmation(result.confirmation);
    setStep('confirmation');
    onOrderCompleted();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExit = () => {
    if (step === 'confirmation') {
      setStep('buyer');
      setConfirmation(null);
    }
    setSubmitError(null);
    setErrors({});
    onClose();
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const summaryContent = (
    <div className="space-y-5">
      <div className="divide-y divide-[#eee7d8]">
        {resolvedLines.map(({ item, product, variant, unitPrice, lineTotal, hasStockConflict: lineConflict }) => (
          <div key={`${item.productId}-${item.variantId}`} className="py-3.5 first:pt-0 flex gap-3.5">
            <TemplateCover
              eyebrow={product.coverEyebrow}
              title={product.coverTitle}
              tone={product.coverTone}
              compact
              className="w-16 h-16 rounded-lg shrink-0 border border-[#c9a24b]/40"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <p className="font-display text-lg font-semibold text-[#14110a] truncate">
                  {product.name}
                </p>
                <span className="text-sm font-semibold tabular-nums text-[#14110a] shrink-0">
                  ${lineTotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#6b6455] mt-0.5">
                {variant.name} · Qty {item.quantity} × ${unitPrice}
              </p>
              <p
                className={`text-xs mt-1 tabular-nums ${
                  lineConflict ? 'text-[#9b3b2d] font-medium' : 'text-[#176b42]'
                }`}
              >
                {lineConflict
                  ? variant.stock === 0
                    ? 'Batch sold out — remove to continue'
                    : `Live stock dropped to ${variant.stock}`
                  : `${variant.stock} licenses available`}
              </p>

              {lineConflict && (
                <div className="mt-1.5 flex items-center gap-3 text-xs">
                  {variant.stock > 0 && (
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, variant.id, variant.stock)}
                      className="font-semibold text-[#14110a] underline cursor-pointer"
                    >
                      Adjust to {variant.stock}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id, variant.id)}
                    className="text-[#9b3b2d] underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-[#e8e0cc] space-y-2 text-sm">
        <div className="flex justify-between text-[#6b6455]">
          <span>Templates Subtotal</span>
          <span className="tabular-nums text-[#14110a]">${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[#6b6455]">
          <span>
            {deliveryTier === 'guided' ? 'Guided Setup Session (45m)' : 'Instant Access & Setup Guide'}
          </span>
          <span className="tabular-nums text-[#14110a]">
            {guidanceFee === 0 ? 'Included' : `$${guidanceFee}`}
          </span>
        </div>
        <div className="pt-3 border-t border-[#e8e0cc] flex justify-between items-baseline">
          <span className="font-semibold text-[#14110a]">Total</span>
          <span className="font-display text-2xl font-bold tabular-nums text-[#14110a]">
            ${total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-[#faf7f0] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="MGR Solutions Checkout"
    >
      <header className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#c9a24b]/25">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[#b8b09c] hover:text-[#e8d08a] py-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{step === 'confirmation' ? 'Back to Library' : 'Back to Templates'}</span>
          </button>

          <span className="font-display text-xl font-semibold text-[#e8d08a]">
            MGR Solutions
          </span>

          <div className="inline-flex items-center gap-1.5 text-xs text-[#b8b09c]">
            <Lock className="w-3.5 h-3.5 text-[#c9a24b]" aria-hidden="true" />
            <span className="hidden sm:inline">Live License Lock</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1120px] mx-auto px-4 sm:px-8 py-8 lg:py-12">
        {step !== 'confirmation' && (
          <nav aria-label="Checkout steps" className="mb-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.12em]">
            <span
              className={`font-bold ${
                step === 'buyer' ? 'text-[#14110a]' : 'text-[#9c7a2e]'
              }`}
            >
              01. Workspace &amp; Delivery
            </span>
            <span className="text-[#b8b09c]" aria-hidden="true">/</span>
            <span
              className={`font-bold ${
                step === 'payment' ? 'text-[#14110a]' : 'text-[#8c8473]'
              }`}
            >
              02. Payment &amp; Terms
            </span>
            <span className="text-[#b8b09c]" aria-hidden="true">/</span>
            <span className="text-[#8c8473]">03. Instant Access</span>
          </nav>
        )}

        {step === 'confirmation' && confirmation ? (
          <div className="max-w-2xl mx-auto bg-white border border-[#e8e0cc] rounded-[14px] p-6 sm:p-10 shadow-sm">
            <div className="flex items-start gap-4 pb-6 border-b border-[#eee7d8]">
              <div className="w-11 h-11 rounded-full bg-[#176b42]/10 text-[#176b42] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-xs text-[#9c7a2e] font-semibold mb-1">
                  Order #{confirmation.orderNumber}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#14110a] mb-1">
                  {confirmation.status}
                </h1>
                <p className="text-sm text-[#6b6455]">
                  Receipt and ClickUp workspace import links sent to {confirmation.shipping.email}. Release inventory updated across all sessions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#eee7d8] text-sm">
              <div>
                <p className="text-xs font-bold text-[#6b6455] uppercase tracking-[0.1em] mb-2">
                  Licensed Workspace
                </p>
                <p className="font-semibold text-[#14110a]">{confirmation.shipping.companyName}</p>
                <p className="text-[#4a4436]">{confirmation.shipping.fullName}</p>
                <p className="text-[#6b6455] text-xs mt-1">
                  Team size: {confirmation.shipping.teamSize} · {confirmation.shipping.country}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[#6b6455] uppercase tracking-[0.1em] mb-2">
                  Settlement &amp; Support
                </p>
                <p className="font-semibold text-[#14110a]">
                  {confirmation.payment.method === 'invoice'
                    ? 'Company Invoice (Net-7 Terms)'
                    : `Card ending in ${confirmation.payment.cardLast4}`}
                </p>
                <p className="text-[#4a4436] mt-1">
                  {confirmation.shippingMethod === 'guided'
                    ? 'Includes 45-min MGR Guided Setup Call'
                    : 'Self-Guided Import + PDF Documentation'}
                </p>
                <p className="text-xs text-[#9c7a2e] mt-1.5">
                  Questions? support@mgropsolutions.com
                </p>
              </div>
            </div>

            <div className="py-6 border-b border-[#eee7d8] space-y-4">
              <p className="text-xs font-bold text-[#6b6455] uppercase tracking-[0.1em]">
                Issued License Keys &amp; Template Access
              </p>
              {confirmation.items.map((line) => (
                <div
                  key={`${line.productId}-${line.variantId}`}
                  className="p-4 rounded-lg bg-[#faf7f0] border border-[#e8e0cc] space-y-2"
                >
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-display text-xl font-semibold text-[#14110a]">
                        {line.productName}
                      </p>
                      <p className="text-xs text-[#6b6455]">
                        {line.variantName} · Qty {line.quantity}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums text-[#14110a]">
                      ${line.lineTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e8e0cc] text-xs">
                    <span className="font-mono text-[#14110a]">
                      Key: <strong>{line.licenseKey}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(line.licenseKey)}
                      className="inline-flex items-center gap-1.5 text-[#9c7a2e] font-semibold hover:text-[#14110a] cursor-pointer"
                    >
                      {copiedKey === line.licenseKey ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-5 space-y-2 text-sm">
              <div className="flex justify-between text-[#6b6455]">
                <span>Subtotal</span>
                <span className="tabular-nums">${confirmation.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#6b6455]">
                <span>Onboarding Option</span>
                <span className="tabular-nums">
                  {confirmation.shippingCost === 0 ? 'Included' : `$${confirmation.shippingCost}`}
                </span>
              </div>
              <div className="pt-3 border-t border-[#e8e0cc] flex justify-between items-baseline">
                <span className="font-semibold text-[#14110a]">Total</span>
                <span className="font-display text-3xl font-bold tabular-nums text-[#14110a]">
                  ${confirmation.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExit}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.08em] uppercase rounded-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                Return to Template Library
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Mobile Collapsible Order Summary */}
            <div className="lg:hidden bg-white border border-[#e8e0cc] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileSummaryOpen((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm font-medium text-[#14110a] cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Order Summary ({resolvedLines.reduce((s, l) => s + l.item.quantity, 0)} items)</span>
                  {mobileSummaryOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#6b6455]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6b6455]" />
                  )}
                </span>
                <span className="font-display text-lg font-bold tabular-nums">${total.toLocaleString()}</span>
              </button>
              {mobileSummaryOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-[#eee7d8]">{summaryContent}</div>
              )}
            </div>

            {/* Left Column: Checkout Form */}
            <div className="lg:col-span-7 bg-white border border-[#e8e0cc] border-t-2 border-t-[#c9a24b] rounded-xl p-6 sm:p-8 shadow-sm">
              {hasStockConflict && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-lg bg-[#fdf0ee] border border-[#f0c9c2] text-sm text-[#9b3b2d] flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Live release inventory changed</p>
                    <p className="text-xs mt-0.5">
                      Another team claimed licenses while you were checking out. Adjust the highlighted item in your summary to proceed.
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-lg bg-[#fdf0ee] border border-[#f0c9c2] text-sm text-[#9b3b2d]"
                >
                  {submitError}
                </div>
              )}

              {step === 'buyer' ? (
                <form onSubmit={handleContinueToPayment} noValidate className="space-y-6">
                  <div>
                    <h1 className="font-display text-3xl font-semibold text-[#14110a] mb-1">
                      Workspace &amp; Delivery
                    </h1>
                    <p className="text-sm text-[#6b6455]">
                      Enter where we should issue your ClickUp workspace links, license keys, and setup guide.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        value={buyer.fullName}
                        onChange={(e) => setBuyer({ ...buyer, fullName: e.target.value })}
                        placeholder="Alex Rivera"
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-[#9b3b2d]">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="companyName" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                        Company / Workspace Name
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        autoComplete="organization"
                        value={buyer.companyName}
                        onChange={(e) => setBuyer({ ...buyer, companyName: e.target.value })}
                        placeholder="Northstar Advisory"
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-xs text-[#9b3b2d]">{errors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                        Work Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={buyer.email}
                        onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                        placeholder="alex@northstar.co"
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-[#9b3b2d]">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        value={buyer.phone}
                        onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                        placeholder="+1 (555) 234-8910"
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-[#9b3b2d]">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="teamSize" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                        Team Size
                      </label>
                      <select
                        id="teamSize"
                        value={buyer.teamSize}
                        onChange={(e) => setBuyer({ ...buyer, teamSize: e.target.value })}
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                      >
                        <option value="1–4 seats">1–4 seats</option>
                        <option value="5–15 seats">5–15 seats</option>
                        <option value="16–40 seats">16–40 seats</option>
                        <option value="40+ seats">40+ seats</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        autoComplete="country-name"
                        value={buyer.country}
                        onChange={(e) => setBuyer({ ...buyer, country: e.target.value })}
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-2.5">
                      Implementation Mode
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryTier('instant')}
                        className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                          deliveryTier === 'instant'
                            ? 'border-[#9c7a2e] bg-[#faf7f0]'
                            : 'border-[#e8e0cc] hover:border-[#c9a24b]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-[#14110a] mb-1">
                          <span className="inline-flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[#9c7a2e]" aria-hidden="true" />
                            Self-Guided Access
                          </span>
                          <span className="tabular-nums">Included</span>
                        </div>
                        <p className="text-xs text-[#6b6455]">
                          Immediate template link, PDF manual, and walkthrough video
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryTier('guided')}
                        className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                          deliveryTier === 'guided'
                            ? 'border-[#9c7a2e] bg-[#faf7f0]'
                            : 'border-[#e8e0cc] hover:border-[#c9a24b]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-[#14110a] mb-1">
                          <span className="inline-flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#9c7a2e]" aria-hidden="true" />
                            MGR Setup Call
                          </span>
                          <span className="tabular-nums">+$95</span>
                        </div>
                        <p className="text-xs text-[#6b6455]">
                          45-minute live ClickUp adaptation session with an MGR specialist
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={resolvedLines.length === 0 || hasStockConflict}
                      className="w-full sm:w-auto px-7 py-3.5 min-h-[48px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.1em] uppercase rounded-md hover:opacity-90 disabled:bg-[#e8e0cc] disabled:bg-none disabled:text-[#8c8473] transition-opacity cursor-pointer disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePlaceOrder} noValidate className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h1 className="font-display text-3xl font-semibold text-[#14110a] mb-1">
                        Payment &amp; Verification
                      </h1>
                      <p className="text-sm text-[#6b6455]">
                        Issuing licenses to {buyer.companyName} ({buyer.email})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStep('buyer');
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-[#9c7a2e] underline cursor-pointer shrink-0"
                    >
                      Edit Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setPaymentMethod('card');
                      }}
                      className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-[#9c7a2e] bg-[#faf7f0]'
                          : 'border-[#e8e0cc] hover:border-[#c9a24b]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#14110a] mb-1">
                        <CreditCard className="w-4 h-4 text-[#9c7a2e]" aria-hidden="true" />
                        <span>Credit or Debit Card</span>
                      </div>
                      <p className="text-xs text-[#6b6455]">
                        Instant checkout &amp; immediate workspace access
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setPaymentMethod('invoice');
                      }}
                      className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                        paymentMethod === 'invoice'
                          ? 'border-[#9c7a2e] bg-[#faf7f0]'
                          : 'border-[#e8e0cc] hover:border-[#c9a24b]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#14110a] mb-1">
                        <FileText className="w-4 h-4 text-[#9c7a2e]" aria-hidden="true" />
                        <span>Company Invoice (Net-7)</span>
                      </div>
                      <p className="text-xs text-[#6b6455]">
                        Reserve licenses now &amp; settle via corporate invoice
                      </p>
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="sm:col-span-2">
                        <label htmlFor="cardholderName" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                          Name on Card
                        </label>
                        <input
                          id="cardholderName"
                          type="text"
                          autoComplete="cc-name"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                        />
                        {errors.cardholderName && (
                          <p className="mt-1 text-xs text-[#9b3b2d]">{errors.cardholderName}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="cardNumber" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                          Card Number
                        </label>
                        <input
                          id="cardNumber"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3.5 py-2.5 min-h-[44px] font-mono text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                        />
                        {errors.cardNumber && (
                          <p className="mt-1 text-xs text-[#9b3b2d]">{errors.cardNumber}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="cardExpiry" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                          Expiration (MM/YY)
                        </label>
                        <input
                          id="cardExpiry"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="08/29"
                          className="w-full px-3.5 py-2.5 min-h-[44px] font-mono text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                        />
                        {errors.cardExpiry && (
                          <p className="mt-1 text-xs text-[#9b3b2d]">{errors.cardExpiry}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="cardCvc" className="block text-xs font-bold uppercase tracking-wider text-[#4a4436] mb-1.5">
                          Security Code (CVC)
                        </label>
                        <input
                          id="cardCvc"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          placeholder="412"
                          className="w-full px-3.5 py-2.5 min-h-[44px] font-mono text-sm bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/20"
                        />
                        {errors.cardCvc && (
                          <p className="mt-1 text-xs text-[#9b3b2d]">{errors.cardCvc}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-lg bg-[#faf7f0] border border-[#e8e0cc] space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#14110a]">Invoice Total (Net-7)</span>
                        <span className="font-display text-xl font-bold tabular-nums text-[#14110a]">
                          ${total.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6455] leading-relaxed">
                        MGR Solutions will issue a corporate invoice to <strong className="text-[#14110a]">{buyer.email}</strong> for <strong className="text-[#14110a]">{buyer.companyName}</strong> and verify via <span className="font-mono">{buyer.phone}</span>. Licenses are locked immediately upon submission.
                      </p>
                      <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceAccepted}
                          onChange={(e) => setInvoiceAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#9c7a2e]"
                        />
                        <span className="text-xs text-[#14110a]">
                          I authorize Net-7 corporate invoicing for {buyer.companyName}.
                        </span>
                      </label>
                      {errors.invoiceAccepted && (
                        <p className="text-xs text-[#9b3b2d]">{errors.invoiceAccepted}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 text-xs text-[#6b6455]">
                      <ShieldCheck className="w-4 h-4 text-[#176b42]" aria-hidden="true" />
                      <span>Atomic license verification before confirmation</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || hasStockConflict || resolvedLines.length === 0}
                      className="w-full sm:w-auto px-7 py-3.5 min-h-[48px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.1em] uppercase rounded-md hover:opacity-90 disabled:bg-[#e8e0cc] disabled:bg-none disabled:text-[#8c8473] transition-opacity cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? 'Issuing Licenses...'
                        : `Complete Order · $${total.toLocaleString()}`}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Sticky Order Summary */}
            <aside className="hidden lg:block lg:col-span-5 sticky top-24 bg-white border border-[#e8e0cc] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#eee7d8]">
                <h2 className="font-display text-2xl font-semibold text-[#14110a]">
                  Order Summary
                </h2>
                <span className="text-xs font-semibold text-[#176b42]">
                  Live Stock Synced
                </span>
              </div>
              {summaryContent}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
