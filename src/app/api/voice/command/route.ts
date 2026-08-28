import { NextRequest, NextResponse } from 'next/server';

interface CommandMapMatch {
  keywords: string[];
  action: 'navigate' | 'nearest_restroom' | 'zoom_in' | 'zoom_out' | 'recenter' | 'toggle_dark' | 'toggle_layer' | 'locate';
  target_place_id?: string;
  target_place_name?: string;
  response: string;
}

const COMMAND_TRAINING_RULES: CommandMapMatch[] = [
  // Restroom Proximity Intent
  {
    keywords: ['restroom', 'toilet', 'washroom', 'bathroom', 'gents', 'ladies', 'latrine', 'where is restroom', 'find restroom', 'nearest restroom', 'closest toilet'],
    action: 'nearest_restroom',
    response: 'Tracking your location to find the nearest campus restroom, sir.',
  },

  // Building & Block Navigation Intent
  {
    keywords: ['sunflower', 'sf block', 'cse block', 'it block', 'ai block'],
    action: 'navigate',
    target_place_id: 'sf-block',
    target_place_name: 'Sunflower Block',
    response: 'Navigating to Sunflower Block, sir.',
  },
  {
    keywords: ['mech block', 'mechanical', 'aero', 'agri block'],
    action: 'navigate',
    target_place_id: 'mechanic-front',
    target_place_name: 'Mechanical Block Entrance',
    response: 'Navigating to Mechanical Block, sir.',
  },
  {
    keywords: ['as block', 'special labs', 'biomedical', 'civil', 'ece'],
    action: 'navigate',
    target_place_id: 'as-main-left',
    target_place_name: 'AS Block',
    response: 'Navigating to AS Block, sir.',
  },
  {
    keywords: ['ib block', 'information block'],
    action: 'navigate',
    target_place_id: 'ib-block-1',
    target_place_name: 'IB Block',
    response: 'Navigating to IB Block, sir.',
  },
  {
    keywords: ['library', 'central library', 'books'],
    action: 'navigate',
    target_place_id: 'library',
    target_place_name: 'Central Library',
    response: 'Navigating to Central Library, sir.',
  },
  {
    keywords: ['canteen', 'food court', 'cafeteria', 'coffee', 'snacks'],
    action: 'navigate',
    target_place_id: 'cafeteria',
    target_place_name: 'Campus Cafeteria',
    response: 'Navigating to Campus Cafeteria, sir.',
  },
  {
    keywords: ['auditorium', 'main auditorium', 'event hall'],
    action: 'navigate',
    target_place_id: 'main-auditorium',
    target_place_name: 'Main Auditorium',
    response: 'Navigating to Main Auditorium, sir.',
  },
  {
    keywords: ['boys hostel', 'mens hostel', 'kaveri hostel'],
    action: 'navigate',
    target_place_id: 'boys-hostels',
    target_place_name: 'Boys Hostels Complex',
    response: 'Navigating to Boys Hostel Quad, sir.',
  },
  {
    keywords: ['girls hostel', 'womens hostel', 'cauvery hostel'],
    action: 'navigate',
    target_place_id: 'girls-hostels',
    target_place_name: 'Girls Hostels Quad',
    response: 'Navigating to Girls Hostel Quad, sir.',
  },
  {
    keywords: ['medical', 'hospital', 'doctor', 'clinic', 'first aid'],
    action: 'navigate',
    target_place_id: 'medical-centre',
    target_place_name: 'Medical Centre',
    response: 'Navigating to Campus Medical Centre immediately, sir.',
  },
  {
    keywords: ['main gate', 'entrance', 'front gate'],
    action: 'navigate',
    target_place_id: 'main-gate',
    target_place_name: 'Main Entrance Gate',
    response: 'Navigating to Main Entrance Gate, sir.',
  },

  // Map Controls & Commands
  {
    keywords: ['zoom in', 'enlarge', 'closer'],
    action: 'zoom_in',
    response: 'Zooming in on the map, sir.',
  },
  {
    keywords: ['zoom out', 'overview', 'smaller'],
    action: 'zoom_out',
    response: 'Zooming out for campus overview, sir.',
  },
  {
    keywords: ['recenter', 'center map', 'home position', 'reset view'],
    action: 'recenter',
    response: 'Recentering map on BIT campus, sir.',
  },
  {
    keywords: ['where am i', 'my position', 'track me', 'locate me', 'gps location'],
    action: 'locate',
    response: 'Acquiring your live GPS position on mobile, sir.',
  },
  {
    keywords: ['dark mode', 'night mode', 'toggle dark', 'light mode'],
    action: 'toggle_dark',
    response: 'Toggling map theme mode, sir.',
  },
  {
    keywords: ['satellite', 'satellite view', 'svg view', 'map layer'],
    action: 'toggle_layer',
    response: 'Toggling map layer view, sir.',
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').toLowerCase().trim();

    if (!query) {
      return NextResponse.json({ error: 'Query parameter missing' }, { status: 400 });
    }

    // Match against trained JARVIS rules
    for (const rule of COMMAND_TRAINING_RULES) {
      if (rule.keywords.some((kw) => query.includes(kw))) {
        return NextResponse.json({
          query,
          response_text: rule.response,
          action: rule.action,
          target_place_id: rule.target_place_id || null,
          target_place_name: rule.target_place_name || null,
        });
      }
    }

    // Default intelligent conversational fallback
    let fallbackText = `JARVIS here, sir. I heard "${query}".`;
    if (query.includes('hello') || query.includes('hi') || query.includes('jarvis')) {
      fallbackText = 'Greetings, sir! I am JARVIS, your BIT campus navigation AI. How can I assist you?';
    } else if (query.includes('time')) {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      fallbackText = `The current time is ${timeStr}, sir.`;
    } else if (query.includes('date')) {
      const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      fallbackText = `Today is ${dateStr}, sir.`;
    }

    return NextResponse.json({
      query,
      response_text: fallbackText,
      action: null,
      target_place_id: null,
      target_place_name: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process voice command', details: error.message },
      { status: 500 }
    );
  }
}
