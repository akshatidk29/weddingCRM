const templates = [
  {
    type: 'destination',
    label: 'Destination Wedding',
    emoji: '🏝️',
    description: 'Premium destination celebrations with fewer but grand events. Logistics-heavy with hotel, travel & vendor coordination.',
    vendorNotes: 'Ensure 100+ rooms blocked, airport transfers scheduled for all guests. Hotels (bulk booking, room inventory), Travel agencies (flights, buses), Decorators (theme-based, large setups), Caterers (multi-cuisine, premium), Logistics team (guest handling).',
    events: [
      {
        name: 'Welcome Party', order: 0,
        tasks: [
          { title: 'Book welcome venue / lawn', category: 'logistics', priority: 'high', subtasks: ['Shortlist 3 venue options', 'Confirm capacity for guest count', 'Sign venue contract'] },
          { title: 'Plan welcome drinks & appetizers menu', category: 'fnb', priority: 'medium', subtasks: ['Coordinate with caterer', 'Include vegetarian/non-veg options'] },
          { title: 'Arrange welcome kits for guests', category: 'logistics', priority: 'medium', subtasks: ['Design welcome bag contents', 'Include itinerary card', 'Arrange room delivery'] },
          { title: 'Book DJ / live band for welcome night', category: 'entertainment', priority: 'medium', subtasks: ['Shortlist artists', 'Confirm setlist preferences'] }
        ]
      },
      {
        name: 'Mehendi', order: 1,
        tasks: [
          { title: 'Book mehendi artists', category: 'other', priority: 'high', subtasks: ['Confirm number of artists needed', 'Schedule artist arrival time'] },
          { title: 'Plan mehendi lounge décor', category: 'decor', priority: 'medium', subtasks: ['Finalize color theme', 'Arrange seating & cushions', 'Flower arrangements'] },
          { title: 'Arrange snacks & beverages for mehendi', category: 'fnb', priority: 'medium', subtasks: ['Light snacks menu', 'Drinks station setup'] }
        ]
      },
      {
        name: 'Sangeet', order: 2,
        tasks: [
          { title: 'Book celebrity artist / DJ for sangeet', category: 'entertainment', priority: 'urgent', subtasks: ['Shortlist performers', 'Negotiate contract', 'Confirm sound/AV requirements'] },
          { title: 'Choreography coordination', category: 'entertainment', priority: 'high', subtasks: ['Hire choreographer', 'Schedule rehearsals', 'Finalize song list'] },
          { title: 'Theme-based stage & décor setup', category: 'decor', priority: 'high', subtasks: ['Mood board approval', 'Stage design finalization', 'Lighting plan'] },
          { title: 'Full dinner catering for sangeet', category: 'fnb', priority: 'high', subtasks: ['Multi-cuisine menu planning', 'Live counters', 'Dessert bar'] }
        ]
      },
      {
        name: 'Wedding Ceremony', order: 3,
        tasks: [
          { title: 'Book pandit / officiant', category: 'other', priority: 'urgent', subtasks: ['Confirm rituals list', 'Coordinate timing'] },
          { title: 'Mandap & ceremony décor', category: 'decor', priority: 'urgent', subtasks: ['Mandap design approval', 'Floral arrangement', 'Lighting setup'] },
          { title: 'Bride & groom entry planning', category: 'logistics', priority: 'high', subtasks: ['Entry theme finalization', 'Vehicle/prop arrangement', 'Music coordination'] },
          { title: 'Photography & videography setup', category: 'photography', priority: 'urgent', subtasks: ['Confirm photographer positions', 'Drone permissions', 'Pre-ceremony shoots'] },
          { title: 'Guest seating arrangement', category: 'logistics', priority: 'high', subtasks: ['Chart seating map', 'VIP section arrangement', 'Print place cards'] }
        ]
      },
      {
        name: 'Reception / Farewell Brunch', order: 4,
        tasks: [
          { title: 'Plan farewell brunch menu', category: 'fnb', priority: 'medium', subtasks: ['Breakfast & brunch options', 'Special dietary accommodations'] },
          { title: 'Farewell gift bags for guests', category: 'logistics', priority: 'medium', subtasks: ['Design gift bags', 'Include thank-you note', 'Arrange room delivery'] },
          { title: 'Coordinate guest checkout & airport drops', category: 'logistics', priority: 'high', subtasks: ['Create transport schedule', 'Assign vehicles per flight', 'Share departure sheet with hotel'] }
        ]
      }
    ],
    globalTasks: [
      { title: 'Book hotel rooms for all guests', category: 'logistics', priority: 'urgent', subtasks: ['Get room inventory from hotel', 'Create guest-wise room allocation', 'Share booking confirmation with guests'] },
      { title: 'Arrange airport pickups & drops for all guests', category: 'logistics', priority: 'high', subtasks: ['Collect flight details from guests', 'Book vehicles', 'Create pickup schedule'] },
      { title: 'Coordinate hotel check-in / check-out', category: 'logistics', priority: 'high', subtasks: ['Share guest list with hotel', 'Arrange early check-in if needed', 'Confirm checkout process'] },
      { title: 'Assist guests with flight bookings', category: 'logistics', priority: 'medium', subtasks: ['Share preferred airlines', 'Group booking deals'] },
      { title: 'Share detailed itinerary with all guests', category: 'logistics', priority: 'medium', subtasks: ['Design digital itinerary', 'Send via WhatsApp/email', 'Create travel helpdesk'] },
      { title: 'Arrange vendor travel & accommodation', category: 'logistics', priority: 'high', subtasks: ['Book rooms for key vendors', 'Arrange local transport for vendors'] },
      { title: 'Arrange transport between venues', category: 'logistics', priority: 'high', subtasks: ['Map all venue locations', 'Book shuttle buses', 'Create transport timetable'] }
    ]
  },

  {
    type: 'local',
    label: 'Local Wedding',
    emoji: '🏠',
    description: 'Multi-day celebrations across local venues with maximum events. Focus on venue coordination & function-wise planning.',
    vendorNotes: 'Different décor themes for each function, coordinate quick setup changes. Local decorators, Caterers (per function menus), Makeup artists, Photographers, Transport providers.',
    events: [
      {
        name: 'Engagement', order: 0,
        tasks: [
          { title: 'Book engagement venue', category: 'logistics', priority: 'high', subtasks: ['Shortlist venues', 'Confirm date availability', 'Sign contract'] },
          { title: 'Ring ceremony coordination', category: 'other', priority: 'high', subtasks: ['Ring selection reminder', 'Stage arrangement for ceremony', 'Music for ring exchange'] },
          { title: 'Engagement décor', category: 'decor', priority: 'medium', subtasks: ['Theme selection', 'Stage design', 'Flower arrangements'] },
          { title: 'Engagement catering', category: 'fnb', priority: 'medium', subtasks: ['Snacks & drinks menu', 'Cake arrangement'] }
        ]
      },
      {
        name: 'Mehendi', order: 1,
        tasks: [
          { title: 'Book mehendi artists', category: 'other', priority: 'high', subtasks: ['Confirm artist count', 'Schedule timings for bride & family'] },
          { title: 'Mehendi décor & seating', category: 'decor', priority: 'medium', subtasks: ['Colourful theme setup', 'Cushion seating', 'Photo corner'] },
          { title: 'Mehendi snacks & beverages', category: 'fnb', priority: 'medium', subtasks: ['Light refreshments', 'Chaat counters'] }
        ]
      },
      {
        name: 'Haldi', order: 2,
        tasks: [
          { title: 'Haldi ceremony setup', category: 'decor', priority: 'high', subtasks: ['Yellow theme décor', 'Haldi thali arrangement', 'Seating for elders'] },
          { title: 'Haldi catering', category: 'fnb', priority: 'medium', subtasks: ['Traditional snacks', 'Drinks & refreshments'] },
          { title: 'Photography for haldi', category: 'photography', priority: 'medium', subtasks: ['Candid photographer booking', 'Props arrangement'] }
        ]
      },
      {
        name: 'Sangeet', order: 3,
        tasks: [
          { title: 'Book DJ / band for sangeet', category: 'entertainment', priority: 'high', subtasks: ['Shortlist performers', 'Confirm sound system'] },
          { title: 'Choreography & rehearsals', category: 'entertainment', priority: 'high', subtasks: ['Hire choreographer', 'Schedule family rehearsals'] },
          { title: 'Sangeet stage & lighting', category: 'decor', priority: 'high', subtasks: ['Dance floor setup', 'Stage design', 'Lighting plan'] },
          { title: 'Sangeet dinner', category: 'fnb', priority: 'high', subtasks: ['Full dinner menu', 'Service staff coordination'] }
        ]
      },
      {
        name: 'Wedding', order: 4,
        tasks: [
          { title: 'Book wedding venue', category: 'logistics', priority: 'urgent', subtasks: ['Venue visit', 'Capacity confirmation', 'Contract signing'] },
          { title: 'Mandap & wedding décor', category: 'decor', priority: 'urgent', subtasks: ['Mandap design', 'Floral décor', 'Aisle arrangement'] },
          { title: 'Book pandit / officiant', category: 'other', priority: 'urgent', subtasks: ['Confirm ceremony rituals', 'Coordinate timing'] },
          { title: 'Bride & groom entry planning', category: 'logistics', priority: 'high', subtasks: ['Entry concept', 'Vehicle/prop booking', 'Music selection'] },
          { title: 'Wedding photography & videography', category: 'photography', priority: 'urgent', subtasks: ['Book photographer', 'Confirm coverage scope', 'Pre-wedding shoot scheduling'] },
          { title: 'Wedding catering', category: 'fnb', priority: 'urgent', subtasks: ['Full menu planning', 'Live food counters', 'Guest count tracking'] },
          { title: 'Guest seating plan', category: 'logistics', priority: 'high', subtasks: ['Create seating chart', 'VIP section', 'Place card printing'] }
        ]
      },
      {
        name: 'Reception', order: 5,
        tasks: [
          { title: 'Book reception venue', category: 'logistics', priority: 'high', subtasks: ['Same or different venue confirmation', 'Stage setup for couple'] },
          { title: 'Reception décor & stage', category: 'decor', priority: 'high', subtasks: ['Couple stage design', 'Photo backdrop', 'Lighting'] },
          { title: 'Reception dinner menu', category: 'fnb', priority: 'high', subtasks: ['Multi-cuisine buffet', 'Dessert counters', 'Bar setup'] },
          { title: 'Entertainment for reception', category: 'entertainment', priority: 'medium', subtasks: ['DJ booking', 'Photo booth setup'] }
        ]
      }
    ],
    globalTasks: [
      { title: 'Book multiple venues (or confirm same venue for multiple days)', category: 'logistics', priority: 'urgent', subtasks: ['Venue calendar booking', 'Multi-day rate negotiation'] },
      { title: 'Local transport arrangements', category: 'logistics', priority: 'high', subtasks: ['Cars for family', 'Guest buses', 'Parking management'] },
      { title: 'Function-wise timeline creation', category: 'logistics', priority: 'high', subtasks: ['Create master schedule', 'Share with all vendors', 'Buffer time between functions'] },
      { title: 'Makeup artist booking for all functions', category: 'attire', priority: 'high', subtasks: ['Bride makeup for each event', 'Trial session', 'Family makeup coordination'] }
    ]
  },

  {
    type: 'luxury',
    label: 'Luxury Wedding',
    emoji: '👑',
    description: 'Grand, highly stylized celebrations with premium execution. Everything custom-designed with celebrity-level production.',
    vendorNotes: 'Ensure premium look — no standard décor, everything custom designed. High-end decorators, Luxury hotels/venues, Premium caterers, Celebrity artists/DJs, Production (lighting, AV).',
    events: [
      {
        name: 'Cocktail Night', order: 0,
        tasks: [
          { title: 'Book premium cocktail venue', category: 'logistics', priority: 'high', subtasks: ['Luxury venue shortlist', 'Site visit', 'Contract finalization'] },
          { title: 'Mixology bar & gourmet appetizers', category: 'fnb', priority: 'high', subtasks: ['Hire premium mixologist', 'Signature cocktail creation', 'Gourmet canapés menu'] },
          { title: 'Cocktail night theme & décor', category: 'decor', priority: 'high', subtasks: ['Theme finalization', 'Custom mood board', 'Premium lighting design'] },
          { title: 'Live entertainment for cocktail night', category: 'entertainment', priority: 'medium', subtasks: ['Jazz band / solo artist', 'Background music curation'] }
        ]
      },
      {
        name: 'Mehendi', order: 1,
        tasks: [
          { title: 'Book celebrity mehendi artist', category: 'other', priority: 'high', subtasks: ['Research top artists', 'Book in advance', 'Design consultation'] },
          { title: 'Luxury mehendi lounge décor', category: 'decor', priority: 'high', subtasks: ['Bespoke theme design', 'Premium seating', 'Instagram-worthy corners'] },
          { title: 'Gourmet mehendi catering', category: 'fnb', priority: 'medium', subtasks: ['Specialty chaat counters', 'Premium beverages', 'Dessert display'] }
        ]
      },
      {
        name: 'Sangeet', order: 2,
        tasks: [
          { title: 'Book celebrity performer for sangeet', category: 'entertainment', priority: 'urgent', subtasks: ['Approach artist management', 'Contract negotiation', 'Rider requirements'] },
          { title: 'Professional choreography', category: 'entertainment', priority: 'high', subtasks: ['Celebrity choreographer hiring', 'Dedicated rehearsal space', 'Costume coordination'] },
          { title: 'Custom stage & production design', category: 'decor', priority: 'urgent', subtasks: ['LED wall setup', 'Custom stage build', 'Pyrotechnics planning', 'Professional lighting rig'] },
          { title: 'Gourmet sangeet dinner', category: 'fnb', priority: 'high', subtasks: ['Multiple live counters', 'Specialty chef booking', 'Wine & spirits pairing'] }
        ]
      },
      {
        name: 'Wedding', order: 3,
        tasks: [
          { title: 'Custom mandap design & build', category: 'decor', priority: 'urgent', subtasks: ['Architect consultation', 'Custom structure fabrication', 'Premium floral installation'] },
          { title: 'Cinematic photography & videography', category: 'photography', priority: 'urgent', subtasks: ['Top cinematographer booking', 'Drone coverage', 'Same-day edit arrangement'] },
          { title: 'Grand bride & groom entry', category: 'logistics', priority: 'high', subtasks: ['Helicopter / luxury car entry', 'Pyrotechnics', 'Live band accompaniment'] },
          { title: 'Luxury seating & lighting experience', category: 'decor', priority: 'high', subtasks: ['Designer furniture rental', 'Ambient lighting design', 'Aisle installation'] },
          { title: 'Premium wedding catering', category: 'fnb', priority: 'urgent', subtasks: ['Celebrity chef booking', 'Multi-cuisine gourmet menu', 'Live pasta / sushi counters'] }
        ]
      },
      {
        name: 'Reception', order: 4,
        tasks: [
          { title: 'Grand reception stage & backdrop', category: 'decor', priority: 'high', subtasks: ['Custom backdrop design', 'Flower wall', 'Neon signage'] },
          { title: 'Premium reception dinner', category: 'fnb', priority: 'high', subtasks: ['7-course dinner option', 'Premium bar setup', 'Dessert spectacle'] },
          { title: 'DJ & after-party arrangements', category: 'entertainment', priority: 'high', subtasks: ['International DJ booking', 'After-party venue', 'Sound & lighting'] }
        ]
      }
    ],
    globalTasks: [
      { title: 'Theme finalization across all events', category: 'decor', priority: 'urgent', subtasks: ['Master mood board', 'Color palette for each function', 'Vendor design brief'] },
      { title: 'Pre-wedding shoot planning', category: 'photography', priority: 'high', subtasks: ['Location scouting', 'Outfit coordination', 'Cinematic storyline'] },
      { title: 'Luxury invitation suite design', category: 'other', priority: 'high', subtasks: ['Custom invitation design', 'Premium printing', 'Gift box packaging'] },
      { title: 'Guest experience management', category: 'logistics', priority: 'high', subtasks: ['Welcome hampers', 'Concierge service setup', 'Luxury transport arrangement'] }
    ]
  },

  {
    type: 'intimate',
    label: 'Intimate Wedding',
    emoji: '🤍',
    description: 'Minimal, heartfelt celebrations with fewer guests. Focus on personal touches & meaningful moments.',
    vendorNotes: 'Small-scale caterers, Basic decorators, Photographer (optional premium). Guest list finalization is very important — keep it tight.',
    events: [
      {
        name: 'Mehendi (Optional)', order: 0,
        tasks: [
          { title: 'Book mehendi artist (1-2 artists)', category: 'other', priority: 'medium', subtasks: ['Confirm for bride + close family only'] },
          { title: 'Simple mehendi setup at home / venue', category: 'decor', priority: 'low', subtasks: ['Basic floral décor', 'Comfortable seating'] },
          { title: 'Light snacks & refreshments', category: 'fnb', priority: 'low', subtasks: ['Homestyle snacks', 'Tea / juice station'] }
        ]
      },
      {
        name: 'Wedding Ceremony', order: 1,
        tasks: [
          { title: 'Book intimate venue / home setup', category: 'logistics', priority: 'high', subtasks: ['Small venue / home garden booking', 'Capacity check for guest count', 'Permits if needed'] },
          { title: 'Simple & elegant ceremony décor', category: 'decor', priority: 'high', subtasks: ['Minimalist mandap / arch', 'Simple floral arrangement', 'Candle or fairy light setup'] },
          { title: 'Book pandit / officiant', category: 'other', priority: 'urgent', subtasks: ['Confirm ceremony format', 'Coordinate timeline'] },
          { title: 'Photography booking', category: 'photography', priority: 'high', subtasks: ['Book photographer (candid-focused)', 'Discuss shot list', 'Ceremony coverage plan'] },
          { title: 'Ceremony catering / family-style meal', category: 'fnb', priority: 'high', subtasks: ['Limited menu planning', 'Family-style service setup', 'Special dietary needs'] }
        ]
      },
      {
        name: 'Small Reception / Dinner', order: 2,
        tasks: [
          { title: 'Intimate dinner arrangement', category: 'fnb', priority: 'high', subtasks: ['Set menu or buffet for small group', 'Cake arrangement', 'Drinks selection'] },
          { title: 'Simple reception décor', category: 'decor', priority: 'medium', subtasks: ['Table centerpieces', 'Photo display area', 'Simple backdrop for photos'] },
          { title: 'Background music arrangement', category: 'entertainment', priority: 'low', subtasks: ['Curated playlist', 'Speaker setup'] }
        ]
      }
    ],
    globalTasks: [
      { title: 'Guest list finalization (critical)', category: 'logistics', priority: 'urgent', subtasks: ['Finalize head count', 'Send personal invitations', 'RSVP tracking'] },
      { title: 'Small venue booking', category: 'logistics', priority: 'high', subtasks: ['Home / small hall confirmation', 'Parking arrangement for few cars'] },
      { title: 'Minimal décor coordination', category: 'decor', priority: 'medium', subtasks: ['Simple stage / seating', 'Flower order', 'Candle/light arrangement'] }
    ]
  }
];

export default templates;
