/**
 * Local Indian medication aliases + name cleanup utilities.
 *
 * Maps common Indian brand names, abbreviations, and generic names to
 * their RxNorm-compatible search terms. Also handles the "acetaminophen"
 * → "Paracetamol" name swap for Indian context.
 */

// ── Indian alias → RxNorm generic mapping ───────────────────

const ALIASES: Record<string, string> = {
    // Analgesics / Antipyretics
    "pcm": "acetaminophen",
    "dolo": "acetaminophen",
    "dolo 650": "acetaminophen",
    "crocin": "acetaminophen",
    "calpol": "acetaminophen",
    "paracetamol": "acetaminophen",
    "combiflam": "ibuprofen paracetamol",
    "brufen": "ibuprofen",
    "voveran": "diclofenac",
    "zerodol": "aceclofenac",
    "hifenac": "aceclofenac",

    // Antibiotics
    "augmentin": "amoxicillin clavulanate",
    "mox": "amoxicillin",
    "azee": "azithromycin",
    "azithral": "azithromycin",
    "zithromax": "azithromycin",
    "ciplox": "ciprofloxacin",
    "cifran": "ciprofloxacin",
    "taxim": "cefixime",
    "ceftas": "ceftriaxone",
    "flagyl": "metronidazole",
    "doxy": "doxycycline",
    "levoflox": "levofloxacin",
    "oflox": "ofloxacin",
    "norflox": "norfloxacin",
    "linezolid": "linezolid",

    // GI / Antacids
    "pan": "pantoprazole",
    "pan 40": "pantoprazole",
    "pan-d": "pantoprazole domperidone",
    "pantop": "pantoprazole",
    "omez": "omeprazole",
    "rantac": "ranitidine",
    "domstal": "domperidone",
    "emeset": "ondansetron",

    // Antihistamines
    "cetrizine": "cetirizine",
    "alerid": "cetirizine",
    "okacet": "cetirizine",
    "levocet": "levocetirizine",
    "xyzal": "levocetirizine",
    "montek lc": "montelukast levocetirizine",
    "montek": "montelukast",
    "allegra": "fexofenadine",
    "avil": "pheniramine",

    // Respiratory
    "asthalin": "salbutamol",
    "deriphyllin": "theophylline",
    "ambrolite": "ambroxol",
    "grilinctus": "dextromethorphan",
    "alex": "dextromethorphan",
    "mucinac": "acetylcysteine",

    // Diabetes
    "glycomet": "metformin",
    "glucophage": "metformin",
    "amaryl": "glimepiride",
    "januvia": "sitagliptin",
    "galvus": "vildagliptin",
    "voglitor": "voglibose",

    // Cardiovascular
    "stamlo": "amlodipine",
    "amlong": "amlodipine",
    "aten": "atenolol",
    "losar": "losartan",
    "telma": "telmisartan",
    "envas": "enalapril",
    "ecosprin": "aspirin",
    "clopivas": "clopidogrel",
    "atorva": "atorvastatin",
    "crestor": "rosuvastatin",
    "rozavel": "rosuvastatin",

    // Vitamins / Supplements
    "shelcal": "calcium vitamin d",
    "calcimax": "calcium vitamin d",
    "becosules": "b complex",
    "zincovit": "multivitamin zinc",
    "autrin": "iron folic acid",

    // Psychiatric / Neuro
    "alpax": "alprazolam",
    "nexito": "escitalopram",
    "tryptomer": "amitriptyline",

    // Dermatology
    "flucos": "fluconazole",
    "candid": "clotrimazole",
    "atarax": "hydroxyzine",

    // Steroids
    "wysolone": "prednisolone",
    "omnacortil": "prednisolone",
    "defcort": "deflazacort",
    "decadron": "dexamethasone",
};

// ── US → Indian name mapping ────────────────────────────────

const US_TO_INDIAN: Record<string, string> = {
    "acetaminophen": "Paracetamol",
    "epinephrine": "Adrenaline",
    "albuterol": "Salbutamol",
    "furosemide": "Frusemide",
    "acetylsalicylic acid": "Aspirin",
    "meperidine": "Pethidine",
};

/**
 * Resolve an Indian alias/brand name to its RxNorm-compatible generic name.
 * Returns the original query if no alias found.
 */
export function resolveAlias(query: string): string {
    const lower = query.toLowerCase().trim();
    return ALIASES[lower] || lower;
}

/**
 * Clean up a raw RxNorm drug name into a doctor-friendly display string.
 * - Converts US names to Indian equivalents (acetaminophen → Paracetamol)
 * - Strips excessive detail (Pack descriptions, etc.)
 * - Title-cases the result
 */
export function cleanDrugName(rawName: string): string {
    let name = rawName;

    // Replace US names with Indian equivalents
    for (const [us, indian] of Object.entries(US_TO_INDIAN)) {
        const regex = new RegExp(us, "gi");
        name = name.replace(regex, indian);
    }

    // Skip pack descriptions — they're too verbose
    if (name.includes("Pack") || name.includes("{")) return "";

    // Remove brand name suffixes like [Tylenol] or [Dolo]
    name = name.replace(/\[.*?\]/g, "").trim();

    // Clean up MG formatting
    name = name.replace(/(\d+)\s*MG/g, "$1mg");
    name = name.replace(/(\d+)\s*MG\/ML/g, "$1mg/mL");

    // Capitalize first letter of each word
    name = name
        .split(" ")
        .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
        .join(" ");

    // Fix "mg" -> keep lowercase
    name = name.replace(/Mg\b/g, "mg").replace(/Ml\b/g, "mL");

    return name.trim();
}

/**
 * Check if a query string matches any local alias.
 */
export function hasAlias(query: string): boolean {
    return query.toLowerCase().trim() in ALIASES;
}
