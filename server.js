"use strict";

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

const app = express();

/* =========================================================
   CONFIG
========================================================= */

// Telegram
// مقادیر فعلی Telegram Bot خودت را در Environment Variables
// یا مقادیر قبلی پروژه‌ات نگه دار.
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "";

const TELEGRAM_CHAT_ID =
  process.env.TELEGRAM_CHAT_ID || "";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || "TondropyAdmin2026";

// Supabase
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://vqddirelnxiklannquuu.supabase.co";

// IMPORTANT:
// Secret key MUST NOT be hardcoded in source code.
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  "";

/* =========================================================
   APP CONFIG
========================================================= */

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(
  express.json({
    limit: "12mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "12mb",
  })
);

/* =========================================================
   AXIOS
========================================================= */

const http = axios.create({
  timeout: 15000,
});

/* =========================================================
   BASIC HELPERS
========================================================= */

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({
    success: false,
    error: message,
    ...extra,
  });
}

function requireSupabase(res) {
  if (!SUPABASE_URL) {
    jsonError(res, 500, "SUPABASE_URL is not configured.");
    return false;
  }

  if (!SUPABASE_KEY) {
    jsonError(
      res,
      500,
      "SUPABASE_SECRET_KEY is not configured on Vercel."
    );
    return false;
  }

  return true;
}

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function supabaseUrl(endpoint) {
  return `${SUPABASE_URL}/rest/v1/${endpoint}`;
}

/* =========================================================
   SUPABASE REQUEST
========================================================= */

async function supabaseRequest(
  method,
  endpoint,
  data = undefined,
  params = undefined
) {
  const response = await http.request({
    method,
    url: supabaseUrl(endpoint),
    headers: getSupabaseHeaders(),
    data,
    params,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    const error = new Error(
      response.data?.message ||
        response.data?.error_description ||
        response.data?.hint ||
        `Supabase returned HTTP ${response.status}`
    );

    error.status = response.status;
    error.details = response.data;

    throw error;
  }

  return response.data;
}

/* =========================================================
   SUPABASE ERROR
========================================================= */

function formatSupabaseError(error) {
  return {
    message:
      error?.message ||
      "Supabase request failed.",
    status:
      error?.status ||
      error?.response?.status ||
      500,
    details:
      error?.details ||
      error?.response?.data ||
      null,
  };
}

/* =========================================================
   TELEGRAM WEBAPP VALIDATION
========================================================= */

function verifyTelegramWebAppData(initData) {
  if (!initData || !TELEGRAM_BOT_TOKEN) {
    return {
      valid: false,
      reason: "Missing Telegram initData or bot token.",
    };
  }

  try {
    const params = new URLSearchParams(initData);

    const receivedHash = params.get("hash");

    if (!receivedHash) {
      return {
        valid: false,
        reason: "Telegram hash is missing.",
      };
    }

    params.delete("hash");

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const valid =
      calculatedHash.length === receivedHash.length &&
      crypto.timingSafeEqual(
        Buffer.from(calculatedHash),
        Buffer.from(receivedHash)
      );

    if (!valid) {
      return {
        valid: false,
        reason: "Telegram initData signature is invalid.",
      };
    }

    const authDate = Number(params.get("auth_date") || 0);

    if (authDate) {
      const age = Math.floor(Date.now() / 1000) - authDate;

      // 24 hours
      if (age > 86400) {
        return {
          valid: false,
          reason: "Telegram initData has expired.",
        };
      }
    }

    let user = null;

    const userRaw = params.get("user");

    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {
        user = null;
      }
    }

    return {
      valid: true,
      user,
      params,
    };
  } catch (error) {
    return {
      valid: false,
      reason: error.message || "Telegram validation failed.",
    };
  }
}

/* =========================================================
   ADMIN AUTH
========================================================= */

function verifyAdmin(req) {
  const headerSecret =
    req.headers["x-admin-secret"];

  const authorization =
    req.headers.authorization || "";

  const bearerSecret =
    authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

  const querySecret =
    req.query?.secret || "";

  const suppliedSecret =
    headerSecret ||
    bearerSecret ||
    querySecret;

  return (
    Boolean(suppliedSecret) &&
    suppliedSecret === ADMIN_SECRET
  );
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    online: true,
    service: "TON Dropy Backend",
    version: "1.0.3",
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(SUPABASE_KEY),
    telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN),
  });
});

/* =========================================================
   TEST DATABASE
========================================================= */

app.get("/api/test-db", async (req, res) => {
  if (!requireSupabase(res)) {
    return;
  }

  try {
    const users = await supabaseRequest(
      "GET",
      "users",
      undefined,
      {
        select: "*",
        limit: 5,
        order: "created_at.desc",
      }
    );

    return res.json({
      success: true,
      message: "Supabase connection is working.",
      count: Array.isArray(users)
        ? users.length
        : 0,
      users,
    });
  } catch (error) {
    const details =
      formatSupabaseError(error);

    return res.status(details.status).json({
      success: false,
      error: details.message,
      status: details.status,
      details: details.details,
    });
  }
});

/* =========================================================
   TELEGRAM AUTH
========================================================= */

app.post("/api/auth/telegram", async (req, res) => {
  if (!requireSupabase(res)) {
    return;
  }

  const { initData } = req.body || {};

  if (!initData) {
    return jsonError(
      res,
      400,
      "Telegram initData is required."
    );
  }

  const verification =
    verifyTelegramWebAppData(initData);

  if (!verification.valid) {
    return jsonError(
      res,
      401,
      verification.reason
    );
  }

  const telegramUser =
    verification.user;

  if (!telegramUser?.id) {
    return jsonError(
      res,
      400,
      "Telegram user information is missing."
    );
  }

  const telegramId =
    String(telegramUser.id);

  const username =
    telegramUser.username ||
    "";

  const firstName =
    telegramUser.first_name ||
    "";

  const lastName =
    telegramUser.last_name ||
    "";

  try {
    const existing = await supabaseRequest(
      "GET",
      "users",
      undefined,
      {
        select: "*",
        telegram_id: `eq.${telegramId}`,
        limit: 1,
      }
    );

    if (Array.isArray(existing) && existing.length) {
      const user = existing[0];

      return res.json({
        success: true,
        existing: true,
        user_id: user.id,
        telegram_id: telegramId,
        username:
          user.username || username,
        account_status:
          user.account_status ||
          "inactive",
        user,
      });
    }

    const created = await supabaseRequest(
      "POST",
      "users",
      {
        telegram_id: telegramId,
        username,
        first_name: firstName,
        last_name: lastName,
        account_status: "inactive",
      }
    );

    const user =
      Array.isArray(created)
        ? created[0]
        : created;

    return res.json({
      success: true,
      existing: false,
      user_id: user?.id || null,
      telegram_id: telegramId,
      username,
      account_status:
        user?.account_status ||
        "inactive",
      user,
    });
  } catch (error) {
    const details =
      formatSupabaseError(error);

    return res.status(details.status).json({
      success: false,
      error: details.message,
      status: details.status,
      details: details.details,
    });
  }
});

/* =========================================================
   UPLOAD RECEIPT
========================================================= */

app.post(
  "/api/upload-receipt",
  async (req, res) => {
    if (!requireSupabase(res)) {
      return;
    }

    const {
      telegramId,
      username,
      amount,
      imageData,
      receipt,
    } = req.body || {};

    const finalTelegramId =
      String(telegramId || "").trim();

    const finalUsername =
      String(username || "").trim();

    const finalAmount =
      Number(amount || 0);

    const finalImageData =
      imageData || receipt || "";

    if (!finalTelegramId) {
      return jsonError(
        res,
        400,
        "telegramId is required."
      );
    }

    if (!finalImageData) {
      return jsonError(
        res,
        400,
        "Receipt image is required."
      );
    }

    if (
      !/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(
        finalImageData
      )
    ) {
      return jsonError(
        res,
        400,
        "Receipt must be a valid image data URL."
      );
    }

    // Prevent excessively large payloads.
    if (finalImageData.length > 10 * 1024 * 1024) {
      return jsonError(
        res,
        413,
        "Receipt image is too large."
      );
    }

    try {
      const users = await supabaseRequest(
        "GET",
        "users",
        undefined,
        {
          select: "*",
          telegram_id: `eq.${finalTelegramId}`,
          limit: 1,
        }
      );

      if (!Array.isArray(users) || !users.length) {
        return jsonError(
          res,
          404,
          "Telegram user was not found."
        );
      }

      const user = users[0];

      if (
        user.account_status ===
        "active"
      ) {
        return res.json({
          success: true,
          alreadyActive: true,
          message:
            "Your account is already active.",
          user,
        });
      }

      const pendingReceipts =
        await supabaseRequest(
          "GET",
          "receipts",
          undefined,
          {
            select: "id,status,created_at",
            telegram_id: `eq.${finalTelegramId}`,
            status: "eq.pending",
            limit: 1,
          }
        );

      if (
        Array.isArray(pendingReceipts) &&
        pendingReceipts.length
      ) {
        return res.status(409).json({
          success: false,
          pending: true,
          message:
            "A receipt is already waiting for review.",
          receipt:
            pendingReceipts[0],
        });
      }

      const inserted =
        await supabaseRequest(
          "POST",
          "receipts",
          {
            user_id: user.id,
            telegram_id: finalTelegramId,
            username:
              finalUsername ||
              user.username ||
              "",
            amount:
              finalAmount || null,
            image_data: finalImageData,
            status: "pending",
          }
        );

      const newReceipt =
        Array.isArray(inserted)
          ? inserted[0]
          : inserted;

      await supabaseRequest(
        "PATCH",
        "users",
        {
          account_status: "pending",
          updated_at:
            new Date().toISOString(),
        },
        {
          telegram_id: `eq.${finalTelegramId}`,
        }
      );

      // Telegram notification is optional.
      // If Telegram configuration is missing,
      // the receipt itself is still saved.
      if (
        TELEGRAM_BOT_TOKEN &&
        TELEGRAM_CHAT_ID
      ) {
        try {
          await sendReceiptToTelegram({
            telegramId:
              finalTelegramId,
            username:
              finalUsername ||
              user.username ||
              "",
            amount:
              finalAmount,
            imageData:
              finalImageData,
            receiptId:
              newReceipt?.id || "",
          });
        } catch (telegramError) {
          console.error(
            "Telegram notification failed:",
            telegramError.message
          );
        }
      }

      return res.json({
        success: true,
        message:
          "Receipt submitted successfully.",
        receipt: newReceipt,
        account_status:
          "pending",
      });
    } catch (error) {
      const details =
        formatSupabaseError(error);

      return res.status(details.status).json({
        success: false,
        error: details.message,
        status: details.status,
        details: details.details,
      });
    }
  }
);

/* =========================================================
   TELEGRAM RECEIPT NOTIFICATION
========================================================= */

async function sendReceiptToTelegram({
  telegramId,
  username,
  amount,
  imageData,
  receiptId,
}) {
  const match = String(imageData).match(
    /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i
  );

  if (!match) {
    throw new Error(
      "Invalid receipt image format."
    );
  }

  const mimeType = match[1];
  const base64 = match[2];

  const buffer =
    Buffer.from(base64, "base64");

  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
      ? "webp"
      : "jpg";

  const form = new FormData();

  form.append(
    "chat_id",
    TELEGRAM_CHAT_ID
  );

  const caption = [
    "TON Dropy",
    "",
    "🧾 رسید جدید",
    `👤 Telegram ID: ${telegramId}`,
    `🔹 Username: ${
      username ? "@" + username : "-"
    }`,
    `💰 مبلغ: ${
      amount
        ? Number(amount).toLocaleString("fa-IR")
        : "-"
    }`,
    `🆔 Receipt ID: ${receiptId || "-"}`,
    "",
    "⏳ وضعیت: در انتظار بررسی",
  ].join("\n");

  form.append(
    "caption",
    caption
  );

  form.append(
    "photo",
    new Blob(
      [buffer],
      {
        type: mimeType,
      }
    ),
    `receipt-${Date.now()}.${extension}`
  );

  const response =
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: form,
      }
    );

  const result =
    await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.description ||
        "Telegram API error."
    );
  }

  return result;
}

/* =========================================================
   ADMIN - GET RECEIPTS
========================================================= */

app.get(
  "/api/admin/receipts-v2",
  async (req, res) => {
    if (!verifyAdmin(req)) {
      return jsonError(
        res,
        401,
        "Unauthorized."
      );
    }

    if (!requireSupabase(res)) {
      return;
    }

    try {
      const receipts =
        await supabaseRequest(
          "GET",
          "receipts",
          undefined,
          {
            select: "*",
            order:
              "created_at.desc",
          }
        );

      return res.json({
        success: true,
        receipts:
          Array.isArray(receipts)
            ? receipts
            : [],
      });
    } catch (error) {
      const details =
        formatSupabaseError(error);

      return res.status(details.status).json({
        success: false,
        error: details.message,
        status: details.status,
        details: details.details,
      });
    }
  }
);

/* =========================================================
   ADMIN - REVIEW
========================================================= */

app.post(
  "/api/admin/review",
  async (req, res) => {
    if (!verifyAdmin(req)) {
      return jsonError(
        res,
        401,
        "Unauthorized."
      );
    }

    if (!requireSupabase(res)) {
      return;
    }

    const {
      receiptId,
      status,
    } = req.body || {};

    if (!receiptId) {
      return jsonError(
        res,
        400,
        "receiptId is required."
      );
    }

    if (
      status !== "approved" &&
      status !== "rejected"
    ) {
      return jsonError(
        res,
        400,
        "status must be approved or rejected."
      );
    }

    try {
      // First get the actual receipt.
      // The browser is NOT trusted for user_id.
      const receipts =
        await supabaseRequest(
          "GET",
          "receipts",
          undefined,
          {
            select: "*",
            id: `eq.${receiptId}`,
            limit: 1,
          }
        );

      if (
        !Array.isArray(receipts) ||
        !receipts.length
      ) {
        return jsonError(
          res,
          404,
          "Receipt not found."
        );
      }

      const receipt =
        receipts[0];

      if (
        receipt.status !== "pending"
      ) {
        return res.status(409).json({
          success: false,
          error:
            "This receipt has already been reviewed.",
          current_status:
            receipt.status,
        });
      }

      const newUserStatus =
        status === "approved"
          ? "active"
          : "inactive";

      const reviewedAt =
        new Date().toISOString();

      // Update receipt first.
      const updatedReceipts =
        await supabaseRequest(
          "PATCH",
          "receipts",
          {
            status,
            reviewed_at:
              reviewedAt,
          },
          {
            id: `eq.${receiptId}`,
            status: "eq.pending",
          }
        );

      if (
        !Array.isArray(updatedReceipts) ||
        !updatedReceipts.length
      ) {
        return res.status(409).json({
          success: false,
          error:
            "Receipt was already reviewed by another request.",
        });
      }

      try {
        // Update user based on receipt identity.
        let updatedUsers;

        if (receipt.user_id) {
          updatedUsers =
            await supabaseRequest(
              "PATCH",
              "users",
              {
                account_status:
                  newUserStatus,
                updated_at:
                  reviewedAt,
              },
              {
                id: `eq.${receipt.user_id}`,
              }
            );
        } else {
          updatedUsers =
            await supabaseRequest(
              "PATCH",
              "users",
              {
                account_status:
                  newUserStatus,
                updated_at:
                  reviewedAt,
              },
              {
                telegram_id:
                  `eq.${receipt.telegram_id}`,
              }
            );
        }

        return res.json({
          success: true,
          message:
            status === "approved"
              ? "Receipt approved and user activated."
              : "Receipt rejected and user deactivated.",
          receipt:
            updatedReceipts[0],
          users:
            updatedUsers,
        });
      } catch (userUpdateError) {
        // Roll receipt back if user update fails.
        try {
          await supabaseRequest(
            "PATCH",
            "receipts",
            {
              status: "pending",
              reviewed_at: null,
            },
            {
              id: `eq.${receiptId}`,
              status: `eq.${status}`,
            }
          );
        } catch (rollbackError) {
          console.error(
            "Receipt rollback failed:",
            rollbackError.message
          );
        }

        throw userUpdateError;
      }
    } catch (error) {
      const details =
        formatSupabaseError(error);

      return res.status(details.status).json({
        success: false,
        error: details.message,
        status: details.status,
        details: details.details,
      });
    }
  }
);

/* =========================================================
   ADMIN PAGE
========================================================= */

app.get("/admin", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "admin.html"
    )
  );
});

/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public"),
    {
      index: "index.html",
    }
  )
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  if (
    req.path.startsWith("/api/")
  ) {
    return res.status(404).json({
      success: false,
      error: "API route not found.",
      path: req.path,
    });
  }

  return res.status(404).send(
    "TON Dropy - Page not found."
  );
});

/* =========================================================
   GLOBAL ERROR
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Internal server error.",
    });
  }
);

/* =========================================================
   VERCEL EXPORT
========================================================= */

module.exports = app;
