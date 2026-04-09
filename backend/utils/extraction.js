const keywordExtractor = require("keyword-extractor");

/**
 * 1. SALARY EXTRACTOR (Rule-based)
 */
const extractSalary = (text) => {
    // Look for: Salary: 12 LPA, CTC: ₹10,00,000 per annum, $180,000 - $220,000, 61087 - 104364
    const salaryRegex = /(?:CTC|Salary|Comp\w*|Global Comp|compensation range)\s*[:\-is]?\s*((?:₹|\$|Rs\.?)?\s*[\d,\.]+(?:\s*(?:LPA|K|per annum|per year|\-[\s\$\d,\.]+))?)/gi;
    const match = salaryRegex.exec(text);
    if (match && match[1]) {
        return match[1].trim();
    }
    return "Not explicitly stated";
};

/**
 * 2. EXPERIENCE EXTRACTOR (Rule-based)
 */
const extractExperience = (text) => {
    // Looks for: X years, X+ yrs, Fresher, Entry-Level
    const expRegex = /(\d+)\+?\s*(?:to|-| \- )?\s*(?:\d+)?\s*(?:years?|yrs?)/gi;
    
    // Check for fresher terms
    if (/fresher|entry-level/i.test(text)) {
        return 0; // Fresher
    }

    const match = expRegex.exec(text);
    if (match && match[1]) {
         return parseFloat(match[1]);
    }
    return null; 
};

/**
 * 3. POSITIONAL SKILL EXTRACTOR
 * Extracts any comma-separated lines directly under headers like "Skills:"
 */
const extractPositionalSkills = (text) => {
    const skills = new Set();
    const skillLinesRegex = /(?:Required Skills|Skills|Technologies)\s*[:\-]\s*(.*)/gi;
    let match;
    while ((match = skillLinesRegex.exec(text)) !== null) {
        const line = match[1];
        const items = line.split(',').map(s => s.trim()).filter(s => s.length > 0);
        items.forEach(i => skills.add(i));
    }
    return Array.from(skills);
};

/**
 * 4. PURE RULE-BASED EXTRACTION LOGIC (NO LEXICON / NO DICTIONARY)
 * Extracts potential proper noun technical terms using capitalization styles, acronyms,
 * and standard tech formats (e.g., Node.js, C++).
 */
const extractJDSkills = (jdText) => {
    // 1. First, pull the explicitly typed skills from the comma-separated "Skills:" header
    const positional = extractPositionalSkills(jdText);

    // 2. Second, pull implicit skills mathematically via RegExp (without a hardcoded list)
    // Matches Acronyms (AWS, JSON), Capitalized words (React, Docker), special strings (Node.js, C++)
    const regex = /\b([A-Z][a-zA-Z0-9]*(?:\.[a-z0-9]+)?|[a-z]+\.[a-z]+|C\+\+|C#)\b/g;
    const implicit = new Set();
    let match;
    while ((match = regex.exec(jdText)) !== null) {
        implicit.add(match[1]);
    }

    // Filter out standard English capitalized words that are definitely not languages/frameworks
    const englishStops = new Set(["The", "We", "Our", "As", "In", "It", "To", "With", "For", "Job", "Title", "Salary", "Location", "Requirements", "Experience", "Skills", "Team", "Company", "And", "Or", "But", "This", "That", "Position", "Overview", "Role", "Required"]);
    
    const filteredImplicit = Array.from(implicit).filter(skill => {
        return skill.length > 2 && !englishStops.has(skill);
    });

    return Array.from(new Set([...positional, ...filteredImplicit]));
};

/**
 * 5. MATCHING ENGINE
 */
const performMatching = (jdSkills, resumeText) => {
    const skillsAnalysis = [];
    let matchedCount = 0;

    // Normalizing text for easier scanning
    const safeResume = resumeText.toLowerCase().replace(/\s+/g, ' ');

    jdSkills.forEach(skill => {
        // Safe regex boundaries 
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase(); 
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'g');
        
        const presentInResume = regex.test(safeResume);
        if (presentInResume) {
            matchedCount++;
        }
        
        skillsAnalysis.push({
            skill: skill,
            presentInResume: presentInResume
        });
    });

    let matchingScore = 0;
    if (jdSkills.length > 0) {
         matchingScore = Math.round((matchedCount / jdSkills.length) * 100);
    }

    return {
        skillsAnalysis,
        matchingScore
    };
};

/**
 * CORE EXECUTION PIPELINE
 */
const extractFields = (jdText, resumeText) => {
    const salary = extractSalary(jdText);
    const yearOfExperience = extractExperience(jdText); 
    
    const jdSkills = extractJDSkills(jdText);
    
    const { skillsAnalysis, matchingScore } = performMatching(jdSkills, resumeText);
    
    // Simple Rule: Name is typically on the very first few lines, capitalized. We grab line 1.
    const firstStrings = resumeText.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const name = firstStrings.length > 0 && firstStrings[0].length < 40 ? firstStrings[0] : "Candidate Name Unknown";

    // Extracting ALL Candidate skills independently of the JD to show their whole profile
    const rawResumeSkills = extractJDSkills(resumeText);
    const candidateSalary = extractSalary(resumeText);
    const candidateExperience = extractExperience(resumeText);
    
    const isEligible = matchingScore > 55;

    return {
        name: name,
        salary: salary,
        yearOfExperience: yearOfExperience,
        candidateSalary: candidateSalary,
        candidateExperience: candidateExperience,
        isEligible: isEligible,
        resumeSkills: rawResumeSkills,
        matchingJobs: [
            {
                jobId: "JD-" + Math.floor(Math.random() * 9000).toString(),
                role: "Target Job Role", 
                aboutRole: "Summary block extracted from JD positional parameters if available.", 
                skillsAnalysis: skillsAnalysis,
                matchingScore: matchingScore
            }
        ]
    };
};

module.exports = {
    extractFields
};
