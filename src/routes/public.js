const express = require("express");
const router = express.Router();
const pool = require("../db/index.js");

router.get("/w/:slug", async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();

    const weddingResult = await pool.query(
      "SELECT * FROM weddings WHERE slug = $1",
      [slug]
    );

    if (weddingResult.rows.length === 0) {
      return res.status(404).send("Wedding not found");
    }

    const wedding = weddingResult.rows[0];

    const sectionsResult = await pool.query(
      "SELECT * FROM sections WHERE wedding_id = $1",
      [wedding.id]
    );

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

router.get("/rsvp/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const weddingResult = await pool.query(
      `SELECT * FROM weddings WHERE slug = $1`,
      [slug.toLowerCase()]
    );

    if (weddingResult.rows.length === 0) {
      return res.status(404).send("Wedding not found");
    }

    res.render("rsvp", {
      wedding: weddingResult.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading RSVP page");
  }
});

router.post("/rsvp/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const weddingResult = await pool.query(
      `SELECT id FROM weddings WHERE slug = $1`,
      [slug.toLowerCase()]
    );

    if (weddingResult.rows.length === 0) {
      return res.status(404).send("Wedding not found");
    }

    const weddingId = weddingResult.rows[0].id;

    const {
      name,
      phone,
      attendance,
      guests_count
    } = req.body;

    const events = {
      traditional: req.body.traditional === "true",
      white: req.body.white === "true",
      reception: req.body.reception === "true"
    };

    await pool.query(
      `
      INSERT INTO rsvps (
        id, wedding_id, name, phone,
        attendance, guests_count, events
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        uuidv4(),
        weddingId,
        name,
        phone,
        attendance,
        guests_count || 1,
        JSON.stringify(events)
      ]
    );

    res.send("Thank you for your RSVP!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving RSVP");
  }
});



module.exports = router;
