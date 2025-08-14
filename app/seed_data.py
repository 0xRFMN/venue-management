#!/usr/bin/env python3

import requests
import json

API_BASE_URL = 'http://localhost:8000'
API_KEY = 'your-secret-api-key'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Sample venues data
venues_data = """Madison Square Garden | The World's Most Famous Arena in NYC
Barclays Center | Modern sports and entertainment venue in Brooklyn
MetLife Stadium | Home of NY Giants and Jets in East Rutherford
Radio City Music Hall | Iconic Art Deco venue for music and shows
Brooklyn Academy of Music | Historic performing arts venue
Webster Hall | Famous music venue in East Village
Terminal 5 | Popular concert venue in Hell's Kitchen
Irving Plaza | Intimate live music venue in Union Square
Beacon Theatre | Historic theater on the Upper West Side
Apollo Theater | Legendary venue in Harlem"""

# Sample events for each venue type
venue_events = {
    "Madison Square Garden": [
        ("Knicks vs Lakers", "https://msg.com/knicks/tickets/123", "nyk-lal-123"),
        ("Rangers vs Devils", "https://msg.com/rangers/tickets/456", "nyr-njd-456"),
        ("Billy Joel Concert", "https://msg.com/events/789", "billy-789"),
        ("NBA All-Star Game", "https://msg.com/nba-allstar/001", "nba-001"),
    ],
    "Barclays Center": [
        ("Nets vs Warriors", "https://barclayscenter.com/events/nets-warriors-abc123", "abc123"),
        ("Drake Concert", "https://barclayscenter.com/events/drake-def456", "def456"),
        ("UFC Fight Night", "https://barclayscenter.com/events/ufc-ghi789", "ghi789"),
    ],
    "MetLife Stadium": [
        ("Giants vs Cowboys", "https://metlifestadium.com/events/giants-cowboys-001", "001"),
        ("Jets vs Patriots", "https://metlifestadium.com/events/jets-patriots-002", "002"),
        ("Taylor Swift Concert", "https://metlifestadium.com/events/taylor-swift-003", "003"),
        ("International Soccer Match", "https://metlifestadium.com/events/soccer-004", "004"),
    ],
    "Radio City Music Hall": [
        ("Christmas Spectacular", "https://radiocity.com/christmas-spectacular-2024", "xmas-2024"),
        ("Comedy Show", "https://radiocity.com/comedy-night-may", "comedy-may"),
        ("Spring Symphony", "https://radiocity.com/symphony-spring-2024", "symphony-spring"),
    ],
    "Brooklyn Academy of Music": [
        ("Modern Dance Performance", "https://bam.org/dance-performance-fall", "dance-fall"),
        ("Experimental Theater", "https://bam.org/experimental-theater-spring", "theater-spring"),
        ("Jazz Festival", "https://bam.org/jazz-festival-2024", "jazz-2024"),
    ],
    "Webster Hall": [
        ("Indie Rock Show", "https://websterhall.com/indie-rock-show-001", "indie-001"),
        ("Electronic Music Night", "https://websterhall.com/electronic-night-002", "electronic-002"),
        ("Album Release Party", "https://websterhall.com/album-release-003", "release-003"),
    ],
    "Terminal 5": [
        ("Alt Rock Concert", "https://terminal5nyc.com/alt-rock-concert-a1", "a1"),
        ("Hip Hop Show", "https://terminal5nyc.com/hip-hop-show-b2", "b2"),
        ("Pop Punk Revival", "https://terminal5nyc.com/pop-punk-c3", "c3"),
    ],
    "Irving Plaza": [
        ("Singer Songwriter Night", "https://irvingplaza.com/singer-songwriter-x1", "x1"),
        ("Rock Tribute Band", "https://irvingplaza.com/rock-tribute-y2", "y2"),
        ("Local Band Showcase", "https://irvingplaza.com/local-showcase-z3", "z3"),
    ],
    "Beacon Theatre": [
        ("Classic Rock Legends", "https://beacontheatre.com/classic-rock-legends-m1", "m1"),
        ("Broadway Stars Concert", "https://beacontheatre.com/broadway-stars-n2", "n2"),
        ("Comedy Special Taping", "https://beacontheatre.com/comedy-special-o3", "o3"),
    ],
    "Apollo Theater": [
        ("Amateur Night", "https://apollotheater.org/amateur-night-p1", "p1"),
        ("Jazz Legends Tribute", "https://apollotheater.org/jazz-legends-q2", "q2"),
        ("Gospel Music Festival", "https://apollotheater.org/gospel-festival-r3", "r3"),
    ]
}

def seed_venues():
    print("🏟️  Creating venues...")
    response = requests.post(
        f"{API_BASE_URL}/venues/bulk",
        headers=headers,
        json={"bulk_input": venues_data}
    )
    if response.status_code == 200:
        venues = response.json()
        print(f"✅ Created {len(venues)} venues")
        return venues
    else:
        print(f"❌ Failed to create venues: {response.status_code}")
        print(response.text)
        return []

def seed_events(venues):
    print("🎭 Creating events...")
    total_events = 0
    
    for venue in venues:
        venue_name = venue['name']
        if venue_name in venue_events:
            events_data = venue_events[venue_name]
            
            for event_name, event_url, event_id in events_data:
                event_payload = {
                    "name": event_name,
                    "url": event_url,
                    "venue_id": venue['id'],
                    "date": "2024-12-15",  # Sample date
                    "time": "19:30"        # Sample time
                }
                
                response = requests.post(
                    f"{API_BASE_URL}/events/",
                    headers=headers,
                    json=event_payload
                )
                
                if response.status_code == 200:
                    total_events += 1
                    print(f"  ✅ Added '{event_name}' to {venue_name}")
                else:
                    print(f"  ❌ Failed to add '{event_name}': {response.status_code}")
    
    print(f"✅ Created {total_events} events total")

def main():
    print("🌱 Seeding database with sample data...")
    print("="*50)
    
    # Create venues
    venues = seed_venues()
    
    if venues:
        # Create events for each venue
        seed_events(venues)
        
        print("="*50)
        print("🎉 Database seeded successfully!")
        print(f"📊 Summary:")
        print(f"   • {len(venues)} venues created")
        print(f"   • Events added to each venue")
        print(f"   • Base URLs will be auto-detected")
        print("\n🔍 Try searching for:")
        print("   • Venue names: 'Madison', 'Barclays'")
        print("   • Event IDs: '123', 'abc123', 'def456'")
        print("\n🌐 Visit: http://localhost:5175")
    else:
        print("❌ Seeding failed!")

if __name__ == "__main__":
    main()