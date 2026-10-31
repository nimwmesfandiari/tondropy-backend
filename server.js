"use strict";

/*
=========================================================
TON DROPY BACKEND
Version: 1.1.0
Node.js / Express / Vercel / Supabase / Telegram
=========================================================

IMPORTANT:
Secrets must be stored in Vercel Environment Variables.

Required:
SUPABASE_SECRET_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
ADMIN_SECRET

Optional:
SUPABASE_URL
*/

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

const app = express();

/*
=========================================================
CONFIG
=========================================================
*/

const PORT = Number(process.env.PORT || 3000);

/*
---------------------------------------------------------
SUPABASE
---------------------------------------------------------
*/

const SUPABASE_URL =
  String(
    process.env.SUPABASE_URL ||
      "https://vqddirelnxiklannquuu.supabase.co"
  ).replace(/\/+$/, "");

const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  "";

/*
---------------------------------------------------------
TELEGRAM
---------------------------------------------------------
*/

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "";

const TELEGRAM_CHAT_ID =
  process.env.TELEGRAM_CHAT_ID || "";

/*
---------------------------------------------------------
ADMIN
---------------------------------------------------------
*/

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || "";

/*
=========================================================
APP CONFIGURATION
=========================================================
*/

app.disable("x-powered-by");

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: false,
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Admin-Secret"
    ]
  })
);

app.use(
  express.json({
    limit: "12mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "12mb"
  })
);

/*
=========================================================
HTTP CLIENT
=========================================================
*/

const http = axios.create({
  timeout: 20000,
  validateStatus: () => true
});

/*
=========================================================
GENERAL HELPERS
=========================================================
*/

function fail(res, status, error, extra = {}) {
  return res.status(status).json({
    success: false,
    error,
    ...extra
  });
}

function now() {
  return new Date().toISOString();
}

function safeString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function isConfigured(value) {
  return Boolean(
    value &&
      typeof value === "string" &&
      value.trim().length > 0
  );
}

/*
=========================================================
SUPABASE
=========================================================
*/

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Prefer: "return=representation"
  };
}

async function supabase(
  method,
  table,
  data = undefined,
  params = undefined
) {
  if (!isConfigured(SUPABASE_KEY)) {
    const error = new Error(
      "SUPABASE_SECRET_KEY is not configured on Vercel."
    );

    error.status = 500;
    error.code = "SUPABASE_KEY_MISSING";

    throw error;
  }

  const url =
    `${SUPABASE_URL}/rest/v1/${table}`;

  const response = await http.request({
    method,
    url,
    headers: getSupabaseHeaders(),
    data,
    params
  });

  if (response.status >= 400) {
    const message =
      response.data?.message ||
      response.data?.hint ||
      response.data?.error_description ||
      response.data?.msg ||
      `Supabase HTTP ${response.status}`;

    const error = new Error(message);

    error.status = response.status;
    error.code =
      response.data?.code ||
      "SUPABASE_ERROR";
    error.details = response.data;

    throw error;
  }

  return response.data;
}

/*
=========================================================
TELEGRAM WEB APP AUTHENTICATION
=========================================================
*/

function verifyTelegram(initData) {
  if (!initData) {
    return {
      valid: false,
      reason: "Telegram initData is missing."
    };
  }

  if (!isConfigured(TELEGRAM_BOT_TOKEN)) {
    return {
      valid: false,
      reason: "Telegram bot configuration is missing."
    };
  }

  try {
    const params =
      new URLSearchParams(initData);

    const receivedHash =
      params.get("hash");

    if (!receivedHash) {
      return {
        valid: false,
        reason: "Telegram hash is missing."
      };
    }

    params.delete("hash");

    const dataCheckString =
      Array.from(params.entries())
        .sort(([a], [b]) =>
          a.localeCompare(b)
        )
        .map(
          ([key, value]) =>
            `${key}=${value}`
        )
        .join("\n");

    /*
      Telegram WebApp verification:
      secret_key = HMAC-SHA256(
        key="WebAppData",
        message=BOT_TOKEN
      )
    */

    const secretKey =
      crypto
        .createHmac(
          "sha256",
          "WebAppData"
        )
        .update(
          TELEGRAM_BOT_TOKEN
        )
        .digest();

    const calculatedHash =
      crypto
        .createHmac(
          "sha256",
          secretKey
        )
        .update(
          dataCheckString
        )
        .digest("hex");

    if (
      receivedHash.length !==
      calculatedHash.length
    ) {
      return {
        valid: false,
        reason:
          "Telegram signature is invalid."
      };
    }

    const valid =
      crypto.timingSafeEqual(
        Buffer.from(
          receivedHash,
          "utf8"
        ),
        Buffer.from(
          calculatedHash,
          "utf8"
        )
      );

    if (!valid) {
      return {
        valid: false,
        reason:
          "Telegram initData signature is invalid."
      };
    }

    /*
      Prevent very old initData.
      24 hours is allowed.
    */

    const authDate =
      Number(
        params.get("auth_date") || 0
      );

    if (
      authDate > 0 &&
      Math.floor(Date.now() / 1000) -
        authDate >
        86400
    ) {
      return {
        valid: false,
        reason:
          "Telegram initData has expired."
      };
    }

    let user = null;

    try {
      user = JSON.parse(
        params.get("user") || "null"
      );
    } catch (_) {
      user = null;
    }

    return {
      valid: true,
      user
    };
  } catch (error) {
    return {
      valid: false,
      reason:
        error.message ||
        "Telegram validation failed."
    };
  }
}

/*
=========================================================
ADMIN AUTHENTICATION
=========================================================
*/

function verifyAdmin(req) {
  /*
    If ADMIN_SECRET is not configured,
    admin API is disabled.
  */

  if (!isConfigured(ADMIN_SECRET)) {
    return false;
  }

  const headerSecret =
    safeString(
      req.headers["x-admin-secret"]
    );

  const authorization =
    safeString(
      req.headers.authorization
    );

  const bearerSecret =
    authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

  const querySecret =
    safeString(
      req.query?.secret
    );

  return (
    headerSecret === ADMIN_SECRET ||
    bearerSecret === ADMIN_SECRET ||
    querySecret === ADMIN_SECRET
  );
}

/*
=========================================================
TELEGRAM RECEIPT NOTIFICATION
=========================================================
*/

async function sendTelegramReceipt(
  telegramId,
  username,
  amount,
  imageData,
  receiptId
) {
  if (
    !isConfigured(
      TELEGRAM_BOT_TOKEN
    )
  ) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not configured."
    );
  }

  if (
    !isConfigured(
      TELEGRAM_CHAT_ID
    )
  ) {
    throw new Error(
      "TELEGRAM_CHAT_ID is not configured."
    );
  }

  const match =
    String(imageData).match(
      /^data:(image\/[^;]+);base64,(.+)$/i
    );

  if (!match) {
    throw new Error(
      "Invalid receipt image."
    );
  }

  const mime = match[1];

  const buffer =
    Buffer.from(
      match[2],
      "base64"
    );

  let extension = "jpg";

  if (
    mime.toLowerCase().includes("png")
  ) {
    extension = "png";
  } else if (
    mime.toLowerCase().includes("webp")
  ) {
    extension = "webp";
  }

  const caption =
`TON Dropy

🧾 رسید جدید

👤 Telegram ID: ${telegramId}

🔹 Username: ${
  username
    ? "@" + username
    : "-"
}

💰 مبلغ: ${
  amount
    ? Number(amount).toLocaleString("fa-IR")
    : "-"
}

🆔 Receipt ID: ${
  receiptId || "-"
}

⏳ وضعیت: در انتظار بررسی`;

  /*
    Node.js 18+ provides fetch/FormData/Blob.
  */

  const form =
    new FormData();

  form.append(
    "chat_id",
    TELEGRAM_CHAT_ID
  );

  form.append(
    "caption",
    caption
  );

  form.append(
    "photo",
    new Blob(
      [buffer],
      {
        type: mime
      }
    ),
    `receipt-${Date.now()}.${extension}`
  );

  const response =
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: form
      }
    );

  const result =
    await response.json();

  if (
    !response.ok ||
    !result.ok
  ) {
    throw new Error(
      result.description ||
        "Telegram API error."
    );
  }

  return result;
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {
    return res.json({
      success: true,

      online: true,

      service:
        "TON Dropy Backend",

      version:
        "1.1.0",

      supabaseConfigured:
        isConfigured(
          SUPABASE_KEY
        ),

      telegramConfigured:
        isConfigured(
          TELEGRAM_BOT_TOKEN
        ),

      adminConfigured:
        isConfigured(
          ADMIN_SECRET
        ),

      supabaseUrlConfigured:
        isConfigured(
          SUPABASE_URL
        ),

      timestamp: now()
    });
  }
);

/*
=========================================================
TEST SUPABASE DATABASE
=========================================================
*/

app.get(
  "/api/test-db",
  async (req, res) => {
    try {
      const users =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            limit: 5,
            order:
              "created_at.desc"
          }
        );

      return res.json({
        success: true,

        message:
          "Supabase connection is working.",

        count:
          Array.isArray(users)
            ? users.length
            : 0,

        users
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,

        message:
          "Supabase connection failed.",

        error:
          error.message,

        code:
          error.code ||
          "SUPABASE_ERROR",

        status:
          error.status || 500,

        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
TELEGRAM AUTH
=========================================================
*/

app.post(
  "/api/auth/telegram",
  async (req, res) => {
    const initData =
      safeString(
        req.body?.initData
      );

    const result =
      verifyTelegram(
        initData
      );

    if (!result.valid) {
      return fail(
        res,
        401,
        result.reason
      );
    }

    const telegramUser =
      result.user;

    if (
      !telegramUser ||
      !telegramUser.id
    ) {
      return fail(
        res,
        400,
        "Telegram user information is missing."
      );
    }

    const telegramId =
      String(
        telegramUser.id
      );

    const username =
      safeString(
        telegramUser.username
      );

    const firstName =
      safeString(
        telegramUser.first_name
      );

    const lastName =
      safeString(
        telegramUser.last_name
      );

    try {
      const existing =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            telegram_id:
              `eq.${telegramId}`,
            limit: 1
          }
        );

      /*
      ---------------------------------------------------
      EXISTING USER
      ---------------------------------------------------
      */

      if (
        Array.isArray(existing) &&
        existing.length > 0
      ) {
        const user =
          existing[0];

        const changed =
          safeString(
            user.username
          ) !== username ||
          safeString(
            user.first_name
          ) !== firstName ||
          safeString(
            user.last_name
          ) !== lastName;

        if (changed) {
          await supabase(
            "PATCH",
            "users",
            {
              username,
              first_name:
                firstName,
              last_name:
                lastName,
              updated_at:
                now()
            },
            {
              telegram_id:
                `eq.${telegramId}`
            }
          );

          user.username =
            username;

          user.first_name =
            firstName;

          user.last_name =
            lastName;
        }

        return res.json({
          success: true,

          existing: true,

          user_id:
            user.id || null,

          telegram_id:
            telegramId,

          username,

          account_status:
            user.account_status ||
            "inactive",

          user
        });
      }

      /*
      ---------------------------------------------------
      NEW USER
      ---------------------------------------------------
      */

      const created =
        await supabase(
          "POST",
          "users",
          {
            telegram_id:
              telegramId,

            username,

            first_name:
              firstName,

            last_name:
              lastName,

            account_status:
              "inactive"
          }
        );

      const user =
        Array.isArray(created)
          ? created[0]
          : null;

      return res.json({
        success: true,

        existing: false,

        user_id:
          user?.id || null,

        telegram_id:
          telegramId,

        username,

        account_status:
          user?.account_status ||
          "inactive",

        user
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,

        error:
          error.message,

        code:
          error.code ||
          "AUTH_ERROR",

        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
GET USER
=========================================================
*/

app.get(
  "/api/user/:telegramId",
  async (req, res) => {
    const telegramId =
      safeString(
        req.params.telegramId
      );

    if (!telegramId) {
      return fail(
        res,
        400,
        "telegramId is required."
      );
    }

    try {
      const users =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            telegram_id:
              `eq.${telegramId}`,
            limit: 1
          }
        );

      if (
        !Array.isArray(users) ||
        !users.length
      ) {
        return fail(
          res,
          404,
          "User not found."
        );
      }

      return res.json({
        success: true,
        user: users[0]
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,
        error:
          error.message,
        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
UPLOAD RECEIPT
=========================================================
*/

app.post(
  "/api/upload-receipt",
  async (req, res) => {
    const telegramId =
      safeString(
        req.body?.telegramId
      );

    const username =
      safeString(
        req.body?.username
      );

    const amount =
      Number(
        req.body?.amount || 0
      );

    /*
      Compatibility with old frontend versions:
      imageData
      imageBase64
      receipt
    */

    const imageData =
      req.body?.imageData ||
      req.body?.imageBase64 ||
      req.body?.receipt ||
      "";

    if (!telegramId) {
      return fail(
        res,
        400,
        "telegramId is required."
      );
    }

    if (
      !/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(
        imageData
      )
    ) {
      return fail(
        res,
        400,
        "Receipt must be a valid image."
      );
    }

    /*
      Limit receipt payload.
    */

    if (
      imageData.length >
      10 * 1024 * 1024
    ) {
      return fail(
        res,
        413,
        "Receipt image is too large."
      );
    }

    try {
      /*
      ---------------------------------------------------
      FIND USER
      ---------------------------------------------------
      */

      const users =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            telegram_id:
              `eq.${telegramId}`,
            limit: 1
          }
        );

      if (
        !Array.isArray(users) ||
        !users.length
      ) {
        return fail(
          res,
          404,
          "Telegram user was not found."
        );
      }

      const user =
        users[0];

      /*
      ---------------------------------------------------
      ALREADY ACTIVE
      ---------------------------------------------------
      */

      if (
        user.account_status ===
        "active"
      ) {
        return res.json({
          success: true,

          alreadyActive: true,

          message:
            "Your account is already active.",

          user
        });
      }

      /*
      ---------------------------------------------------
      CHECK PENDING RECEIPT
      ---------------------------------------------------
      */

      const pending =
        await supabase(
          "GET",
          "receipts",
          undefined,
          {
            select:
              "id,status,created_at",

            telegram_id:
              `eq.${telegramId}`,

            status:
              "eq.pending",

            limit: 1
          }
        );

      if (
        Array.isArray(pending) &&
        pending.length
      ) {
        return res.status(
          409
        ).json({
          success: false,

          pending: true,

          message:
            "A receipt is already waiting for review.",

          receipt:
            pending[0]
        });
      }

      /*
      ---------------------------------------------------
      INSERT RECEIPT
      ---------------------------------------------------
      */

      const inserted =
        await supabase(
          "POST",
          "receipts",
          {
            user_id:
              user.id,

            telegram_id:
              telegramId,

            username:
              username ||
              user.username ||
              "",

            amount:
              amount > 0
                ? amount
                : null,

            image_data:
              imageData,

            status:
              "pending"
          }
        );

      const receipt =
        Array.isArray(inserted)
          ? inserted[0]
          : null;

      /*
      ---------------------------------------------------
      UPDATE USER
      ---------------------------------------------------
      */

      await supabase(
        "PATCH",
        "users",
        {
          account_status:
            "pending",

          updated_at:
            now()
        },
        {
          telegram_id:
            `eq.${telegramId}`
        }
      );

      /*
      ---------------------------------------------------
      TELEGRAM NOTIFICATION
      ---------------------------------------------------
      */

      let telegramNotification =
        "not_configured";

      if (
        isConfigured(
          TELEGRAM_BOT_TOKEN
        ) &&
        isConfigured(
          TELEGRAM_CHAT_ID
        )
      ) {
        try {
          await sendTelegramReceipt(
            telegramId,

            username ||
              user.username ||
              "",

            amount,

            imageData,

            receipt?.id
          );

          telegramNotification =
            "sent";
        } catch (telegramError) {
          telegramNotification =
            "failed";

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

        receipt,

        account_status:
          "pending",

        telegramNotification
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,

        error:
          error.message,

        code:
          error.code ||
          "RECEIPT_ERROR",

        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
ADMIN - GET RECEIPTS
=========================================================
*/

app.get(
  "/api/admin/receipts-v2",
  async (req, res) => {
    if (!verifyAdmin(req)) {
      return fail(
        res,
        401,
        "Unauthorized."
      );
    }

    try {
      const receipts =
        await supabase(
          "GET",
          "receipts",
          undefined,
          {
            select: "*",
            order:
              "created_at.desc"
          }
        );

      return res.json({
        success: true,
        receipts:
          Array.isArray(receipts)
            ? receipts
            : []
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,

        error:
          error.message,

        code:
          error.code ||
          "ADMIN_RECEIPTS_ERROR",

        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
ADMIN - REVIEW RECEIPT
=========================================================
*/

app.post(
  "/api/admin/review",
  async (req, res) => {
    if (!verifyAdmin(req)) {
      return fail(
        res,
        401,
        "Unauthorized."
      );
    }

    const receiptId =
      safeString(
        req.body?.receiptId
      );

    const status =
      safeString(
        req.body?.status
      ).toLowerCase();

    if (!receiptId) {
      return fail(
        res,
        400,
        "receiptId is required."
      );
    }

    if (
      ![
        "approved",
        "rejected"
      ].includes(status)
    ) {
      return fail(
        res,
        400,
        "status must be approved or rejected."
      );
    }

    try {
      /*
      ---------------------------------------------------
      GET RECEIPT
      ---------------------------------------------------
      */

      const rows =
        await supabase(
          "GET",
          "receipts",
          undefined,
          {
            select: "*",

            id:
              `eq.${receiptId}`,

            limit: 1
          }
        );

      if (
        !Array.isArray(rows) ||
        !rows.length
      ) {
        return fail(
          res,
          404,
          "Receipt not found."
        );
      }

      const receipt =
        rows[0];

      /*
      ---------------------------------------------------
      ONLY PENDING RECEIPTS
      ---------------------------------------------------
      */

      if (
        receipt.status !==
        "pending"
      ) {
        return res.status(
          409
        ).json({
          success: false,

          error:
            "This receipt has already been reviewed.",

          current_status:
            receipt.status
        });
      }

      const reviewedAt =
        now();

      /*
      ---------------------------------------------------
      UPDATE RECEIPT
      ---------------------------------------------------
      */

      const updated =
        await supabase(
          "PATCH",
          "receipts",
          {
            status,

            reviewed_at:
              reviewedAt
          },
          {
            id:
              `eq.${receiptId}`,

            status:
              "eq.pending"
          }
        );

      if (
        !Array.isArray(updated) ||
        !updated.length
      ) {
        return res.status(
          409
        ).json({
          success: false,

          error:
            "Receipt was already reviewed."
        });
      }

      /*
      ---------------------------------------------------
      UPDATE USER
      ---------------------------------------------------
      */

      try {
        const userFilter =
          receipt.user_id
            ? {
                id:
                  `eq.${receipt.user_id}`
              }
            : {
                telegram_id:
                  `eq.${receipt.telegram_id}`
              };

        await supabase(
          "PATCH",
          "users",
          {
            account_status:
              status ===
              "approved"
                ? "active"
                : "inactive",

            updated_at:
              reviewedAt
          },
          userFilter
        );
      } catch (userError) {
        /*
          Roll back receipt if user update fails.
        */

        try {
          await supabase(
            "PATCH",
            "receipts",
            {
              status:
                "pending",

              reviewed_at:
                null
            },
            {
              id:
                `eq.${receiptId}`,

              status:
                `eq.${status}`
            }
          );
        } catch (_) {}

        throw userError;
      }

      return res.json({
        success: true,

        message:
          status === "approved"
            ? "Receipt approved and user activated."
            : "Receipt rejected.",

        receipt:
          updated[0]
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,

        error:
          error.message,

        code:
          error.code ||
          "ADMIN_REVIEW_ERROR",

        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
ADMIN - GET USERS
=========================================================
*/

app.get(
  "/api/admin/users",
  async (req, res) => {
    if (!verifyAdmin(req)) {
      return fail(
        res,
        401,
        "Unauthorized."
      );
    }

    try {
      const users =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            order:
              "created_at.desc"
          }
        );

      return res.json({
        success: true,

        users:
          Array.isArray(users)
            ? users
            : []
      });
    } catch (error) {
      return res.status(
        error.status || 500
      ).json({
        success: false,

        error:
          error.message,

        details:
          error.details || null
      });
    }
  }
);

/*
=========================================================
ADMIN PAGE
=========================================================
*/

app.get(
  "/admin",
  (req, res) => {
    return res.sendFile(
      path.join(
        __dirname,
        "public",
        "admin.html"
      )
    );
  }
);

/*
=========================================================
STATIC FRONTEND
=========================================================
*/

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    ),
    {
      index: "index.html",

      extensions: [
        "html"
      ]
    }
  )
);

/*
=========================================================
ROOT
=========================================================
*/

app.get(
  "/",
  (req, res) => {
    return res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);

/*
=========================================================
404
=========================================================
*/

app.use(
  (req, res) => {
    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return fail(
        res,
        404,
        "API route not found."
      );
    }

    return res
      .status(404)
      .send(
        "TON Dropy - Page not found."
      );
  }
);

/*
=========================================================
ERROR HANDLER
=========================================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,

      error:
        "Internal server error."
    });
  }
);

/*
=========================================================
VERCEL EXPORT
=========================================================
*/

module.exports = app;

/*
=========================================================
LOCAL DEVELOPMENT
=========================================================
*/

if (
  require.main === module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `TON Dropy Backend running on port ${PORT}`
      );
    }
  );
}
