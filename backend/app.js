const express = require('express');
const app = express();
const port = 3020; // any available port

// GET requests to the root URL
app.get('/', (req, res) => {
  res.send('Server running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});