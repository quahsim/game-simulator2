export default function (err, req, res, next) {
    // Print error.
    console.error(err);
  
    // Send the error message to the client.
    res.status(500).json({ errorMessage: 'An internal server error occurred.' });
  }