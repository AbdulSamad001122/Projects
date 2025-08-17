import axios from "axios";

export async function sendEditorContentToApi(html, json) {
  try {
    const response = await axios.post("/api/pages/saveContent", { html, json });

    console.log(response.data);
  } catch (error) {
    throw Error("An error while sending content to save api ");
  }
}

sendEditorContentToApi(html, json);
  