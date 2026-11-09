from app.database import engine
from sqlalchemy import inspect

insp = inspect(engine)
print("Tables:", insp.get_table_names())
if "service_bookings" in insp.get_table_names():
    print("service_bookings cols:", [c["name"] for c in insp.get_columns("service_bookings")])
