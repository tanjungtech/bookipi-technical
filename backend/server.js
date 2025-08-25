const app = require('./app');
const cors = require("cors");
const PORT = process.env.PORT || 3020;

app.use(cors());

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});