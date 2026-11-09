from app.database import engine, SessionLocal
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # 1. Create operators table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS operators (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                equipment_type VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                base_location VARCHAR(255) NOT NULL,
                lat NUMERIC(10, 6) DEFAULT 18.5204,
                lng NUMERIC(10, 6) DEFAULT 73.8567,
                operating_radius_km INTEGER DEFAULT 25,
                rating NUMERIC(3, 2) DEFAULT 4.9,
                completed_jobs INTEGER DEFAULT 120,
                dgca_license VARCHAR(100),
                is_verified BOOLEAN DEFAULT TRUE,
                status VARCHAR(50) DEFAULT 'standby',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # 2. Add new columns to service_bookings table
        booking_columns = [
            ("escrow_amount", "NUMERIC(10, 2) DEFAULT 875.00"),
            ("escrow_status", "VARCHAR(50) DEFAULT 'held_in_escrow'"),
            ("payment_method", "VARCHAR(50) DEFAULT 'upi_autopay'"),
            ("operator_id", "UUID"),
            ("operator_name", "VARCHAR(255)"),
            ("operator_phone", "VARCHAR(50)"),
            ("operator_vehicle", "VARCHAR(255)"),
            ("operator_distance_km", "NUMERIC(5, 2) DEFAULT 4.8"),
            ("proof_of_work_status", "VARCHAR(50) DEFAULT 'unverified'"),
            ("proof_coverage_pct", "NUMERIC(5, 2) DEFAULT 0.0"),
            ("proof_log_name", "VARCHAR(255)"),
            ("proof_verified_at", "TIMESTAMP"),
            ("payout_released_at", "TIMESTAMP"),
            ("dispatch_whatsapp_url", "TEXT"),
        ]

        for col_name, col_type in booking_columns:
            conn.execute(text(f"""
                ALTER TABLE service_bookings 
                ADD COLUMN IF NOT EXISTS {col_name} {col_type};
            """))

        conn.commit()
        print("[OK] Successfully executed database schema migration for Uber Farm Mechanization!")

    # 3. Seed verified operators
    import uuid
    db = SessionLocal()
    from app.models.orm import Operator

    op_count = db.query(Operator).count()
    print(f"Current operators count: {op_count}")

    if op_count == 0:
        seed_ops = [
            {
                "name": "Garuda Kisan Drone Pilot (Ramesh Shinde)",
                "phone": "+91 98230 45120",
                "equipment_type": "DJI Agras T40 (40L Precision Dual-Nozzle)",
                "category": "drone",
                "base_location": "Khed, Pune Rural",
                "lat": 18.8475,
                "lng": 73.9056,
                "operating_radius_km": 25,
                "rating": 4.95,
                "completed_jobs": 178,
                "dgca_license": "DGCA-RPC-2024-MH-8814",
                "is_verified": True,
                "status": "standby",
            },
            {
                "name": "Sahyadri FPO Custom Hiring Center",
                "phone": "+91 94220 88712",
                "equipment_type": "John Deere 5050D Combine Harvester (Straw Chopper)",
                "category": "machinery",
                "base_location": "Baramati, Pune District",
                "lat": 18.1517,
                "lng": 74.5771,
                "operating_radius_km": 35,
                "rating": 4.88,
                "completed_jobs": 240,
                "dgca_license": "CHC-SMAM-MH-PUN-042",
                "is_verified": True,
                "status": "standby",
            },
            {
                "name": "KisanKraft Precision Drone Hub",
                "phone": "+91 97632 11440",
                "equipment_type": "IoTechWorld Agribot 16L Hybrid Spray Drone",
                "category": "drone",
                "base_location": "Shirur, Pune District",
                "lat": 18.8256,
                "lng": 74.3789,
                "operating_radius_km": 30,
                "rating": 4.91,
                "completed_jobs": 134,
                "dgca_license": "DGCA-RPC-2025-MH-1029",
                "is_verified": True,
                "status": "standby",
            },
            {
                "name": "Mahindra Custom Hiring Center (Laser & Tillage)",
                "phone": "+91 98901 33201",
                "equipment_type": "Mahindra Yuvo 575DI + Dual-Slope Laser Land Leveler",
                "category": "machinery",
                "base_location": "Hadapsar, Pune Outer",
                "lat": 18.5089,
                "lng": 73.9260,
                "operating_radius_km": 40,
                "rating": 4.85,
                "completed_jobs": 310,
                "dgca_license": "CHC-SMAM-MH-PUN-019",
                "is_verified": True,
                "status": "standby",
            },
            {
                "name": "Krishi Vigyan Kendra Mobile Soil Testing Lab",
                "phone": "+91 94033 77190",
                "equipment_type": "Mobile Soil Diagnostic Van (14-Nutrient NPK Spectrometer)",
                "category": "soil",
                "base_location": "Narayangaon, Pune",
                "lat": 19.1217,
                "lng": 73.9782,
                "operating_radius_km": 50,
                "rating": 4.97,
                "completed_jobs": 520,
                "dgca_license": "KVK-GOI-SOIL-LAB-07",
                "is_verified": True,
                "status": "standby",
            },
            {
                "name": "MahaAgro Cold-Chain Logistics Reefer",
                "phone": "+91 98502 66419",
                "equipment_type": "Tata 407 Insulated Reefer Van (-5°C to 15°C Active Chill)",
                "category": "storage",
                "base_location": "Talegaon Cold Storage Hub, Pune",
                "lat": 18.7342,
                "lng": 73.6760,
                "operating_radius_km": 60,
                "rating": 4.92,
                "completed_jobs": 195,
                "dgca_license": "NHM-COLD-CHAIN-MH-12",
                "is_verified": True,
                "status": "standby",
            },
        ]

        for op in seed_ops:
            op_obj = Operator(id=uuid.uuid4(), **op)
            db.add(op_obj)

        db.commit()
        print(f"[OK] Seeded {len(seed_ops)} verified operators across Pune region!")

    db.close()

if __name__ == "__main__":
    run_migration()
