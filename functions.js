async function postProperties(properties) {
  const API_URL = "https://api.XXXXX.com/properties";

  for (const property of properties) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(property)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      console.log(`Property ${property.id} uploaded successfully:`, result);
    } catch (error) {
      console.error(`Error uploading property ${property.id}:`, error);
    }
  }
}

// postProperties(propertiesArray);