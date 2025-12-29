const express = require("express");
const router = express.Router();
const pool = require("../db/index.js");

router.get("/w/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // get wedding
    const weddingResult = await pool.query(
      "SELECT * FROM weddings WHERE slug = $1",
      [slug]
    );

    if (weddingResult.rows.length === 0) {
      return res.status(404).send("Wedding not found");
    }

    const wedding = weddingResult.rows[0];

    // get sections
    const sectionsResult = await pool.query(
      "SELECT * FROM sections WHERE wedding_id = $1",
      [wedding.id]
    );

    // get images
    const imagesResult = await pool.query(
      "SELECT * FROM images WHERE wedding_id = $1",
      [wedding.id]
    );

    res.render(`templates/${wedding.template}`, {
      wedding,
      sections: sectionsResult.rows,
      images: imagesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
