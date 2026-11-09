from app.database import SessionLocal
from app.models.orm import ServiceBooking, User, Farm
from datetime import date

db = SessionLocal()
b_count = db.query(ServiceBooking).count()
print(f"Current bookings count: {b_count}")

if b_count == 0:
    user = db.query(User).first()
    farm = db.query(Farm).first()
    if user:
        booking = ServiceBooking(
            user_id=user.id,
            farm_id=farm.id if farm else None,
            service_type="spray",
            scheduled_date=date(2026, 10, 28),
            area_acres=2.5,
            notes="[Strategy: Precision Spot Spraying] Target NDVI stressed zone on North boundary",
            status="confirmed",
        )
        db.add(booking)
        db.commit()
        print("Successfully seeded a sample confirmed booking!")

db.close()
