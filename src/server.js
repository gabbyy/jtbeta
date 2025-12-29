const app = require("./app");
const pool = require("./db");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 JT running on http://localhost:${PORT}`);
});
