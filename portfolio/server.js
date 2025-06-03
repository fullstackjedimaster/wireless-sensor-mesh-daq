const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// API to GET projects.json
app.get('/api/projects', (req, res) => {
  const data = fs.readFileSync('./public/projects.json', 'utf8');
  res.json(JSON.parse(data));
});

// API to POST new projects.json
app.post('/api/projects', (req, res) => {
  fs.writeFileSync('./public/projects.json', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Portfolio available at http://localhost:${PORT}`);
});
