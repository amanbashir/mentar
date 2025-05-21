import { createClient } from "@supabase/supabase-js";

// Check for required environment variables
if (!process.env.VITE_SUPABASE_URL) {
  console.error("SUPABASE_URL is missing");
}

if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

// Initialize Supabase client
let supabase;
try {
  if (
    process.env.VITE_SUPABASE_URL &&
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  ) {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
  } else {
    console.error(
      "Cannot initialize Supabase client: missing environment variables"
    );
  }
} catch (error) {
  console.error("Error initializing Supabase client:", error);
}

// Handle CORS preflight requests
const handleCORS = (event) => {
  // For OPTIONS requests, return CORS headers immediately
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // No content
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    };
  }

  // For other requests, return null to continue processing
  return null;
};

export const handler = async (event, context) => {
  console.log("Function invoked with method:", event.httpMethod);

  // Handle CORS preflight request
  const corsResponse = handleCORS(event);
  if (corsResponse) {
    return corsResponse;
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  // Get the userId from query parameters
  const userId = event.queryStringParameters?.userId;
  console.log("Query parameters:", event.queryStringParameters);

  if (!userId) {
    console.error("Missing userId parameter");
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "User ID is required" }),
    };
  }

  // If Supabase client isn't initialized, return a mock response for development
  if (!supabase) {
    console.log("Using development mode (mock subscription) for user:", userId);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ status: "none" }),
    };
  }

  try {
    console.log("Fetching subscription for user:", userId);

    // Get user's subscription from Supabase
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: error.message }),
      };
    }

    if (!data) {
      console.log("No subscription found for user:", userId);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ status: "none" }),
      };
    }

    // Check if subscription is active
    const isActive = data.status === "active" || data.status === "trialing";
    const status = isActive ? data.plan_type : "none";

    console.log("Subscription status for user:", userId, "is:", status);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ status }),
    };
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
