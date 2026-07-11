# Production notes

## Billing contract

Frontend never stores Telegram bot tokens, YooKassa shop secrets, webhook secrets, or idempotence keys.

Required backend endpoints:

- `POST /billing/checkout`
  - input: `planId`, `method`, `initData`
  - output: `CheckoutSession`
  - validates Telegram `initData`
  - creates one of:
    - Telegram Stars invoice link for `telegram-stars`
    - YooKassa payment confirmation URL for `sbp` or `yookassa`
- `GET /billing/status/:checkoutId`
  - returns server-confirmed payment status
- `POST /billing/webhooks/telegram-stars`
  - handles `pre_checkout_query` and `successful_payment`
  - stores `telegram_payment_charge_id`
- `POST /billing/webhooks/yookassa`
  - validates YooKassa webhook
  - grants credits only after confirmed payment

## Payment methods

- Telegram Stars: use for digital goods sold inside Telegram. Backend creates bot invoice with currency `XTR`.
- СБП: use through YooKassa payment creation and confirmation URL.
- ЮKassa: use for card/payment form flows through backend payment creation.

## Release checklist

- Set `VITE_BILLING_MODE=production`.
- Set `VITE_BILLING_API_URL` to the production backend.
- Build and serve the Vite bundle through `Dockerfile` + `nginx.conf`.
- Dev-server host: `https://tma-content-assistant.ivantereshin-test.store`.
- Add server-side Telegram `initData` validation.
- Add idempotence keys for payment creation.
- Add webhook signature validation and audit logs.
- Add refund/admin flow before accepting real users.
