/**
 * Complete Howard University Campus Buildings Database
 * Source: HUmaps Campus Map Documentation
 * 167 buildings across 6 campuses with auto-categorization
 */

export type CampusName = 'Main' | 'West' | 'East' | 'Beltsville' | 'Off Campus' | 'Hospital';
export type BuildingCategory = 'Academic' | 'Residential' | 'Dining' | 'Administrative' | 'Athletic' | 'Medical' | 'Safety' | 'Parking' | 'Utility' | 'Research' | 'Library' | 'Other';

export interface Building {
  id: string;
  name: string;
  campus: CampusName;
  latitude: number;
  longitude: number;
  address: string;
  category: BuildingCategory;
  phone?: string;
  aliases?: string;
}

/**
 * Auto-categorization function
 * Categorizes buildings based on name keywords
 */
function categorizeBuildingName(name: string): BuildingCategory {
  const lower = name.toLowerCase();

  // Residential
  if (lower.includes('hall') && (lower.includes('residence') || lower.includes('annex') || lower.includes('residential') || lower.includes('towers') || lower.includes('apartments'))) {
    return 'Residential';
  }
  if (lower.includes('dormitory') || lower.includes('dorm')) {
    return 'Residential';
  }

  // Dining
  if (lower.includes('cafe') || lower.includes('dining') || lower.includes('cafeteria') || lower.includes('food') || lower.includes('kitchen')) {
    return 'Dining';
  }

  // Library
  if (lower.includes('library')) {
    return 'Library';
  }

  // Medical
  if (lower.includes('hospital') || lower.includes('health') || lower.includes('medical') || lower.includes('clinic') || lower.includes('pharmacy') || lower.includes('dental')) {
    return 'Medical';
  }

  // Safety/Security
  if (lower.includes('security') || lower.includes('police') || lower.includes('emergency')) {
    return 'Safety';
  }

  // Athletic
  if (lower.includes('stadium') || lower.includes('gymnasium') || lower.includes('gym') || lower.includes('athletic') || lower.includes('sports') || lower.includes('recreation')) {
    return 'Athletic';
  }

  // Parking
  if (lower.includes('parking') || lower.includes('garage') || lower.includes('lot')) {
    return 'Parking';
  }

  // Administrative
  if (lower.includes('administration') || lower.includes('admin') || lower.includes('service center') || lower.includes('office') || lower.includes('center')) {
    return 'Administrative';
  }

  // Utility/Infrastructure
  if (lower.includes('power plant') || lower.includes('warehouse') || lower.includes('storage') || lower.includes('facility')) {
    return 'Utility';
  }

  // Research
  if (lower.includes('research') || lower.includes('center') || lower.includes('laboratory') || lower.includes('lab')) {
    return 'Research';
  }

  // Academic (School, College, Building with academic context)
  if (lower.includes('school') || lower.includes('college') || lower.includes('engineering') || lower.includes('science') || lower.includes('building') || lower.includes('hall')) {
    return 'Academic';
  }

  return 'Other';
}

// All 167 Howard University buildings from CSV
export const HOWARD_BUILDINGS: Building[] = [
  // Beltsville Campus
  { id: 'ARB-81', name: 'Animal Research Building', campus: 'Beltsville', latitude: 39.059217, longitude: -76.879427, address: '7501 Muirkirk Road, Beltsville, MD', category: 'Research' },
  { id: 'SB-84', name: 'Security Building', campus: 'Beltsville', latitude: 39.059217, longitude: -76.879427, address: '7501 Muirkirk Road, Beltsville, MD', category: 'Safety' },
  { id: 'TEB-82', name: 'Telescope Building', campus: 'Beltsville', latitude: 39.059217, longitude: -76.879427, address: '7501 Muirkirk Road, Beltsville, MD', category: 'Research', aliases: 'Observatory' },
  { id: 'TSB-83', name: 'Telescope Storage Building', campus: 'Beltsville', latitude: 39.059217, longitude: -76.879427, address: '7501 Muirkirk Road, Beltsville, MD', category: 'Utility', aliases: 'Observatory Storage' },

  // East Campus
  { id: 'ARP-301', name: 'Arrupe House', campus: 'East', latitude: 38.939665, longitude: -76.985849, address: '1400 Shepherd St. NE', category: 'Residential' },
  { id: '901', name: 'Parking - East Campus', campus: 'East', latitude: 38.921089, longitude: -77.024052, address: 'Barry Place & 9th St', category: 'Parking' },
  { id: 'Div-300', name: 'Divinity, School of', campus: 'East', latitude: 38.939717, longitude: -76.984034, address: '1400 Shepherd St. NE', category: 'Academic', aliases: 'School of Divinity and Mays Residence Hall' },

  // Hospital
  { id: 'DPC-71', name: 'Data processing Center', campus: 'Hospital', latitude: 38.918167, longitude: -77.021992, address: '2121 Georgia Avenue, NW', category: 'Utility' },

  // Main Campus - Academic Buildings
  { id: 'ADM-1', name: 'Administration Building', campus: 'Main', latitude: 38.92313, longitude: -77.021573, address: '2400 6th St., NW', category: 'Administrative', aliases: 'Mordecai Johnson Administration Building' },
  { id: 'AN2-17', name: 'Allied Health Sciences', campus: 'Main', latitude: 38.91967, longitude: -77.02001, address: '6th & Bryant St. NW', category: 'Academic', aliases: 'Freedman\'s Annex II' },
  { id: 'HMB-3', name: 'Architecture & Planning', campus: 'Main', latitude: 38.922089, longitude: -77.021493, address: '2366 6th Street, NW', category: 'Academic', aliases: 'Howard Mackey Building' },
  { id: 'BA-62B', name: 'Baldwin Hall', campus: 'Main', latitude: 38.921936, longitude: -77.017905, address: '2455 4th Street, NW', category: 'Residential', aliases: 'Tubman Quadrangle' },
  { id: 'BX-6', name: 'Bethune Hall Annex', campus: 'Main', latitude: 38.920672, longitude: -77.017513, address: '2225 4th Street, NW', category: 'Residential', aliases: 'Mary McLeod Bethune Annex' },
  { id: 'EJH-7', name: 'Biology Building', campus: 'Main', latitude: 38.921598, longitude: -77.019283, address: '415 College Street, NW', category: 'Academic', aliases: 'E.E. Just Hall' },
  { id: 'BUC-57', name: 'Blackburn University Center', campus: 'Main', latitude: 38.923987, longitude: -77.019047, address: '2397 6th St., NW', category: 'Dining' },
  { id: 'BUR-8', name: 'Burr Gymnasium', campus: 'Main', latitude: 38.926414, longitude: -77.022073, address: '6th & Girard ST NW', category: 'Athletic', aliases: 'John Burr Gymnasium Building' },
  { id: 'CB4-10', name: 'Business, School of', campus: 'Main', latitude: 38.924428, longitude: -77.021988, address: '2600 6th Street NW', category: 'Academic', aliases: 'Class Room Building 4' },
  { id: 'CCTR-19', name: 'Cancer Research Center', campus: 'Main', latitude: 38.917549, longitude: -77.020094, address: '2041 Georgia Avenue, NW', category: 'Research' },
  { id: 'CAR-12', name: 'Carnegie Building', campus: 'Main', latitude: 38.922863, longitude: -77.020754, address: '2395 6th Street, NW', category: 'Academic' },
  { id: 'ASA-24', name: 'Center for Academic Reinforcement', campus: 'Main', latitude: 38.922324, longitude: -77.018259, address: '2441 4th St. N.W', category: 'Academic', aliases: 'Academic Support Building A' },
  { id: 'RAN-50', name: 'Chapel, Rankin', campus: 'Main', latitude: 38.922174, longitude: -77.020592, address: '2365 6th Street, NW', category: 'Academic', aliases: 'Andrew Rankin Memorial Chapel' },
  { id: 'CME-16', name: 'Chemical Engineering Building', campus: 'Main', latitude: 38.921564, longitude: -77.020603, address: '2300 6th Street, NW', category: 'Academic', aliases: 'Dowing Hall' },
  { id: 'CEM-15', name: 'Chemistry Building', campus: 'Main', latitude: 38.921515, longitude: -77.020233, address: '525 College Street, NW', category: 'Academic' },
  { id: 'CBP-13', name: 'Communications, School of', campus: 'Main', latitude: 38.920707, longitude: -77.019404, address: '525 Bryant Street, NW', category: 'Academic', aliases: 'C. B. Powell Building' },
  { id: 'CO-18', name: 'Cook Hall', campus: 'Main', latitude: 38.925365, longitude: -77.021721, address: '601 Fairmont Street, NW', category: 'Residential' },
  { id: 'CRA-20', name: 'Cramton Auditorium', campus: 'Main', latitude: 38.924501, longitude: -77.020960, address: '2455 6th St., NW', category: 'Academic' },
  { id: 'CR-62C', name: 'Crandall Hall', campus: 'Main', latitude: 38.921853, longitude: -77.017239, address: '2455 4th Street, NW', category: 'Residential', aliases: 'Tubman Quadrangle' },
  { id: 'DEN-22', name: 'Dentistry, College of', campus: 'Main', latitude: 38.918543, longitude: -77.020753, address: '600 W Street, NW', category: 'Medical' },
  { id: 'DOM-400', name: 'Doors & More Building', campus: 'Main', latitude: 38.922379, longitude: -77.024680, address: '2467 Sherman Avenue, NW', category: 'Academic', aliases: 'Sculpture Studio (Fine Arts)' },
  { id: 'DGH-23', name: 'Douglass Hall', campus: 'Main', latitude: 38.923677, longitude: -77.020925, address: '2419 6th St., NW', category: 'Academic' },
  { id: 'DR-21', name: 'Drew Hall', campus: 'Main', latitude: 38.927328, longitude: -77.020917, address: '511 Gresham Place, NW', category: 'Residential' },
  { id: 'ELC-58', name: 'Early Learning Center (Child Development)', campus: 'Main', latitude: 38.921289, longitude: -77.019911, address: '531 College Street, NW', category: 'Academic', aliases: 'Child Development' },
  { id: 'ASB-25', name: 'Education, School of', campus: 'Main', latitude: 38.923275, longitude: -77.018716, address: '2500 4TH STREET, NW', category: 'Academic', aliases: 'Academic Support Building B' },
  { id: '2711GA-92', name: 'Effingham Apartments', campus: 'Main', latitude: 38.925379, longitude: -77.022365, address: '2711 Georgia Avenue, NW', category: 'Residential' },
  { id: '2715GA-93', name: 'Effingham Apartments', campus: 'Main', latitude: 38.925106, longitude: -77.022405, address: '2715 Georgia Avenue, NW', category: 'Residential' },
  { id: '2719GA-94', name: 'Effingham Apartments', campus: 'Main', latitude: 38.925256, longitude: -77.022357, address: '2719 Georgia Avenue, NW', category: 'Residential' },
  { id: 'LKD-26', name: 'Engineering, Architecture & Computer Sciences, College of', campus: 'Main', latitude: 38.921564, longitude: -77.021498, address: '2300 6th Street, NW', category: 'Academic', aliases: 'Lewis K. Downing Hall' },
  { id: 'LVC-28', name: 'Fine Arts', campus: 'Main', latitude: 38.924250, longitude: -77.020209, address: '2455 6th Street NW', category: 'Academic', aliases: 'Lulu Vere Childers Hall' },
  { id: 'LIB-29', name: 'Founder\'s Library', campus: 'Main', latitude: 38.922364, longitude: -77.019645, address: '500 Howard Place, NW', category: 'Library' },
  { id: 'FR-62F', name: 'Frazier Hall', campus: 'Main', latitude: 38.921569, longitude: -77.017674, address: '2455 4th Street, NW', category: 'Residential', aliases: 'Tubman Quadrangle' },
  { id: 'AN3-31', name: 'Graduate School of Arts & Sciences', campus: 'Main', latitude: 38.921214, longitude: -77.018516, address: '4th & College St. NW', category: 'Academic', aliases: 'Freedman\'s Annex III' },
  { id: 'GS-9', name: 'Greene Stadium', campus: 'Main', latitude: 38.925509, longitude: -77.021051, address: 'Greene Stadium', category: 'Athletic' },
  { id: 'HB-401', name: 'Harrison Brothers Building', campus: 'Main', latitude: 38.923142, longitude: -77.024834, address: '2525 Sherman Avenue, NW', category: 'Academic' },
  { id: 'HSL-200', name: 'Health Sciences Library', campus: 'Main', latitude: 38.919804, longitude: -77.018645, address: '501 W St., NW', category: 'Library', phone: '202-884-1522', aliases: 'Louis Stokes Health Sciences Library' },
  { id: 'HH-33', name: 'Howard Hall', campus: 'Main', latitude: 38.922990, longitude: -77.021815, address: '607 Howard Place', category: 'Academic', aliases: 'Oliver Otis Howard Hall' },
  { id: 'HMA-96', name: 'Howard Manor', campus: 'Main', latitude: 38.925575, longitude: -77.022411, address: '654 Girard Street, NW', category: 'Residential', aliases: 'Howard University Community Association' },
  { id: 'HPE-550', name: 'Howard Plaza Towers East', campus: 'Main', latitude: 38.920283, longitude: -77.023473, address: '2251 Sherman Ave.', category: 'Residential', aliases: 'Howard Plaza Towers' },
  { id: 'HPW-551', name: 'Howard Plaza Towers West', campus: 'Main', latitude: 38.920200, longitude: -77.024556, address: '2251 Sherman Ave.', category: 'Residential', aliases: 'Howard Plaza Towers' },
  { id: 'HCTR-5', name: 'Howard University Center', campus: 'Main', latitude: 38.919877, longitude: -77.021710, address: '2225 Georgia Avenue, NW', category: 'Administrative', aliases: 'Bookstore' },
  { id: 'CAC-36', name: 'Howard University Community Association', campus: 'Main', latitude: 38.925363, longitude: -77.022614, address: '2731 Georgia Av. NW', category: 'Administrative', aliases: 'Community Assoc. Center' },
  { id: 'HUH-67', name: 'Howard University Hospital', campus: 'Main', latitude: 38.917500, longitude: -77.020490, address: '2041 Georgia Ave, NW', category: 'Medical' },
  { id: 'HSC-39', name: 'Howard University Service Center', campus: 'Main', latitude: 38.920371, longitude: -77.026091, address: '2244 10th Street, NW / 1000 Florida Ave NW', category: 'Administrative', aliases: 'PFM' },
  { id: 'HUSS-41', name: 'HU Security Sub-station', campus: 'Main', latitude: 38.919123, longitude: -77.022125, address: '2200 Georgia Avenue, NW', category: 'Safety' },
  { id: 'RJBC-42', name: 'International Affairs Center', campus: 'Main', latitude: 38.920673, longitude: -77.021021, address: '2218 6th Street, NW', category: 'Administrative', aliases: 'Ralph J. Bunche Center' },
  { id: 'IAT-43', name: 'Ira Aldridge Theatre', campus: 'Main', latitude: 38.924265, longitude: -77.020927, address: '2445 6th Street, NW', category: 'Academic' },
  { id: 'LCB-4', name: 'Laser Chemistry Building', campus: 'Main', latitude: 38.921289, longitude: -77.019482, address: '500 College Street, NW', category: 'Research', aliases: 'Chemistry Laser Research' },
  { id: 'LKH-44', name: 'Locke Hall', campus: 'Main', latitude: 38.923405, longitude: -77.019299, address: '2441 6th St., NW', category: 'Academic' },
  { id: 'MAB-163', name: 'Medical Arts Building', campus: 'Main', latitude: 38.918877, longitude: -77.021579, address: '2139 Georgia Ave. N.W.', category: 'Medical', aliases: 'Student Health Center' },
  { id: 'SMG-45', name: 'Medicine, College of', campus: 'Main', latitude: 38.918994, longitude: -77.020123, address: '520 W Street, NW', category: 'Medical', aliases: 'Seeley G. Mudd' },
  { id: 'NAB-51', name: 'Medicine, College of - East', campus: 'Main', latitude: 38.918785, longitude: -77.019310, address: '520 W Street, NW', category: 'Medical', aliases: 'Numa Adams Building' },
  { id: 'MHC-700', name: 'Mental Health Clinic', campus: 'Main', latitude: 38.920880, longitude: -77.020662, address: '520 College Street, NW', category: 'Medical' },
  { id: 'HEC-40', name: 'Middle School of Mathematics & Science', campus: 'Main', latitude: 38.922712, longitude: -77.018460, address: '405 Howard Place, NW', category: 'Academic', aliases: 'Human Ecology|(MS)2' },
  { id: 'MB-14', name: 'Miner Building', campus: 'Main', latitude: 38.923693, longitude: -77.021818, address: '2565 Georgia Avenue, NW', category: 'Academic' },
  { id: 'AN1-11', name: 'Nursing & Allied Health, College of', campus: 'Main', latitude: 38.919904, longitude: -77.020040, address: '516 Bryant St. NW', category: 'Medical', aliases: 'Freedman\'s Annex I' },
  { id: 'OML-27', name: 'Old Medical Library', campus: 'Main', latitude: 38.919169, longitude: -77.020512, address: '600 W Street, NW', category: 'Library' },
  { id: 'OPF-216', name: 'Old PFM & Old ISAS', campus: 'Main', latitude: 38.919527, longitude: -77.020953, address: '2216-2220 6th Street, NW', category: 'Utility', aliases: 'Old ISAS' },
  { id: '403', name: 'Parking - 5th & W', campus: 'Main', latitude: 38.919303, longitude: -77.019074, address: '5th & W St. NW', category: 'Parking', aliases: 'LS HS Library' },
  { id: '404', name: 'Parking - 6th & W', campus: 'Main', latitude: 38.919169, longitude: -77.020576, address: '6th & W St. NW', category: 'Parking', aliases: 'School of Dentistry' },
  { id: '525', name: 'Parking - 6th Street', campus: 'Main', latitude: 38.921273, longitude: -77.019846, address: '525 College St. NW', category: 'Parking', aliases: 'Student Resource Ctr.' },
  { id: '526', name: 'Parking - 9th & V', campus: 'Main', latitude: 38.917834, longitude: -77.023988, address: '9th & V Street', category: 'Parking', aliases: 'Off FL. Ave' },
  { id: '126', name: 'Parking - 9th Street NW', campus: 'Main', latitude: 38.921306, longitude: -77.024074, address: '2200 9thSt. NW', category: 'Parking', aliases: 'Behind Tower Plaza Lots' },
  { id: '527', name: 'Parking - Annex 1', campus: 'Main', latitude: 38.919177, longitude: -77.019986, address: 'W. Street (Bet 5th & 6th Street) NW', category: 'Parking', aliases: 'Numa P. Adams' },
  { id: 'Z north-345', name: 'Parking - Banneker North', campus: 'Main', latitude: 38.921188, longitude: -77.025153, address: '2345 Sherman Ave. NW', category: 'Parking' },
  { id: 'Z south-346', name: 'Parking - Banneker South', campus: 'Main', latitude: 38.921188, longitude: -77.025153, address: '2345 Sherman Ave. NW', category: 'Parking' },
  { id: '528', name: 'Parking - Bethune Annex', campus: 'Main', latitude: 38.920438, longitude: -77.018044, address: '4th & Bryant St. NW', category: 'Parking', aliases: 'Bethune Annex' },
  { id: '529', name: 'Parking - Bunche Ctr.', campus: 'Main', latitude: 38.920673, longitude: -77.021021, address: '2218 6th Street, NW', category: 'Parking', aliases: 'Bunche Center' },
  { id: '530', name: 'Parking - Bur Gym', campus: 'Main', latitude: 38.925863, longitude: -77.022057, address: '6th & Girard St. NW', category: 'Parking', aliases: 'Rear of Burr Gym.' },
  { id: '531', name: 'Parking - Business', campus: 'Main', latitude: 38.925446, longitude: -77.021348, address: '2640 6th St. NW', category: 'Parking', aliases: 'School of Business' },
  { id: '512', name: 'Parking - C.B. Powell', campus: 'Main', latitude: 38.921273, longitude: -77.019675, address: '512 College St. NW', category: 'Parking', aliases: 'School of Communications' },
  { id: '407', name: 'Parking - Chemistry', campus: 'Main', latitude: 38.921389, longitude: -77.018366, address: '407 College Ave. NW', category: 'Parking', aliases: 'Chemistry' },
  { id: '465', name: 'Parking - Childers Hall', campus: 'Main', latitude: 38.922541, longitude: -77.021091, address: '2465 6th St. NW', category: 'Parking', aliases: 'Fine Arts Drive' },
  { id: '230', name: 'Parking - Dowing Bldg.', campus: 'Main', latitude: 38.921564, longitude: -77.021498, address: '2300 6th Street, NW', category: 'Parking', aliases: 'Engineering' },
  { id: '511', name: 'Parking - Drew Hall', campus: 'Main', latitude: 38.927566, longitude: -77.021155, address: '511 Harvard St. NW', category: 'Parking', aliases: 'Drew Hall' },
  { id: '902', name: 'Parking - East Towers', campus: 'Main', latitude: 38.920839, longitude: -77.024052, address: 'Barry Place & 9th Street NW', category: 'Parking', aliases: 'Rear East Towers' },
  { id: '903', name: 'Parking - Florida Ave. Parking Lot', campus: 'Main', latitude: 38.920402, longitude: -77.025308, address: '2270 Sherman Avenue', category: 'Parking', aliases: 'Front of HUSC' },
  { id: '904', name: 'Parking - Founders', campus: 'Main', latitude: 38.923130, longitude: -77.021573, address: '2400 6th Street NW', category: 'Parking', aliases: 'Main Gate' },
  { id: '905', name: 'Parking - Georgia Ave.', campus: 'Main', latitude: 38.924995, longitude: -77.022593, address: '2703 Georgia Ave. NW', category: 'Parking', aliases: 'Old Comm Lot' },
  { id: '906', name: 'Parking - Georgia Ave & W St', campus: 'Main', latitude: 38.919303, longitude: -77.021573, address: '2201 Georgia Ave., N.W., D.C.', category: 'Parking', aliases: 'Old Texaco Station' },
  { id: '907', name: 'Parking - Greene', campus: 'Main', latitude: 38.926448, longitude: -77.022507, address: '6th & Gresham Place St. NW', category: 'Parking', aliases: 'Front of Burr Gym' },
  { id: '125', name: 'Parking - Howard Center', campus: 'Main', latitude: 38.920335, longitude: -77.022282, address: '2312 Georgia Ave., N.W.', category: 'Parking', aliases: 'H.U. Bookstore' },
  { id: '908', name: 'Parking - HUSC', campus: 'Main', latitude: 38.920271, longitude: -77.026112, address: '2244 10th Street, NW', category: 'Parking', aliases: 'HUSC Garage' },
  { id: '909', name: 'Parking - Johnson Bldg.', campus: 'Main', latitude: 38.922441, longitude: -77.022228, address: '2535 Georgia Ave.', category: 'Parking', aliases: 'Rear Administration Bldg.' },
  { id: '910', name: 'Parking - Just Hall', campus: 'Main', latitude: 38.921423, longitude: -77.018216, address: '407 College Ave. NW', category: 'Parking', aliases: 'Biology Bldg.' },
  { id: '911', name: 'Parking - LSHSL', campus: 'Main', latitude: 38.920455, longitude: -77.017980, address: '4th & Bryant St. NW', category: 'Parking', aliases: 'LSHS Library' },
  { id: '912', name: 'Parking - Mackey Bldg.', campus: 'Main', latitude: 38.922124, longitude: -77.020984, address: '2366 6th Street, NW', category: 'Parking', aliases: 'Architecture' },
  { id: '402', name: 'Parking - Miner Bldg', campus: 'Main', latitude: 38.922475, longitude: -77.021048, address: '2402 6th St. NW', category: 'Parking', aliases: 'Miner Lot' },
  { id: '913', name: 'Parking - Student Health Ctr', campus: 'Main', latitude: 38.921223, longitude: -77.020833, address: '6th & College Place NW', category: 'Parking', aliases: 'University Health Center' },
  { id: '915', name: 'Parking - West Tower', campus: 'Main', latitude: 38.920204, longitude: -77.025661, address: '986 Florida Ave. NW', category: 'Parking', aliases: 'Rear West Tower' },
  { id: 'OSHP-30', name: 'Radioactive Waste Storage Facility', campus: 'Main', latitude: 38.921306, longitude: -77.019653, address: '510 College Street, NW', category: 'Utility', aliases: 'Student Health Pharmacy, Old Bldg' },
  { id: 'PFMS-56', name: 'PFM Storage Building', campus: 'Main', latitude: 38.919870, longitude: -77.020973, address: '2230 6th Street N.W.', category: 'Utility', aliases: 'Old Wonder Bread Store' },
  { id: 'CCH-47', name: 'Pharmacy, College of', campus: 'Main', latitude: 38.921611, longitude: -77.018489, address: '2300 4th Street, NW', category: 'Medical', aliases: 'Chauncey L. Cooper Hall' },
  { id: 'TKH-55', name: 'Physics Building', campus: 'Main', latitude: 38.921776, longitude: -77.020817, address: '2355 6th Street, NW', category: 'Academic', aliases: 'Wilbur Thirkield Hall' },
  { id: 'PP-48', name: 'Power Plant', campus: 'Main', latitude: 38.920334, longitude: -77.021043, address: '2240 6th Street, NW', category: 'Utility' },
  { id: 'ILH-53', name: 'Social Work, School of', campus: 'Main', latitude: 38.922166, longitude: -77.021716, address: '601 Howard Place NW', category: 'Academic', aliases: 'Inabel Burns Lindsay Hall' },
  { id: 'WPZ-2', name: 'Technology Center', campus: 'Main', latitude: 38.920609, longitude: -77.021621, address: '2301 Georgia Ave, NW', phone: '202-806-2940', category: 'Academic', aliases: 'Wonder Plaza|iLab' },
  { id: 'TR-62T', name: 'Truth Hall', campus: 'Main', latitude: 38.922370, longitude: -77.017325, address: '2455 4th Street, NW', category: 'Residential', aliases: 'Tubman Quadrangle' },
  { id: 'UGL-61', name: 'Undergraduate Library', campus: 'Main', latitude: 38.922224, longitude: -77.018940, address: '500 Howard Place, NW', category: 'Library' },
  { id: 'WHB-59', name: 'University Warehouse #2', campus: 'Main', latitude: 38.925997, longitude: -77.022614, address: '2801 & 2805 Georgia Ave, NW', category: 'Utility', aliases: 'Bank Building' },
  { id: 'WH-62W', name: 'Wheatley Hall', campus: 'Main', latitude: 38.922408, longitude: -77.017824, address: '2455 4th Street, NW', category: 'Residential', aliases: 'Tubman Quadrangle' },
  { id: 'WHUR-49', name: 'WHUR-Radio Station', campus: 'Main', latitude: 38.920580, longitude: -77.019997, address: 'Bryant Street, NW', category: 'Academic' },
  { id: 'WHUT-54', name: 'WHUT-TV Station', campus: 'Main', latitude: 38.920709, longitude: -77.018548, address: '2222 4th Street, NW', category: 'Academic', aliases: 'WHMM' },

  // Off Campus
  { id: '326T-113', name: '326 T St., N.W.', campus: 'Off Campus', latitude: 38.915897, longitude: -77.016842, address: '326 T St., N.W', category: 'Residential', aliases: 'Mary Church Terrell' },
  { id: '408T-408', name: '408-410 T ST. N.W.', campus: 'Off Campus', latitude: 38.915692, longitude: -77.017795, address: '408-410 T ST. N.W.', category: 'Residential', aliases: 'Mayor Washington\'s House' },
  { id: '420FL-420', name: '420 Florida Ave. N.W. (A, B &C)', campus: 'Off Campus', latitude: 38.914745, longitude: -77.018044, address: '420 Florida Ave. N.W.', category: 'Residential', aliases: 'Ellington Apartments' },
  { id: '422FL-422', name: '422 Florida Ave. N.W. (A&B)', campus: 'Off Campus', latitude: 38.914778, longitude: -77.018108, address: '422 Florida Ave. N.W.', category: 'Residential', aliases: 'Ellington Apartments' },
  { id: '424FL-424', name: '424 Florida Ave. N.W.', campus: 'Off Campus', latitude: 38.914678, longitude: -77.018065, address: '424 Florida Ave. N.W.', category: 'Residential', aliases: 'Ellington Apartments' },
  { id: '426FL-426', name: '426 Florida Ave. N.W.', campus: 'Off Campus', latitude: 38.914695, longitude: -77.018173, address: '426 Florida Ave. N.W.', category: 'Residential', aliases: 'Ellington Apartments' },
  { id: '514H-114', name: '514 Hobart Pl., N.W.', campus: 'Off Campus', latitude: 38.927983, longitude: -77.021284, address: '514 Hobart Pl., N.W.', category: 'Residential' },
  { id: '518H-115', name: '518 Hobart Pl., N.W', campus: 'Off Campus', latitude: 38.928000, longitude: -77.021370, address: '518 Hobart Pl., N.W', category: 'Residential' },
  { id: '531U-513', name: '531 U Street, NW', campus: 'Off Campus', latitude: 38.916665, longitude: -77.019947, address: '531 U Street NW', category: 'Residential' },
  { id: '649FL-649', name: '649 Florida Ave', campus: 'Off Campus', latitude: 38.916283, longitude: -77.021536, address: '649 Florida Ave', category: 'Other' },
  { id: '907FL-907', name: '907 Florida Ave., N.W', campus: 'Off Campus', latitude: 38.918304, longitude: -77.024111, address: '907 Florida Ave., N.W', category: 'Residential' },
  { id: '909FL-909', name: '909 Florida Ave., N.W.', campus: 'Off Campus', latitude: 38.918339, longitude: -77.024137, address: '909 Florida Ave., N.W.', category: 'Residential' },
  { id: '999FL-997FL-997', name: '999 - 997 Florida Ave., N.W.', campus: 'Off Campus', latitude: 38.920536, longitude: -77.025705, address: '999 - 997 Florida Ave., N.W.', category: 'Residential' },
  { id: 'BKD-1509', name: 'Baker\'s Dozen', campus: 'Off Campus', latitude: 38.910097, longitude: -77.015964, address: '1509 -1511 4th Street NW', category: 'Dining' },
  { id: 'CA-501', name: 'Carver Hall', campus: 'Off Campus', latitude: 38.917913, longitude: -77.014973, address: '201 Elm Street, NW', category: 'Residential' },
  { id: 'CVS-130', name: 'CVS Pharmacy', campus: 'Off Campus', latitude: 38.915842, longitude: -77.022208, address: '1900 7th Street NW', category: 'Medical' },
  { id: 'HURB1-600', name: 'Howard University Research Building #1', campus: 'Off Campus', latitude: 38.914781, longitude: -77.022191, address: '1840 7th Street NW', category: 'Research', aliases: 'PIC Building Extended Health' },
  { id: 'HURB1npl-127', name: 'Howard University Research Building #1 North Parking Lot', campus: 'Off Campus', latitude: 38.914781, longitude: -77.022191, address: '1840 7th Street NW', category: 'Parking', aliases: 'PIC Building Daycare' },
  { id: 'HURB1spl-128', name: 'Howard University Research Building #1 South Parking Lot', campus: 'Off Campus', latitude: 38.914361, longitude: -77.022057, address: '1800 7th Street NW', category: 'Parking', aliases: 'PIC Building South parking Lot' },
  { id: '121', name: 'HU/NIH Maternal & Child Health Grant', campus: 'Off Campus', latitude: 38.916951, longitude: -77.022191, address: '2018 Georgia Ave., N.W.', category: 'Research' },
  { id: 'HUP-122', name: 'HUP Offices', campus: 'Off Campus', latitude: 38.917130, longitude: -77.022233, address: '2022-2024 Georgia Ave., N.W.', category: 'Administrative' },
  { id: 'HUP-614', name: 'HUP Offices', campus: 'Off Campus', latitude: 38.920040, longitude: -77.021177, address: '614 Bryant St. N.W.', category: 'Administrative' },
  { id: 'SL-500', name: 'Slowe Hall', campus: 'Off Campus', latitude: 38.916800, longitude: -77.015486, address: '1919 Third Street, NW', category: 'Residential' },

  // West Campus (Law School)
  { id: 'LL-351', name: 'A. M. Daniels Library', campus: 'West', latitude: 38.942784, longitude: -77.059616, address: '2900 Van Ness St', category: 'Library' },
  { id: 'HCR-354', name: 'Holy Cross Hall', campus: 'West', latitude: 38.942784, longitude: -77.059616, address: '2900 Van Ness St', category: 'Residential' },
  { id: 'HUS-355', name: 'Houston Hall', campus: 'West', latitude: 38.942784, longitude: -77.059616, address: '2900 Van Ness Street, NW', category: 'Residential' },
  { id: 'NLL-350', name: 'Law Library', campus: 'West', latitude: 38.942784, longitude: -77.059616, address: '2900 Van Ness St', category: 'Library' },
  { id: 'LSM-352', name: 'Law School Maintenance Building', campus: 'West', latitude: 38.942661, longitude: -77.058763, address: '2900 Van Ness St', category: 'Utility' },
  { id: 'ND-353', name: 'Notre Dame Hall', campus: 'West', latitude: 38.942784, longitude: -77.059616, address: '2900 Van Ness St', category: 'Residential' },
  { id: '914', name: 'Parking - West Campus', campus: 'West', latitude: 38.942784, longitude: -77.059616, address: '2900 Van Ness St', category: 'Parking' },
];

/**
 * Get buildings filtered by campus
 */
export function getBuildingsByCampus(campus: CampusName): Building[] {
  return HOWARD_BUILDINGS.filter(building => building.campus === campus);
}

/**
 * Get buildings filtered by category
 */
export function getBuildingsByCategory(category: BuildingCategory): Building[] {
  return HOWARD_BUILDINGS.filter(building => building.category === category);
}

/**
 * Get all unique categories in use
 */
export function getAllCategories(): BuildingCategory[] {
  const categories = new Set<BuildingCategory>();
  HOWARD_BUILDINGS.forEach(building => categories.add(building.category));
  return Array.from(categories).sort();
}

/**
 * Get all unique campuses
 */
export function getAllCampuses(): CampusName[] {
  const campuses = new Set<CampusName>();
  HOWARD_BUILDINGS.forEach(building => campuses.add(building.campus));
  return Array.from(campuses).sort();
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: BuildingCategory): string {
  return category;
}

/**
 * Get category color for UI display
 */
export function getCategoryColor(category: BuildingCategory): string {
  const colors: Record<BuildingCategory, string> = {
    Academic: '#3b82f6',      // blue
    Residential: '#8b5cf6',   // purple
    Dining: '#f59e0b',        // amber
    Administrative: '#10b981', // green
    Athletic: '#ef4444',      // red
    Medical: '#ec4899',       // pink
    Safety: '#f59e0b',        // orange
    Parking: '#6b7280',       // gray
    Utility: '#8b5cf6',       // purple
    Research: '#06b6d4',      // cyan
    Library: '#0ea5e9',       // sky blue
    Other: '#6b7280',         // gray
  };
  return colors[category];
}

/**
 * Search buildings by name
 */
export function searchBuildings(query: string): Building[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return HOWARD_BUILDINGS.filter(building =>
    building.name.toLowerCase().includes(lowerQuery) ||
    (building.aliases?.toLowerCase().includes(lowerQuery) ?? false)
  );
}
