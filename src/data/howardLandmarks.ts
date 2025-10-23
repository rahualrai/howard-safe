/**
 * Howard University Campus Landmarks and Points of Interest
 * Data structure for map pins with accurate coordinates
 */

export type LandmarkCategory = 'academic' | 'dining' | 'safety' | 'residential';

export interface Landmark {
  id: string;
  name: string;
  category: LandmarkCategory;
  latitude: number;
  longitude: number;
  description: string;
  details?: {
    hours?: string;
    phone?: string;
    address?: string;
  };
}

/**
 * The Yard at Howard University
 * The principal open space and historic quad at the heart of the main campus
 * Bounded by 6th St NW (west), 5th St NW (east), and Howard Place (south)
 * Center coordinates: approximately 38.9230, -77.0200
 */

export const THE_YARD_CENTER = {
  lat: 38.9230,
  lng: -77.0200
};

export const HOWARD_LANDMARKS: Landmark[] = [
  // ===== ACADEMIC BUILDINGS =====
  {
    id: 'founders-library',
    name: 'Founders Library',
    category: 'academic',
    latitude: 38.92236,
    longitude: -77.01965,
    description: 'Historic library and iconic landmark of Howard University. Home to extensive collections and the site of civil rights legal strategy during Brown v. Board of Education.',
    details: {
      hours: 'Mon-Thu: 7:30am-Midnight, Fri: 7:30am-8pm, Sat: 9am-8pm, Sun: 10am-Midnight',
      address: '500 Howard Place NW, Washington, DC 20059'
    }
  },
  {
    id: 'blackburn-center',
    name: 'Blackburn University Center',
    category: 'academic',
    latitude: 38.92399,
    longitude: -77.01905,
    description: 'Modern student center featuring dining, meeting spaces, and student services.',
    details: {
      address: '2397 6th Street NW, Washington, DC 20011'
    }
  },
  {
    id: 'chemistry-building',
    name: 'Chemistry Building',
    category: 'academic',
    latitude: 38.92152,
    longitude: -77.02023,
    description: 'Science and research facility for chemistry programs.',
    details: {
      address: 'Sixth St NW, Washington, DC 20059'
    }
  },
  {
    id: 'ee-just-hall',
    name: 'E.E. Just Hall (Biology Building)',
    category: 'academic',
    latitude: 38.92160,
    longitude: -77.01928,
    description: 'Named after the renowned biologist Ernest Everett Just. Houses biology and life sciences programs.',
    details: {
      address: 'Fifth St NW, Washington, DC 20059'
    }
  },
  {
    id: 'cramton-auditorium',
    name: 'Cramton Auditorium',
    category: 'academic',
    latitude: 38.92450,
    longitude: -77.02096,
    description: 'Major venue for lectures, concerts, and university events.',
    details: {
      address: '415 College St NW, Washington, DC 20059'
    }
  },
  {
    id: 'alain-locke-hall',
    name: 'Alain Locke Hall',
    category: 'academic',
    latitude: 38.92380,
    longitude: -77.01880,
    description: 'Academic building named after the renowned philosopher and educator.',
    details: {
      address: 'The Yard, Washington, DC 20059'
    }
  },
  {
    id: 'chadwick-boseman-college',
    name: 'Chadwick A. Boseman College of Fine Arts',
    category: 'academic',
    latitude: 38.92510,
    longitude: -77.01950,
    description: 'College dedicated to arts education and performance. Home to theatre, music, and visual arts programs.',
    details: {
      address: 'North side of The Yard, Washington, DC 20059'
    }
  },

  // ===== DINING LOCATIONS =====
  {
    id: 'blackburn-cafe',
    name: 'Blackburn Café',
    category: 'dining',
    latitude: 38.92399,
    longitude: -77.01905,
    description: 'Main dining facility offering all-you-care-to-eat meals. Features diverse cuisine including vegan/vegetarian options. Famous for Soul Food Thursday!',
    details: {
      hours: 'Mon-Fri: 7am-7pm, Sat-Sun: 10am-6pm',
      phone: '202-806-5400',
      address: 'Blackburn University Center, 2397 6th Street NW'
    }
  },
  {
    id: 'bethune-annex-cafe',
    name: 'Bethune Annex Café',
    category: 'dining',
    latitude: 38.91900,
    longitude: -77.02100,
    description: 'Secondary dining facility near Bethune residential area. All-you-care-to-eat dining accepting meal swipes.',
    details: {
      hours: 'Mon-Fri: 7am-6pm, Sat-Sun: 10am-4pm',
      phone: '202-806-5400',
      address: 'Bethune Annex, Washington, DC 20059'
    }
  },
  {
    id: 'the-punchout',
    name: 'The Punchout',
    category: 'dining',
    latitude: 38.92250,
    longitude: -77.01850,
    description: 'Quick-service grab-and-go dining option. Perfect for students on the go.',
    details: {
      hours: 'Mon-Fri: 8am-5pm, Sat-Sun: Closed',
      phone: '202-806-5400'
    }
  },

  // ===== SAFETY & SECURITY =====
  {
    id: 'campus-police-main',
    name: 'Campus Police - Main Station',
    category: 'safety',
    latitude: 38.92300,
    longitude: -77.02350,
    description: '24/7 campus police department providing security and emergency response. Can dispatch officer assistance immediately.',
    details: {
      phone: '410-617-5911 (Emergency: 911)',
      address: 'Public Safety Building, Howard University'
    }
  },
  {
    id: 'blue-light-phone-1',
    name: 'Blue Light Emergency Phone - The Yard',
    category: 'safety',
    latitude: 38.92300,
    longitude: -77.01950,
    description: 'Emergency call box on The Yard. Press red button to connect to Security Operations Center 24/7.',
    details: {
      phone: 'Press button to activate - Auto-connects to SOCC'
    }
  },
  {
    id: 'blue-light-phone-2',
    name: 'Blue Light Emergency Phone - Georgia Ave',
    category: 'safety',
    latitude: 38.92150,
    longitude: -77.02200,
    description: 'Emergency call box near Georgia Avenue corridor. Well-lit and easily accessible.',
    details: {
      phone: 'Press button to activate - Auto-connects to SOCC'
    }
  },
  {
    id: 'blue-light-phone-3',
    name: 'Blue Light Emergency Phone - Dorm Complex',
    category: 'safety',
    latitude: 38.91900,
    longitude: -77.02100,
    description: 'Emergency call box in residential area near dormitories.',
    details: {
      phone: 'Press button to activate - Auto-connects to SOCC'
    }
  },
  {
    id: 'security-escort-service',
    name: 'Campus Security Escort Service',
    category: 'safety',
    latitude: 38.92300,
    longitude: -77.02350,
    description: 'Safe escort service available 24/7 for students walking across campus. Contact Campus Police to request.',
    details: {
      phone: '410-617-5911',
      address: 'Available campus-wide'
    }
  },

  // ===== RESIDENTIAL BUILDINGS =====
  {
    id: 'drew-hall',
    name: 'Drew Hall',
    category: 'residential',
    latitude: 38.92450,
    longitude: -77.02200,
    description: 'Historic residence hall. One of the oldest dormitories on campus.',
    details: {
      address: 'College St NW, Washington, DC 20059'
    }
  },
  {
    id: 'carver-hall',
    name: 'Carver Hall',
    category: 'residential',
    latitude: 38.92350,
    longitude: -77.02100,
    description: 'Modern residence hall with residential life programs and community spaces.',
    details: {
      address: 'Georgia Ave NW, Washington, DC 20059'
    }
  },
  {
    id: 'tubman-quadrangle',
    name: 'Tubman Quadrangle',
    category: 'residential',
    latitude: 38.92100,
    longitude: -77.02000,
    description: 'Residential complex named after Harriet Tubman. Multiple residence halls with dining facilities.',
    details: {
      address: 'South campus area, Washington, DC 20059'
    }
  },
  {
    id: 'bethune-annex-dorm',
    name: 'Bethune Annex',
    category: 'residential',
    latitude: 38.91900,
    longitude: -77.02100,
    description: 'Residence hall with attached dining facility.',
    details: {
      address: 'South of main campus, Washington, DC 20059'
    }
  }
];

/**
 * Get landmarks filtered by category
 */
export function getLandmarksByCategory(category: LandmarkCategory): Landmark[] {
  return HOWARD_LANDMARKS.filter(landmark => landmark.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): LandmarkCategory[] {
  const categories = new Set<LandmarkCategory>();
  HOWARD_LANDMARKS.forEach(landmark => categories.add(landmark.category));
  return Array.from(categories);
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: LandmarkCategory): string {
  const names: Record<LandmarkCategory, string> = {
    academic: 'Academic Buildings',
    dining: 'Dining & Food',
    safety: 'Safety & Security',
    residential: 'Residential'
  };
  return names[category];
}

/**
 * Get category color for UI display
 */
export function getCategoryColor(category: LandmarkCategory): string {
  const colors: Record<LandmarkCategory, string> = {
    academic: '#3b82f6', // blue
    dining: '#f59e0b', // amber
    safety: '#ef4444', // red
    residential: '#8b5cf6' // purple
  };
  return colors[category];
}
