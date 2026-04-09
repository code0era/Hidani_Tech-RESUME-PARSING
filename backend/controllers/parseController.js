// Polyfills for DOM API missing in Node 20+ that pdfjs-dist expects at runtime
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

const pdfParse = require('pdf-parse');
const { extractFields } = require('../utils/extraction');
const CandidateResult = require('../models/CandidateResult');

const processJDAndResume = async (req, res) => {
    try {
        const { jdText } = req.body;
        const resumeFile = req.file;

        if (!jdText || !resumeFile) {
            return res.status(400).json({ error: "Missing required fields: jdText or resume file." });
        }

        // 1. Extract raw text from the Candidate's PDF
        const pdfData = await pdfParse(resumeFile.buffer);
        const resumeText = pdfData.text;

        // 2. Pass to our NLP Extractor Rules (No LLMs)
        const result = extractFields(jdText, resumeText);

        // 3. Save to MongoDB (Bonus Requirement)
        const matchRecord = new CandidateResult(result);
        await matchRecord.save();
        console.log(`Candidate record for ${result.name} saved to MongoDB successfully.`);

        // 4. Return JSON exactly as requested in the assignment format
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error parsing document:", error);
        return res.status(500).json({ error: "Internal server error during parsing." });
    }
};

module.exports = {
    processJDAndResume
};
