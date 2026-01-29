-- Sample Indian Medicines Data
-- This is a starter set - expand as needed

INSERT INTO medicines (name, generic_name, category, form, strengths, common_dosages) VALUES
-- Analgesics & Antipyretics
('Dolo 650', 'Paracetamol', 'Analgesic', 'Tablet', ARRAY['650mg'], ARRAY['1-0-1', 'SOS', '1-1-1']),
('Crocin', 'Paracetamol', 'Analgesic', 'Tablet', ARRAY['500mg', '650mg'], ARRAY['1-0-1', 'SOS']),
('Calpol', 'Paracetamol', 'Analgesic', 'Syrup', ARRAY['120mg/5ml', '250mg/5ml'], ARRAY['5ml TDS', '10ml TDS']),
('Combiflam', 'Ibuprofen + Paracetamol', 'Analgesic', 'Tablet', ARRAY['400mg+325mg'], ARRAY['1-0-1', 'SOS']),
('Brufen', 'Ibuprofen', 'NSAID', 'Tablet', ARRAY['200mg', '400mg', '600mg'], ARRAY['1-0-1', '1-1-1']),
('Voveran', 'Diclofenac', 'NSAID', 'Tablet', ARRAY['50mg', '100mg'], ARRAY['1-0-1', 'SOS']),

-- Antibiotics
('Augmentin', 'Amoxicillin + Clavulanate', 'Antibiotic', 'Tablet', ARRAY['375mg', '625mg', '1g'], ARRAY['1-0-1 x 5 days', '1-0-1 x 7 days']),
('Azithral', 'Azithromycin', 'Antibiotic', 'Tablet', ARRAY['250mg', '500mg'], ARRAY['1-0-0 x 3 days', '1-0-0 x 5 days']),
('Cifran', 'Ciprofloxacin', 'Antibiotic', 'Tablet', ARRAY['250mg', '500mg'], ARRAY['1-0-1 x 5 days', '1-0-1 x 7 days']),
('Monocef', 'Ceftriaxone', 'Antibiotic', 'Injection', ARRAY['250mg', '500mg', '1g'], ARRAY['1g IV OD', '1g IV BD']),
('Taxim', 'Cefixime', 'Antibiotic', 'Tablet', ARRAY['200mg', '400mg'], ARRAY['1-0-1 x 5 days']),
('Oflox', 'Ofloxacin', 'Antibiotic', 'Tablet', ARRAY['200mg', '400mg'], ARRAY['1-0-1 x 5 days']),

-- Antacids & GI
('Pan 40', 'Pantoprazole', 'PPI', 'Tablet', ARRAY['40mg'], ARRAY['1-0-0 (before breakfast)', '1-0-1']),
('Omez', 'Omeprazole', 'PPI', 'Capsule', ARRAY['20mg', '40mg'], ARRAY['1-0-0', '1-0-1']),
('Rantac', 'Ranitidine', 'H2 Blocker', 'Tablet', ARRAY['150mg', '300mg'], ARRAY['1-0-1', '0-0-1']),
('Digene', 'Antacid', 'Antacid', 'Syrup', ARRAY['170ml'], ARRAY['10ml TDS after food']),
('Gelusil', 'Antacid', 'Antacid', 'Tablet', ARRAY[''], ARRAY['1-1-1 after food']),
('Cremaffin', 'Liquid Paraffin + Milk of Magnesia', 'Laxative', 'Syrup', ARRAY['225ml'], ARRAY['15ml HS']),

-- Antihistamines
('Cetirizine', 'Cetirizine', 'Antihistamine', 'Tablet', ARRAY['10mg'], ARRAY['0-0-1', '1-0-0']),
('Allegra', 'Fexofenadine', 'Antihistamine', 'Tablet', ARRAY['120mg', '180mg'], ARRAY['1-0-0', '0-0-1']),
('Avil', 'Pheniramine', 'Antihistamine', 'Tablet', ARRAY['25mg', '50mg'], ARRAY['1-0-1', 'SOS']),
('Montair LC', 'Montelukast + Levocetirizine', 'Antihistamine', 'Tablet', ARRAY['10mg+5mg'], ARRAY['0-0-1']),

-- Antidiabetics
('Glycomet', 'Metformin', 'Antidiabetic', 'Tablet', ARRAY['250mg', '500mg', '850mg', '1000mg'], ARRAY['1-0-1', '1-1-1']),
('Amaryl', 'Glimepiride', 'Antidiabetic', 'Tablet', ARRAY['1mg', '2mg', '4mg'], ARRAY['1-0-0']),
('Januvia', 'Sitagliptin', 'Antidiabetic', 'Tablet', ARRAY['50mg', '100mg'], ARRAY['1-0-0']),
('Galvus Met', 'Vildagliptin + Metformin', 'Antidiabetic', 'Tablet', ARRAY['50/500', '50/850', '50/1000'], ARRAY['1-0-1']),

-- Antihypertensives
('Amlodac', 'Amlodipine', 'Antihypertensive', 'Tablet', ARRAY['2.5mg', '5mg', '10mg'], ARRAY['0-0-1', '1-0-0']),
('Telma', 'Telmisartan', 'ARB', 'Tablet', ARRAY['20mg', '40mg', '80mg'], ARRAY['1-0-0']),
('Concor', 'Bisoprolol', 'Beta Blocker', 'Tablet', ARRAY['2.5mg', '5mg', '10mg'], ARRAY['1-0-0']),
('Aten', 'Atenolol', 'Beta Blocker', 'Tablet', ARRAY['25mg', '50mg', '100mg'], ARRAY['1-0-0', '1-0-1']),
('Lasix', 'Furosemide', 'Diuretic', 'Tablet', ARRAY['20mg', '40mg'], ARRAY['1-0-0']),

-- Cough & Cold
('Alex', 'Dextromethorphan + Chlorpheniramine', 'Cough Suppressant', 'Syrup', ARRAY['100ml'], ARRAY['5ml TDS', '10ml TDS']),
('Benadryl', 'Diphenhydramine', 'Cough Suppressant', 'Syrup', ARRAY['100ml', '150ml'], ARRAY['5ml TDS']),
('Grilinctus', 'Terbutaline + Guaifenesin + Bromhexine', 'Expectorant', 'Syrup', ARRAY['100ml'], ARRAY['10ml TDS']),
('Ascoril', 'Salbutamol + Bromhexine + Guaifenesin', 'Expectorant', 'Syrup', ARRAY['100ml', '200ml'], ARRAY['10ml TDS']),
('Asthalin', 'Salbutamol', 'Bronchodilator', 'Inhaler', ARRAY['100mcg'], ARRAY['2 puffs SOS', '2 puffs TDS']),
('Foracort', 'Formoterol + Budesonide', 'ICS + LABA', 'Inhaler', ARRAY['6/100', '6/200', '6/400'], ARRAY['1 puff BD']),

-- Vitamins & Supplements
('Becosules', 'B-Complex + Vitamin C', 'Vitamin', 'Capsule', ARRAY[''], ARRAY['1-0-0', '0-1-0']),
('Zincovit', 'Multivitamin', 'Vitamin', 'Tablet', ARRAY[''], ARRAY['1-0-0']),
('Shelcal', 'Calcium + Vitamin D3', 'Supplement', 'Tablet', ARRAY['500mg'], ARRAY['1-0-1', '0-0-1']),
('Limcee', 'Vitamin C', 'Vitamin', 'Tablet', ARRAY['500mg'], ARRAY['1-0-0']),
('Folvite', 'Folic Acid', 'Vitamin', 'Tablet', ARRAY['5mg'], ARRAY['1-0-0']),
('Neurobion Forte', 'B1 + B6 + B12', 'Vitamin', 'Tablet', ARRAY[''], ARRAY['1-0-0', '1-0-1']),

-- Steroids
('Wysolone', 'Prednisolone', 'Corticosteroid', 'Tablet', ARRAY['5mg', '10mg', '20mg', '40mg'], ARRAY['As per taper']),
('Defcort', 'Deflazacort', 'Corticosteroid', 'Tablet', ARRAY['6mg', '12mg', '30mg'], ARRAY['As per taper']),

-- Others
('Emeset', 'Ondansetron', 'Antiemetic', 'Tablet', ARRAY['4mg', '8mg'], ARRAY['SOS', '1-1-1']),
('Perinorm', 'Metoclopramide', 'Antiemetic', 'Tablet', ARRAY['10mg'], ARRAY['1-1-1 before food']),
('Sporlac', 'Probiotics', 'Probiotic', 'Sachet', ARRAY[''], ARRAY['1-0-1', '1-1-1']),
('Econorm', 'Saccharomyces boulardii', 'Probiotic', 'Capsule', ARRAY['250mg'], ARRAY['1-0-1']),
('ORS', 'Oral Rehydration Salts', 'Electrolyte', 'Powder', ARRAY['21.8g'], ARRAY['1L water, sip frequently']);
