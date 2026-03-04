export const STRIPE_PK = "pk_test_7Kh52Z9L5mgEoE2rpqmImXNx";
export const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";

export async function startCheckout(userId, email) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      email: email,
      return_url: window.location.origin,
    }),
  });
  const { url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = url;
}
