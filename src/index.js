export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/api/health") {
      return Response.json({
        status: "SmartUni AI Backend Running"
      });
    }

    // AI Chatbot
    if (url.pathname === "/api/chat" && request.method === "POST") {

      try {

        if (!env.GEMINI_API_KEY) {
          return Response.json({
            error: "Gemini API key missing"
          }, { status: 500 });
        }

        const { message } = await request.json();

        if (!message || typeof message !== "string") {
          return Response.json({
            error: "Please enter a message"
          }, { status: 400 });
        }

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{
                  text: "You are SmartUni AI, a helpful university assistant. Help students with education, programming, assignments, study planning and university questions. Explain in simple language."
                }]
              },
              contents: [{
                role: "user",
                parts: [{ text: message }]
              }]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json({
            error: data.error?.message || "Gemini API error"
          }, { status: 502 });
        }

        const answer =
          data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("") || "No answer generated.";

        return Response.json({
          answer: answer
        });

      } catch (error) {

        return Response.json({
          error: error.message
        }, { status: 500 });

      }
    }

    // Website files
    return env.ASSETS.fetch(request);
  }
};
