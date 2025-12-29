const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const pool = require("../db/index.js");

/* =====================================================
   CREATE WEDDING
===================================================== */

// show create form
router.get("/create", (req, res) => {
  res.render("create-wedding");
});

// handle create form submit
router.post("/create", async (req, res) => {
  try {
    const {
      bride_name,
      groom_name,
      event_date,
      location,
      slug,
      event_type,
      contact_phone,
      contact_email
    } = req.body;

    const weddingId = uuidv4();
    const editToken = uuidv4();
    const normalizedSlug = slug.trim().toLowerCase();

    // ensure slug is unique
    const slugCheck = await pool.query(
      "SELECT 1 FROM weddings WHERE slug = $1",
      [normalizedSlug]
    );

    if (slugCheck.rows.length > 0) {
      return res.status(400).send("Wedding URL already exists");
    }

    // create wedding
    await pool.query(
      `
      INSERT INTO weddings (
        id, slug, bride_name, groom_name,
        event_date, location, event_type,
        contact_phone, contact_email, template
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [
        weddingId,
        normalizedSlug,
        bride_name,
        groom_name,
        event_date,
        location,
        event_type || "wedding",
        contact_phone,
        contact_email,
        "classic"
      ]
    );

    // create edit link
    await pool.query(
      `INSERT INTO edit_links (wedding_id, token) VALUES ($1, $2)`,
      [weddingId, editToken]
    );

    // REQUIRED: Our Story section
    await pool.query(
      `
      INSERT INTO sections (wedding_id, type, content)
      VALUES ($1, $2, $3)
      `,
      [
        weddingId,
        "story",
        JSON.stringify({ title: "Our Story", body: "" })
      ]
    );

    // REQUIRED: Events section
    await pool.query(
      `
      INSERT INTO sections (wedding_id, type, content)
      VALUES ($1, $2, $3)
      `,
      [
        weddingId,
        "events",
        JSON.stringify({
          traditional: { date: "", time: "", venue: "", dress_code: "" },
          white: { date: "", time: "", venue: "", dress_code: "" },
          reception: { date: "", time: "", venue: "", dress_code: "" }
        })
      ]
    );
    
            // REQUIRED: Wedding Party section
        await pool.query(
        `
        INSERT INTO sections (wedding_id, type, content)
        VALUES ($1, $2, $3)
        `,
        [
            weddingId,
            "wedding_party",
            JSON.stringify({
            maid_of_honor: { name: "", about: "" },
            best_man: { name: "", about: "" },
            bridesmaids: [
                { name: "", about: "" },
                { name: "", about: "" },
                { name: "", about: "" },
                { name: "", about: "" }
            ],
            groomsmen: [
                { name: "", about: "" },
                { name: "", about: "" },
                { name: "", about: "" },
                { name: "", about: "" }
            ]
            })
        ]
        );

        // REQUIRED: Q&A section
        await pool.query(
        `
        INSERT INTO sections (wedding_id, type, content)
        VALUES ($1, $2, $3)
        `,
        [
            weddingId,
            "qna",
            JSON.stringify({
            plus_one_allowed: false,
            plus_one_note: "",
            kids_allowed: false,
            kids_note: ""
            })
        ]
        );

    res.redirect(`/edit/${editToken}`);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).send("Error creating wedding");
  }
});

/* =====================================================
   EDIT DASHBOARD
===================================================== */

// load edit dashboard
router.get("/edit/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const weddingResult = await pool.query(
      `
      SELECT w.*
      FROM weddings w
      JOIN edit_links e ON e.wedding_id = w.id
      WHERE e.token = $1
      `,
      [token]
    );

    if (weddingResult.rows.length === 0) {
      return res.status(404).send("Invalid edit link");
    }

    const wedding = weddingResult.rows[0];

    const sectionsResult = await pool.query(
      `SELECT * FROM sections WHERE wedding_id = $1`,
      [wedding.id]
    );

    res.render("edit-wedding", {
      wedding,
      sections: sectionsResult.rows,
      token
    });
  } catch (err) {
    console.error("EDIT LOAD ERROR:", err);
    res.status(500).send("Error loading edit page");
  }
});

// save edits
router.post("/edit/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const tokenResult = await pool.query(
      `SELECT wedding_id FROM edit_links WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).send("Invalid edit link");
    }

    const weddingId = tokenResult.rows[0].wedding_id;

    const {
      bride_name,
      groom_name,
      event_date,
      location,
      story
    } = req.body;

    // update core wedding info
    await pool.query(
      `
      UPDATE weddings
      SET bride_name = $1,
          groom_name = $2,
          event_date = $3,
          location = $4
      WHERE id = $5
      `,
      [bride_name, groom_name, event_date, location, weddingId]
    );

    // update story
    await pool.query(
      `
      UPDATE sections
      SET content = $1
      WHERE wedding_id = $2 AND type = 'story'
      `,
      [
        JSON.stringify({ title: "Our Story", body: story || "" }),
        weddingId
      ]
    );

    // update events
    await pool.query(
      `
      UPDATE sections
      SET content = $1
      WHERE wedding_id = $2 AND type = 'events'
      `,
      [
        JSON.stringify({
          traditional: {
            date: req.body.traditional_date || "",
            time: req.body.traditional_time || "",
            venue: req.body.traditional_venue || "",
            dress_code: req.body.traditional_dress_code || ""
          },
          white: {
            date: req.body.white_date || "",
            time: req.body.white_time || "",
            venue: req.body.white_venue || "",
            dress_code: req.body.white_dress_code || ""
          },
          reception: {
            date: req.body.reception_date || "",
            time: req.body.reception_time || "",
            venue: req.body.reception_venue || "",
            dress_code: req.body.reception_dress_code || ""
          }
        }),
        weddingId
      ]
    );

    // update wedding party
    await pool.query(
    `
    UPDATE sections
    SET content = $1
    WHERE wedding_id = $2 AND type = 'wedding_party'
    `,
    [
        JSON.stringify({
        maid_of_honor: {
            name: req.body.moh_name || "",
            about: req.body.moh_about || ""
        },
        best_man: {
            name: req.body.bm_name || "",
            about: req.body.bm_about || ""
        },
        bridesmaids: [0,1,2,3].map(i => ({
            name: req.body[`bridesmaids_name_${i}`] || "",
            about: req.body[`bridesmaids_about_${i}`] || ""
        })),
        groomsmen: [0,1,2,3].map(i => ({
            name: req.body[`groomsmen_name_${i}`] || "",
            about: req.body[`groomsmen_about_${i}`] || ""
        }))
        }),
        weddingId
        ]
        );

        // update Q&A section
        await pool.query(
        `
        UPDATE sections
        SET content = $1
        WHERE wedding_id = $2 AND type = 'qna'
        `,
        [
            JSON.stringify({
            plus_one_allowed: req.body.plus_one_allowed === "true",
            plus_one_note: req.body.plus_one_note || "",
            kids_allowed: req.body.kids_allowed === "true",
            kids_note: req.body.kids_note || ""
            }),
            weddingId
        ]
        );


    res.redirect(`/edit/${token}`);
  } catch (err) {
    console.error("EDIT SAVE ERROR:", err);
    res.status(500).send("Error saving changes");
  }
});

module.exports = router;
