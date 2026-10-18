export default function PaymentButtonIcon() {
  return (
    <span className="payment-button-icon" aria-hidden="true">
      <span className="payment-button-icon__card">
        <span className="payment-button-icon__stripe" />
        <span className="payment-button-icon__dots" />
      </span>
      <span className="payment-button-icon__receipt">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}
