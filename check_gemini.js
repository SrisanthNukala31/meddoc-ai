const key = process.env.VITE_GEMINI_API_KEY || "AIzaSyBFjGgUd28uDBgEhe-DjXcKpmw124AmXlQ";

async function checkModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await response.json();
  if (data.models) {
    console.log("AVAILABLE MODELS:");
    data.models.forEach(m => console.log(m.name, " - ", m.supportedGenerationMethods.join(", ")));
  } else {
    console.log("Error:", data);
  }
}

checkModels();
