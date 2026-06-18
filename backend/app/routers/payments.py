"""Payments router — payment tracking for multiple methods (Stripe, cash, check, Venmo, Zelle, pay-at-location)."""

import stripe
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Payment, User, CourtBooking, ClassEnrollment, ClassSession
from app.schemas import (
    PaymentOut, PaymentCreate, PaymentUpdate, MessageResponse,
    ALL_PAYMENT_METHODS, PAYMENT_METHOD_LABELS,
)
from app.config import get_settings

settings = get_settings()

# Configure Stripe SDK — only if secret key is set
if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key

router = APIRouter()


# ── Payment method configuration ────────────────────────────────────────────
# Gina can toggle which methods she accepts via environment variables or DB config.
# For now, all methods are enabled by default. Stripe is only active if keys are set.

def _get_enabled_methods() -> dict:
    """Return which payment methods are enabled and their display info."""
    stripe_enabled = bool(settings.stripe_secret_key)
    return {
        "methods": [
            {
                "id": method,
                "label": PAYMENT_METHOD_LABELS.get(method, method),
                "enabled": method != "stripe" or stripe_enabled,
            }
            for method in ALL_PAYMENT_METHODS
        ],
        "venmo_handle": getattr(settings, 'venmo_handle', ''),
        "zelle_info": getattr(settings, 'zelle_info', ''),
        "stripe_publishable_key": settings.stripe_publishable_key if stripe_enabled else '',
    }


@router.get("/methods")
def get_payment_methods():
    """Return available payment methods and their configuration.
    
    The frontend uses this to show the right payment options to customers.
    Stripe is only shown if the API keys are configured.
    """
    return _get_enabled_methods()


@router.get("", response_model=list[PaymentOut])
def list_payments(
    user_id: str = None,
    status: str = None,
    payment_type: str = None,
    payment_method: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List payments, optionally filter by user, status, type, or method."""
    query = db.query(Payment)
    if user_id:
        query = query.filter(Payment.user_id == user_id)
    if status:
        query = query.filter(Payment.status == status)
    if payment_type:
        query = query.filter(Payment.payment_type == payment_type)
    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)
    query = query.order_by(Payment.created_at.desc())
    return query.offset(offset).limit(limit).all()


@router.get("/stats")
def get_payment_stats(db: Session = Depends(get_db)):
    """Get payment statistics for the admin dashboard."""
    from sqlalchemy import func
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "completed").scalar() or 0
    pending_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "pending").scalar() or 0
    total_payments = db.query(Payment).count()
    completed_payments = db.query(Payment).filter(Payment.status == "completed").count()

    # Breakdown by payment method
    method_breakdown = {}
    for method in ALL_PAYMENT_METHODS:
        method_total = db.query(func.sum(Payment.amount)).filter(
            Payment.payment_method == method,
            Payment.status == "completed",
        ).scalar() or 0
        method_count = db.query(Payment).filter(
            Payment.payment_method == method,
        ).count()
        method_breakdown[method] = {
            "total": float(method_total),
            "count": method_count,
            "label": PAYMENT_METHOD_LABELS.get(method, method),
        }

    return {
        "total_revenue": float(total_revenue),
        "pending_revenue": float(pending_revenue),
        "total_payments": total_payments,
        "completed_payments": completed_payments,
        "method_breakdown": method_breakdown,
    }


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: str, db: Session = Depends(get_db)):
    """Get a single payment by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("", response_model=PaymentOut, status_code=201)
def create_payment(body: PaymentCreate, db: Session = Depends(get_db)):
    """Create a payment record for any payment method.
    
    For Stripe payments, this creates a pending record that gets updated
    when the Stripe webhook confirms payment.
    
    For offline methods (cash, check, Venmo, Zelle, pay-at-location),
    the payment starts as "pending" and Gina marks it "completed" when
    she receives the money.
    """
    # Validate payment method
    if body.payment_method not in ALL_PAYMENT_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment method. Must be one of: {', '.join(ALL_PAYMENT_METHODS)}"
        )

    # Verify user exists
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # For offline methods, set status based on method
    initial_status = "pending"
    if body.payment_method == "pay_at_location":
        initial_status = "pending"  # Customer pays when they arrive; Gina confirms

    payment = Payment(
        user_id=body.user_id,
        amount=body.amount,
        payment_type=body.payment_type,
        payment_method=body.payment_method,
        related_id=body.related_id,
        description=body.description,
        status=initial_status,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# ── Stripe Checkout Session ──────────────────────────────────────────────────

@router.post("/create-checkout-session")
def create_stripe_checkout_session(
    user_id: str,
    amount: int,           # Amount in cents (e.g., 3500 = $35.00)
    payment_type: str,     # "class", "booking", "assessment"
    related_id: str = "",
    description: str = "",
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout Session for card payments.
    
    The customer is redirected to a Stripe-hosted payment page where they
    enter their card number. After payment, Stripe redirects them back to
    the site and a webhook confirms the payment.
    
    This is the "just enter your card" experience — the customer never
    leaves your site's branding, and Stripe handles all the security (PCI compliance).
    
    Args:
        user_id: The user making the payment
        amount: Amount in cents (e.g., 3500 for $35.00)
        payment_type: What they're paying for ("class", "booking", "assessment")
        related_id: ID of the related class/booking/assessment
        description: Human-readable description
    """
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=400, detail="Stripe is not configured. Use an offline payment method instead.")

    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create a pending payment record first
    payment = Payment(
        user_id=user_id,
        amount=amount / 100,  # Convert cents to dollars
        payment_type=payment_type,
        payment_method="stripe",
        related_id=related_id,
        description=description,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    try:
        # Create Stripe Checkout Session
        # This is what gives the customer the "enter your card number" experience
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],  # Accept credit/debit cards
            line_items=[
                {
                    "price_data": {
                        "currency": settings.stripe_currency,
                        "product_data": {
                            "name": description or f"{payment_type.title()} Payment",
                            "description": f"{payment_type.title()} — Gina's Tennis World",
                        },
                        "unit_amount": amount,  # Amount in cents
                    },
                    "quantity": 1,
                },
            ],
            mode="payment",
            success_url=f"{settings.frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&payment_id={payment.id}",
            cancel_url=f"{settings.frontend_url}/checkout/cancel?payment_id={payment.id}",
            metadata={
                "payment_id": payment.id,
                "user_id": user_id,
                "payment_type": payment_type,
                "related_id": related_id or "",
            },
            customer_email=user.email,
        )

        # Save the checkout session ID on the payment
        payment.stripe_checkout_session_id = checkout_session.id
        db.commit()

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "payment_id": payment.id,
        }

    except stripe.error.StripeError as e:
        # If Stripe fails, mark the payment as failed
        payment.status = "failed"
        payment.admin_notes = f"Stripe error: {str(e)}"
        db.commit()
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment(payment_id: str, body: PaymentUpdate, db: Session = Depends(get_db)):
    """Update a payment — Gina uses this to confirm offline payments.
    
    Examples:
    - Mark a cash payment as completed: {"status": "completed", "admin_notes": "Cash received"}
    - Mark a check as completed: {"status": "completed", "admin_notes": "Check #1234 cleared"}
    - Mark a Venmo payment as completed: {"status": "completed", "admin_notes": "Venmo received from @user"}
    - Update Stripe payment with intent ID: {"stripe_payment_intent_id": "pi_xxx", "status": "completed"}
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if body.status is not None:
        payment.status = body.status
    if body.payment_method is not None:
        if body.payment_method not in ALL_PAYMENT_METHODS:
            raise HTTPException(status_code=400, detail=f"Invalid payment method: {body.payment_method}")
        payment.payment_method = body.payment_method
    if body.stripe_payment_intent_id is not None:
        payment.stripe_payment_intent_id = body.stripe_payment_intent_id
    if body.stripe_checkout_session_id is not None:
        payment.stripe_checkout_session_id = body.stripe_checkout_session_id
    if body.admin_notes is not None:
        payment.admin_notes = body.admin_notes

    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{payment_id}/confirm", response_model=PaymentOut)
def confirm_offline_payment(payment_id: str, admin_notes: str = "", db: Session = Depends(get_db)):
    """Convenience endpoint: Gina confirms she received an offline payment.
    
    Sets status to "completed" and optionally adds admin notes.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = "completed"
    if admin_notes:
        payment.admin_notes = admin_notes

    db.commit()
    db.refresh(payment)
    return payment


@router.post("/stripe-webhook", status_code=200)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook handler — receives payment events from Stripe.
    
    This is how Stripe tells your server that a payment went through.
    When a customer enters their card and pays, Stripe sends an event here
    and we update the payment status automatically.
    
    Events handled:
    - checkout.session.completed → Mark payment as completed
    - payment_intent.succeeded → Update payment with intent ID
    - payment_intent.failed → Mark payment as failed
    - charge.refunded → Mark payment as refunded
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify webhook signature in production
    if settings.stripe_webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid Stripe signature")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    else:
        # In development (no webhook secret), just parse the JSON
        try:
            event = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event.get("type", "")

    # ── Handle checkout.session.completed ────────────────────────────────
    if event_type == "checkout.session.completed":
        session_data = event["data"]["object"]
        payment_id = session_data.get("metadata", {}).get("payment_id")
        if payment_id:
            payment = db.query(Payment).filter(Payment.id == payment_id).first()
            if payment:
                payment.status = "completed"
                payment.stripe_checkout_session_id = session_data.get("id", "")
                payment.stripe_payment_intent_id = session_data.get("payment_intent", "")
                db.commit()
                print(f"✅ Stripe checkout completed for payment {payment_id}")

    # ── Handle payment_intent.succeeded ──────────────────────────────────
    elif event_type == "payment_intent.succeeded":
        intent_data = event["data"]["object"]
        intent_id = intent_data.get("id", "")
        # Find payment by stripe_payment_intent_id
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == intent_id
        ).first()
        if payment:
            payment.status = "completed"
            db.commit()

    # ── Handle payment_intent.failed ─────────────────────────────────────
    elif event_type == "payment_intent.payment_failed":
        intent_data = event["data"]["object"]
        intent_id = intent_data.get("id", "")
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == intent_id
        ).first()
        if payment:
            payment.status = "failed"
            payment.admin_notes = f"Stripe payment failed: {intent_data.get('last_payment_error', {}).get('message', 'Unknown error')}"
            db.commit()

    # ── Handle charge.refunded ───────────────────────────────────────────
    elif event_type == "charge.refunded":
        charge_data = event["data"]["object"]
        payment_intent_id = charge_data.get("payment_intent", "")
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent_id
        ).first()
        if payment:
            payment.status = "refunded"
            payment.admin_notes = f"Refunded via Stripe on {event.get('created', '')}"
            db.commit()

    return {"status": "received", "event_type": event_type}


@router.delete("/{payment_id}", response_model=MessageResponse)
def delete_payment(payment_id: str, db: Session = Depends(get_db)):
    """Delete a payment record (admin only)."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return MessageResponse(message="Payment deleted")