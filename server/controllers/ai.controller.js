exports.enhanceStory = async (req, res) => {
  const { originalText } = req.body;

  // Simulate GPT response for development
  const mockResponse = {
    correctedText: originalText.replace("uploader", "upload") + " (corrected)",
    acceptanceCriteria: [
      "User must be able to upload a resume in PDF or DOC format.",
      "The upload should complete within 10 seconds.",
      "A success message should appear after upload.",
    ],
    happyTests: [
      "User uploads a valid PDF resume and sees success message.",
      "User uploads a DOC file and the system stores it correctly.",
    ],
    negativeTests: [
      "User tries to upload an unsupported file type (e.g., .exe).",
      "User uploads a file larger than 5MB.",
    ],
  };

  res.json(mockResponse);
};
