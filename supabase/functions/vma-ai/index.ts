import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const NVIDIA_URL =
  'https://integrate.api.nvidia.com/v1/chat/completions';

const MODEL =
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

serve(async (req) => {
  // --------------------------------
  // CORS
  // --------------------------------

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
      }),
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  try {
    // --------------------------------
    // NVIDIA API KEY
    // --------------------------------

    const NVIDIA_API_KEY =
      Deno.env.get('NVIDIA_API_KEY');

    if (!NVIDIA_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            'NVIDIA_API_KEY is missing from Supabase secrets.',
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // --------------------------------
    // REQUEST BODY
    // --------------------------------

    const body = await req.json();

    const messages = Array.isArray(
      body?.messages
    )
      ? body.messages
      : [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No messages provided.',
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // --------------------------------
    // NVIDIA REQUEST WITH RETRIES
    // --------------------------------

    const maxRetries = 3;

    let lastStatus = 503;
    let lastResult: any = null;

    for (
      let attempt = 0;
      attempt <= maxRetries;
      attempt++
    ) {
      console.log(
        `NVIDIA request attempt ${
          attempt + 1
        }/${maxRetries + 1}`
      );

      try {
        const response = await fetch(
          NVIDIA_URL,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${NVIDIA_API_KEY}`,

              Accept:
                'application/json',

              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              model: MODEL,

              messages,

              temperature: 0.6,

              top_p: 0.95,

              max_tokens: 2048,

              reasoning_budget: 1024,

              stream: false,
            }),
          }
        );

        lastStatus =
          response.status;

        const result =
          await response.json();

        lastResult = result;

        // --------------------------------
        // SUCCESS
        // --------------------------------

        if (response.ok) {
          const answer =
            result?.choices?.[0]
              ?.message?.content;

          if (!answer) {
            console.log(
              'NVIDIA returned no answer:',
              JSON.stringify(result)
            );

            return new Response(
              JSON.stringify({
                error:
                  'NVIDIA returned an empty response.',
              }),
              {
                status: 502,
                headers: corsHeaders,
              }
            );
          }

          console.log(
            'NVIDIA response received successfully.'
          );

          return new Response(
            JSON.stringify({
              answer,
            }),
            {
              status: 200,
              headers: corsHeaders,
            }
          );
        }

        // --------------------------------
        // RETRY 503
        // --------------------------------

        if (
          response.status === 503 &&
          attempt < maxRetries
        ) {
          const waitTime =
            Math.min(
              30000,
              Math.pow(2, attempt) *
                2000
            );

          console.log(
            `NVIDIA worker busy. Retrying in ${waitTime}ms...`
          );

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                waitTime
              )
          );

          continue;
        }

        // --------------------------------
        // OTHER NVIDIA ERROR
        // --------------------------------

        console.log(
          'NVIDIA API error:',
          JSON.stringify(result)
        );

        break;
      } catch (error) {
        console.log(
          'NVIDIA request exception:',
          error
        );

        lastResult = {
          error:
            error instanceof Error
              ? error.message
              : 'Unknown NVIDIA error',
        };

        if (
          attempt < maxRetries
        ) {
          const waitTime =
            Math.min(
              30000,
              Math.pow(2, attempt) *
                2000
            );

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                waitTime
              )
          );

          continue;
        }
      }
    }

    // --------------------------------
    // FINAL ERROR
    // --------------------------------

    const errorMessage =
      lastResult?.error?.message ||
      lastResult?.message ||
      'NVIDIA AI is temporarily unavailable.';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        status: lastStatus,
      }),
      {
        status: lastStatus >= 500
          ? lastStatus
          : 502,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.log(
      'VMA AI function error:',
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong.',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});