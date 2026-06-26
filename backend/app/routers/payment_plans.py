"""Payment plans router — create installment plans and list them."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models import PaymentPlan, PaymentPlanInstallment, Payment, User
from app.schemas import PaymentPlanCreate, PaymentPlanOut, InstallmentOut
from app.routers.payments import create_payment
from app.schemas import PaymentCreate

router = APIRouter()


@router.post("", response_model=PaymentPlanOut)
def create_plan(body: PaymentPlanCreate, db: Session = Depends(get_db)):
    """Create a payment plan and generate installments.

    For 'two' — split into 2 equal installments: one now (pending) and one scheduled 30 days later.
    For 'monthly' — split into monthly installments over 3 months (default) unless amount is small.
    """
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan = PaymentPlan(user_id=body.user_id, total_amount=body.total_amount, plan_type=body.plan_type, related_booking_id=body.booking_id, related_enrollment_id=body.enrollment_id)
    db.add(plan)
    db.commit()
    db.refresh(plan)

    installments = []
    if body.plan_type == 'two':
        first = round(body.total_amount / 2, 2)
        second = round(body.total_amount - first, 2)
        # create first installment as pending (due now)
        i1 = PaymentPlanInstallment(plan_id=plan.id, due_date=datetime.utcnow().date().isoformat(), amount=first, status='pending')
        i2 = PaymentPlanInstallment(plan_id=plan.id, due_date=(datetime.utcnow().date() + timedelta(days=30)).isoformat(), amount=second, status='scheduled')
        db.add_all([i1, i2])
        db.commit()
        db.refresh(i1)
        db.refresh(i2)
        installments = [i1, i2]
    elif body.plan_type == 'monthly':
        months = 3
        base = round(body.total_amount / months, 2)
        acc = body.total_amount - base * (months - 1)
        for m in range(months):
            amt = base if m < months - 1 else round(acc, 2)
            due = (datetime.utcnow().date() + timedelta(days=30 * m)).isoformat()
            status = 'pending' if m == 0 else 'scheduled'
            inst = PaymentPlanInstallment(plan_id=plan.id, due_date=due, amount=amt, status=status)
            db.add(inst)
            db.commit()
            db.refresh(inst)
            installments.append(inst)
    else:
        # default: single scheduled payment
        inst = PaymentPlanInstallment(plan_id=plan.id, due_date=datetime.utcnow().date().isoformat(), amount=body.total_amount, status='pending')
        db.add(inst)
        db.commit()
        db.refresh(inst)
        installments = [inst]

    # Convert to schema
    out_installments = [InstallmentOut(id=i.id, due_date=i.due_date, amount=i.amount, status=i.status, payment_id=i.payment_id) for i in installments]
    return PaymentPlanOut(id=plan.id, user_id=plan.user_id, total_amount=plan.total_amount, plan_type=plan.plan_type, installments=out_installments, created_at=plan.created_at)


@router.get("/{plan_id}", response_model=PaymentPlanOut)
def get_plan(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(PaymentPlan).filter(PaymentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    installments = []
    for i in plan.installments:
        installments.append(InstallmentOut(id=i.id, due_date=i.due_date, amount=i.amount, status=i.status, payment_id=i.payment_id))
    return PaymentPlanOut(id=plan.id, user_id=plan.user_id, total_amount=plan.total_amount, plan_type=plan.plan_type, installments=installments, created_at=plan.created_at)
