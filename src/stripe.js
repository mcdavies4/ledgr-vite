export const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";
export const STRIPE_PK = "pk_live_51BQ2WIG0hyHY51OuRlnyMNZxy6qw7mlbxa88pTlcyJjbRQVwIhbeuoBL9va8PUqMjO6lfhYT9QJqAoHAGPJQqj1000d6mj58uB";

export async function startCheckout(userId, email) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "apikey": SUPABASE_ANON,
    },
    body: JSON.stringify({
      user_id: userId,
      email: email,
      return_url: window.location.origin,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Checkout failed (${res.status}): ${text}`);
  }

  const { url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = url;
}
