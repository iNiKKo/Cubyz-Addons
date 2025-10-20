export async function handler(event, context) {
  try {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const audience = process.env.AUTH0_AUDIENCE;

    const url = `https://${domain}/oauth/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience,
        grant_type: 'client_credentials',
      }),
    });

    const text = await response.text();

    // Try to parse JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Invalid JSON from Auth0',
          raw: text,
        }),
      };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error || 'Auth0 error',
          description: data.error_description || text,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: data.access_token,
        token_type: data.token_type,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
