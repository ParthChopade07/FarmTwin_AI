import uuid
from app.database import SessionLocal
from app.models.orm import User, MarketplaceListing

db = SessionLocal()
active_count = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active").count()
print(f"Current active listings count: {active_count}")

if active_count < 5:
    user = db.query(User).filter(User.role == "farmer").first()
    if not user:
        user = db.query(User).first()
    
    if user:
        sample_listings = [
            {
                "crop": "Sugarcane",
                "variety": "Co-86032 (High Recovery)",
                "quantity": 180,
                "unit": "Tonne",
                "expected_price": 3400,
                "state": "Maharashtra",
                "district": "Pune",
                "description": "High sucrose yield, grown with drip irrigation, ready for harvest next week. Certified brix 21.5%."
            },
            {
                "crop": "Wheat",
                "variety": "Sharbati Gold (Grade A)",
                "quantity": 65,
                "unit": "Quintal",
                "expected_price": 3150,
                "state": "Maharashtra",
                "district": "Pune",
                "description": "Machine harvested, moisture content 11%, golden lustrous grain, clean and graded."
            },
            {
                "crop": "Soybean",
                "variety": "JS-335 Certified",
                "quantity": 120,
                "unit": "Quintal",
                "expected_price": 4650,
                "state": "Maharashtra",
                "district": "Kolhapur",
                "description": "High oil content (20.5%), sun-dried to 9% moisture, stored in moisture-proof bags."
            },
            {
                "crop": "Tomato",
                "variety": "Abhinav Hybrid",
                "quantity": 40,
                "unit": "Quintal",
                "expected_price": 2200,
                "state": "Maharashtra",
                "district": "Pune",
                "description": "Firm red table tomatoes, excellent shelf life for Pune/Mumbai APMC delivery."
            },
            {
                "crop": "Onion",
                "variety": "Nashik Red (Garwa)",
                "quantity": 90,
                "unit": "Quintal",
                "expected_price": 2800,
                "state": "Maharashtra",
                "district": "Nashik",
                "description": "Cured winter onion with double patti, suitable for long-term storage and export."
            },
            {
                "crop": "Cotton",
                "variety": "Bt Cotton (Long Staple)",
                "quantity": 55,
                "unit": "Quintal",
                "expected_price": 7400,
                "state": "Maharashtra",
                "district": "Aurangabad",
                "description": "Clean first picking, staple length 30mm+, low trash percentage."
            }
        ]

        for item in sample_listings:
            listing = MarketplaceListing(
                user_id=user.id,
                status="active",
                **item
            )
            db.add(listing)
        
        db.commit()
        print(f"Successfully seeded {len(sample_listings)} active marketplace produce listings!")
    else:
        print("No user found in database.")

db.close()
