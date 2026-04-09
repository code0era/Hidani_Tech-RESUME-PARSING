const mongoose = require('mongoose');

// Mongoose Schema to satisfy the "Database Integration" Bonus Point
const candidateResultSchema = new mongoose.Schema({
    name: { type: String, required: true },
    salary: { type: String }, // JD Target
    yearOfExperience: { type: Number }, // JD Target
    candidateSalary: { type: String }, // Resume Extracted
    candidateExperience: { type: Number }, // Resume Extracted
    isEligible: { type: Boolean }, // Derived Match > 55
    resumeSkills: [{ type: String }],
    matchingJobs: [
        {
            jobId: String,
            role: String,
            aboutRole: String,
            skillsAnalysis: [{
                skill: String,
                presentInResume: Boolean
            }],
            matchingScore: Number
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('CandidateResult', candidateResultSchema);
