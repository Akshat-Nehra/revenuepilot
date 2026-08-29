require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function checkModels() {
  try {
    const models = await groq.models.list();

    console.log("\nAvailable Groq models:\n");

    models.data.forEach((model) => {
      console.log(model.id);
    });

  } catch (error) {
    console.error(
      "Failed to fetch Groq models:"
    );

    console.error(error.message);
  }
}

checkModels();